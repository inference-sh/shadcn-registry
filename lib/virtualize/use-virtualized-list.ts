'use client'

import { useMemo, useCallback, useRef, useState, useEffect, useLayoutEffect } from 'react'
import { flushSync } from 'react-dom'
import type { VirtualItem, PositionedItem } from './types'
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
  // On unmount, we reset heightCache to baseline and correct scrollTop by the delta.
  // Without this, the spacer would keep the expanded height, causing a jump on remount.
  //
  // Why scheduleFlush (flushSync) exists: the spacer update and scrollTop correction
  // must happen in the same paint frame. If they're split across frames, the user sees
  // a 1-frame flicker (spacer shrinks, then scrollTop corrects). flushSync forces
  // React to re-render synchronously inside a microtask, so useLayoutEffect can apply
  // the scrollTop correction before the browser paints. This only fires on the rare
  // expand→scroll-away path — normal scrolling uses the cheap rAF path.
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

  // Expand→unmount path: microtask + flushSync for atomic spacer + scroll correction
  const flushScheduled = useRef(false)
  function scheduleFlush() {
    if (flushScheduled.current) return
    flushScheduled.current = true
    queueMicrotask(() => {
      flushScheduled.current = false
      flushSync(() => setVersion(v => v + 1))
    })
  }

  const pendingCorrection = useRef(0)

  useLayoutEffect(() => {
    if (pendingCorrection.current !== 0) {
      const el = getScrollEl()
      if (el) el.scrollTop += pendingCorrection.current
      pendingCorrection.current = 0
    }
  })

  // Clear measured height cache when width changes — cached heights are stale at new width.
  const prevWidth = useRef(width)
  if (prevWidth.current !== width) {
    heightCache.current.clear()
    baselineCache.current.clear()
    prevWidth.current = width
  }

  // Precompute strategy heights once per items/width change.
  const strategyHeights = useMemo(() => {
    const m = new Map<string | number, number>()
    for (const item of items) {
      m.set(item.id, resolveHeight(item.strategy, width))
    }
    return m
  }, [items, width])

  // Position items using cached heights → strategy fallback.
  const { positioned, totalHeight } = useMemo(
    () => positionItems(items, width, gap, heightCache.current, strategyHeights),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, width, gap, version, strategyHeights],
  )

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

  // Disconnect RO on unmount to prevent leaks
  useEffect(() => () => { roRef.current?.disconnect() }, [])

  if (!roRef.current && typeof ResizeObserver !== 'undefined') {
    roRef.current = new ResizeObserver((entries) => {
      let changed = false
      for (const entry of entries) {
        const id = elementToId.current.get(entry.target)
        if (id === undefined) continue
        const h = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height

        // Set baseline on first measurement (collapsed height)
        if (!baselineCache.current.has(id)) {
          baselineCache.current.set(id, h)
        }

        const prev = heightCache.current.get(id)
        if (prev !== undefined && Math.abs(prev - h) < 1) continue
        heightCache.current.set(id, h)
        changed = true
      }
      if (changed) {
        for (const entry of entries) {
          const id = elementToId.current.get(entry.target)
          if (id === undefined) continue
          const h = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height
          const strategy = strategyHeights.get(id)
          if (strategy !== undefined && Math.abs(h - strategy) > 1) {
            console.log(`[ro] id=${id} strategy=${strategy} dom=${Math.round(h)} diff=${Math.round(h - strategy)}`)
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
        // Reset baseline for fresh collapsed measurement
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
          // Reset cache to baseline (what remount will render)
          heightCache.current.set(id, base)

          // Scroll correction only if item was above viewport
          const scrollEl = getScrollEl()
          if (scrollEl) {
            const itemY = yLookupRef.current.get(id) ?? 0
            if (itemY + cached <= scrollEl.scrollTop) {
              pendingCorrection.current += base - cached
            }
          }

          // Atomic: spacer update + scroll correction in same paint frame
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
