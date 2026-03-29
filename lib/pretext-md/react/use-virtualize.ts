'use client'

import { useMemo, useSyncExternalStore, useCallback, useRef } from 'react'

type Positioned = { y: number; height: number }

export type VirtualRange<T extends Positioned> = {
  startIndex: number
  endIndex: number   // exclusive
  items: T[]
  totalHeight: number
  renderedCount: number
  totalCount: number
}

const OVERSCAN = 3

/**
 * Given items with known y/height, return only the visible range
 * for the current scroll position. Pure arithmetic — no DOM measurement.
 */
export function useVirtualize<T extends Positioned>(
  items: T[],
  scrollTop: number,
  viewportHeight: number,
): VirtualRange<T> {
  return useMemo(() => {
    if (items.length === 0 || viewportHeight <= 0) {
      return { startIndex: 0, endIndex: 0, items: [], totalHeight: 0, renderedCount: 0, totalCount: 0 }
    }

    const last = items[items.length - 1]!
    const totalHeight = last.y + last.height

    let start = bsearchFirst(items, scrollTop)
    let end = bsearchLast(items, scrollTop + viewportHeight)

    start = Math.max(0, start - OVERSCAN)
    end = Math.min(items.length, end + OVERSCAN + 1) // exclusive

    return {
      startIndex: start,
      endIndex: end,
      items: items.slice(start, end),
      totalHeight,
      renderedCount: end - start,
      totalCount: items.length,
    }
  }, [items, scrollTop, viewportHeight])
}

function bsearchFirst(items: Positioned[], target: number): number {
  let lo = 0, hi = items.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (items[mid]!.y + items[mid]!.height < target) lo = mid + 1
    else hi = mid
  }
  return lo
}

function bsearchLast(items: Positioned[], target: number): number {
  let lo = 0, hi = items.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >>> 1
    if (items[mid]!.y > target) hi = mid - 1
    else lo = mid
  }
  return lo
}

/**
 * Track scroll position of a container element.
 */
export function useScrollTop(ref: React.RefObject<HTMLElement | null>): number {
  const scrollTopRef = useRef(0)

  const subscribe = useCallback(
    (cb: () => void) => {
      const el = ref.current
      if (!el) return () => {}
      const handler = () => {
        scrollTopRef.current = el.scrollTop
        cb()
      }
      el.addEventListener('scroll', handler, { passive: true })
      return () => el.removeEventListener('scroll', handler)
    },
    [ref],
  )

  return useSyncExternalStore(subscribe, useCallback(() => scrollTopRef.current, []), () => 0)
}
