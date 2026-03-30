'use client'

import { useMemo, useState, useCallback, useRef } from 'react'

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
    end = Math.min(items.length, end + OVERSCAN + 1)

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
 * Track scroll position. Returns [scrollTop, refCallback].
 * Pass refCallback as the scroll container's ref.
 */
export type ScrollState = {
  scrollTop: number
  refCallback: (el: HTMLDivElement | null) => void
  getElement: () => HTMLDivElement | null
}

export function useScrollState(): ScrollState {
  const [scrollTop, setScrollTop] = useState(0)
  const elRef = useRef<HTMLDivElement | null>(null)
  const handlerRef = useRef(() => {
    if (elRef.current) setScrollTop(elRef.current.scrollTop)
  })

  const refCallback = useCallback((el: HTMLDivElement | null) => {
    if (elRef.current) {
      elRef.current.removeEventListener('scroll', handlerRef.current)
    }
    elRef.current = el
    if (el) {
      el.addEventListener('scroll', handlerRef.current, { passive: true })
      setScrollTop(el.scrollTop)
    }
  }, [])

  const getElement = useCallback(() => elRef.current, [])

  return { scrollTop, refCallback, getElement }
}
