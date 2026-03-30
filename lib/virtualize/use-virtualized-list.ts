'use client'

import { useMemo, useCallback, useRef, useState, useLayoutEffect } from 'react'
import type { VirtualItem, PositionedItem } from './types'
import { positionItems } from './measure'
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

  // Height cache: used for spacer sizing. Survives unmount.
  const heightCache = useRef(new Map<string | number, number>())

  // Baseline: first measured height per item (= collapsed state).
  // On unmount, cache resets to baseline so spacer matches remount height.
  const baseline = useRef(new Map<string | number, number>())

  // Version counter — bumped (max once per frame) when cache changes.
  const [version, setVersion] = useState(0)
  const rafScheduled = useRef(false)

  function scheduleVersionBump() {
    if (rafScheduled.current) return
    rafScheduled.current = true
    requestAnimationFrame(() => {
      rafScheduled.current = false
      setVersion(v => v + 1)
    })
  }

  // Pending scroll correction from unmount resets.
  const pendingCorrection = useRef(0)

  // Apply correction before paint.
  useLayoutEffect(() => {
    if (pendingCorrection.current !== 0) {
      const el = getScrollEl()
      if (el) el.scrollTop += pendingCorrection.current
      pendingCorrection.current = 0
    }
  })

  // Position items using cached heights (falls back to strategy).
  const { positioned, totalHeight } = useMemo(
    () => positionItems(items, width, gap, heightCache.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, width, gap, version],
  )

  // Y-position lookup for "above viewport?" check
  const yLookup = useRef(new Map<string | number, number>())
  useMemo(() => {
    const m = yLookup.current
    m.clear()
    for (const p of positioned) m.set(p.id, p.y)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positioned])

  const virtual = useVirtualize(positioned, scroll.scrollTop, viewportHeight)

  // --- Single ResizeObserver ---

  const roRef = useRef<ResizeObserver | null>(null)
  const elementToId = useRef(new Map<Element, string | number>())

  if (!roRef.current && typeof ResizeObserver !== 'undefined') {
    roRef.current = new ResizeObserver((entries) => {
      let changed = false
      for (const entry of entries) {
        const id = elementToId.current.get(entry.target)
        if (id === undefined) continue
        const h = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height

        // Set baseline on first measurement (collapsed height)
        if (!baseline.current.has(id)) {
          baseline.current.set(id, h)
        }

        const prev = heightCache.current.get(id)
        if (prev !== undefined && Math.abs(prev - h) < 1) continue
        heightCache.current.set(id, h)
        changed = true
      }
      if (changed) scheduleVersionBump()
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
        // Reset baseline so next RO callback captures fresh collapsed height
        baseline.current.delete(id)
        ro?.observe(el)
      } else {
        // Unmount
        const prev = itemElements.current.get(id)
        if (prev && ro) {
          ro.unobserve(prev)
          elementToId.current.delete(prev)
        }
        itemElements.current.delete(id)

        // Reset cache to baseline (collapsed height).
        // If item was expanded, correct scrollTop.
        const cached = heightCache.current.get(id)
        const base = baseline.current.get(id)
        if (cached !== undefined && base !== undefined && Math.abs(cached - base) > 1) {
          heightCache.current.set(id, base)

          // Scroll correction only if item above viewport
          const scrollEl = getScrollEl()
          if (scrollEl) {
            const itemY = yLookup.current.get(id) ?? 0
            if (itemY + cached <= scrollEl.scrollTop) {
              pendingCorrection.current += base - cached
              scheduleVersionBump()
            }
          }
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
        baseline.current.delete(id)
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
