'use client'

import { useMemo, useCallback, useRef, useState, useEffect, useLayoutEffect } from 'react'
import { flushSync } from 'react-dom'
import type { VirtualItem, PositionedItem, MeasureStrategy } from './types'
import { positionItems, resolveHeight } from './measure'
import { useVirtualize, useScrollState } from '@/hooks/use-virtualize'

export type VirtualizedListResult<T> = {
  items: PositionedItem<T>[]
  totalHeight: number
  renderedCount: number
  totalCount: number
  topSpacer: number
  bottomSpacer: number
  scrollRef: (el: HTMLDivElement | null) => void
  /** Stable ref callback per item id. Attach to each item's wrapper element. */
  getItemRef: (id: string | number) => (el: HTMLElement | null) => void
}

export function useVirtualizedList<T>(
  items: VirtualItem<T>[],
  viewportHeight: number,
  width: number,
  gap: number = 0,
): VirtualizedListResult<T> {
  const scroll = useScrollState()
  const getScrollEl = scroll.getElement

  // --- Height tracking ---
  // heightCache: RO-measured DOM heights, used by positionItems for accurate spacers.
  // baselineCache: first measured height per mount (= collapsed state).
  //
  // Why baseline exists: when a user expands a collapsible (e.g. reasoning block),
  // scrolls away (item unmounts), then scrolls back (item remounts collapsed),
  // the spacer must reflect the collapsed height — not the expanded height.
  // On unmount, we reset heightCache to baseline so spacers match remount state.
  //
  // Why scheduleFlush exists: on unmount of an expanded item above the viewport,
  // we need to update spacers AND correct scrollTop atomically. scheduleFlush
  // queues a microtask (runs before paint) that flushSync's a re-render to update
  // spacers, then useLayoutEffect applies the scrollTop correction — all before
  // the browser paints. This only fires on the rare expand→scroll-away path.
  const heightCache = useRef(new Map<string | number, number>())
  const baselineCache = useRef(new Map<string | number, number>())

  const [version, setVersion] = useState(0)

  // Normal path: rAF-batched version bump (cheap, max 1 re-render per frame)
  const rafScheduled = useRef(false)
  function scheduleVersionBump() {
    if (rafScheduled.current) return
    rafScheduled.current = true
    requestAnimationFrame(() => {
      rafScheduled.current = false
      setVersion(v => v + 1)
    })
  }

  // Expand→unmount path: microtask + flushSync for atomic spacer + scroll correction.
  // useLayoutEffect skips while flushPending=true (spacers stale), applies after
  // the flushSync re-render clears the flag (spacers correct).
  const pendingCorrection = useRef(0)
  const flushPending = useRef(false)

  function scheduleFlush() {
    if (flushPending.current) return
    flushPending.current = true
    queueMicrotask(() => {
      flushSync(() => {
        flushPending.current = false
        setVersion(v => v + 1)
      })
    })
  }

  useLayoutEffect(() => {
    if (pendingCorrection.current !== 0 && !flushPending.current) {
      const el = getScrollEl()
      if (el) el.scrollTop += pendingCorrection.current
      pendingCorrection.current = 0
    }
  })

  // On width change: clear RO caches (stale at new width) and save scroll anchor
  // so we can restore position after recomputation.
  const prevWidth = useRef(width)
  const scrollAnchor = useRef<{ itemId: string | number; offset: number } | null>(null)
  const prevPositioned = useRef<PositionedItem<T>[]>([])
  if (prevWidth.current !== width) {
    heightCache.current.clear()
    baselineCache.current.clear()
    // Save anchor: which item is at viewport top + pixel offset into that item
    const scrollEl = getScrollEl()
    const prev = prevPositioned.current
    if (scrollEl && prev.length > 0) {
      const st = scrollEl.scrollTop
      for (const p of prev) {
        if (p.y + p.height > st) {
          scrollAnchor.current = { itemId: p.id, offset: st - p.y }
          break
        }
      }
    }
    prevWidth.current = width
  }

  // Precompute strategy heights incrementally.
  // Cache by (id, strategy ref, width) — only recompute when strategy or width changes.
  // Streaming: only the changed message gets recomputed (strategy ref changed).
  // Width change: all items recompute (width changed), but AST is pre-parsed in strategy.
  const strategyCache = useRef(new Map<string | number, { strategy: MeasureStrategy; width: number; height: number }>())
  const strategyHeights = useMemo(() => {
    const m = new Map<string | number, number>()
    const cache = strategyCache.current
    for (const item of items) {
      const cached = cache.get(item.id)
      if (cached && cached.strategy === item.strategy && cached.width === width) {
        m.set(item.id, cached.height)
      } else {
        const h = resolveHeight(item.strategy, width)
        m.set(item.id, h)
        cache.set(item.id, { strategy: item.strategy, width, height: h })
      }
    }
    return m
  }, [items, width])

  // Position items using cached heights → strategy fallback.
  const { positioned, totalHeight } = useMemo(
    () => positionItems(items, width, gap, heightCache.current, strategyHeights),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, width, gap, version, strategyHeights],
  )

  // Store positioned for scroll anchor on next width change
  prevPositioned.current = positioned

  // Restore scroll position after width change
  useLayoutEffect(() => {
    const anchor = scrollAnchor.current
    if (!anchor) return
    scrollAnchor.current = null
    const scrollEl = getScrollEl()
    if (!scrollEl) return
    // Find the anchored item in new positions
    const item = positioned.find(p => p.id === anchor.itemId)
    if (item) {
      scrollEl.scrollTop = item.y + anchor.offset
    }
  }, [positioned, getScrollEl])

  // Y-position lookup for "above viewport?" check (ref for stable callback access)
  const yLookupRef = useRef(new Map<string | number, number>())
  yLookupRef.current = useMemo(() => {
    const m = new Map<string | number, number>()
    for (const p of positioned) m.set(p.id, p.y)
    return m
  }, [positioned])

  const virtual = useVirtualize(positioned, scroll.scrollTop, viewportHeight)

  // --- Single ResizeObserver ---

  const roRef = useRef<ResizeObserver | null>(null)
  const elementToId = useRef(new Map<Element, string | number>())

  useEffect(() => () => { roRef.current?.disconnect() }, [])

  if (process.env.NODE_ENV === 'development' && !roRef.current) {
    console.log('[virtualize] dev mode active')
  }

  if (!roRef.current && typeof ResizeObserver !== 'undefined') {
    roRef.current = new ResizeObserver((entries) => {
      let changed = false
      for (const entry of entries) {
        const id = elementToId.current.get(entry.target)
        if (id === undefined) continue
        const h = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height

        if (!baselineCache.current.has(id)) {
          baselineCache.current.set(id, h)
        }

        const prev = heightCache.current.get(id)
        if (prev !== undefined && Math.abs(prev - h) < 1) continue
        heightCache.current.set(id, h)
        changed = true
      }
      if (changed) {
        if (process.env.NODE_ENV === 'development') {
          for (const entry of entries) {
            const id = elementToId.current.get(entry.target)
            if (id === undefined) continue
            const h = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height
            const strategy = strategyHeights.get(id)
            if (strategy !== undefined && Math.abs(h - strategy) > 2) {
              console.warn(`[virtualize] height drift: id=${id} strategy=${Math.round(strategy)} actual=${Math.round(h)} diff=${Math.round(h - strategy)}px`)
            }
          }
        }
        scheduleVersionBump()
      }
    })
  }

  // --- Stable ref callbacks per item id ---

  const refCallbacks = useRef(new Map<string | number, (el: HTMLElement | null) => void>())
  const itemElements = useRef(new Map<string | number, HTMLElement>())

  const getItemRef = useCallback((id: string | number) => {
    let cb = refCallbacks.current.get(id)
    if (cb) return cb

    cb = (el: HTMLElement | null) => {
      const ro = roRef.current
      if (el) {
        const prev = itemElements.current.get(id)
        if (prev === el) return
        if (prev && ro) {
          ro.unobserve(prev)
          elementToId.current.delete(prev)
        }
        itemElements.current.set(id, el)
        elementToId.current.set(el, id)
        baselineCache.current.delete(id)
        ro?.observe(el)
      } else {
        // Unmount
        const prev = itemElements.current.get(id)
        if (prev && ro) {
          ro.unobserve(prev)
          elementToId.current.delete(prev)
        }
        itemElements.current.delete(id)

        // If item was expanded beyond baseline, reset + correct
        const cached = heightCache.current.get(id)
        const base = baselineCache.current.get(id)
        if (cached !== undefined && base !== undefined && Math.abs(cached - base) > 1) {
          heightCache.current.set(id, base)

          // Scroll correction only if item was above viewport
          const scrollEl = getScrollEl()
          if (scrollEl) {
            const itemY = yLookupRef.current.get(id) ?? 0
            if (itemY + cached <= scrollEl.scrollTop) {
              pendingCorrection.current += base - cached
            }
          }

          scheduleFlush()
        }
      }
    }

    refCallbacks.current.set(id, cb)
    return cb
  }, [getScrollEl])

  // Cleanup stale entries when items removed from list entirely
  const prevItemIds = useRef(new Set<string | number>())
  const currentIds = useMemo(() => new Set(items.map(i => i.id)), [items])
  if (prevItemIds.current !== currentIds) {
    for (const id of prevItemIds.current) {
      if (!currentIds.has(id)) {
        refCallbacks.current.delete(id)
        heightCache.current.delete(id)
        baselineCache.current.delete(id)
      }
    }
    prevItemIds.current = currentIds
  }

  // Spacers
  const topSpacer = virtual.items.length > 0 ? virtual.items[0]!.y : 0
  const bottomSpacer = virtual.items.length > 0
    ? Math.max(0, totalHeight - (virtual.items[virtual.items.length - 1]!.y + virtual.items[virtual.items.length - 1]!.height))
    : 0

  return {
    items: virtual.items,
    totalHeight,
    renderedCount: virtual.renderedCount,
    totalCount: virtual.totalCount,
    topSpacer,
    bottomSpacer,
    scrollRef: scroll.refCallback,
    getItemRef,
  }
}
