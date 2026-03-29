'use client'

import { useMemo, useSyncExternalStore, useCallback, useRef, useEffect } from 'react'
import type { MeasuredBlock } from '../core/types'

type VirtualRange = {
  startIndex: number
  endIndex: number
  offsetBefore: number
  offsetAfter: number
  visibleBlocks: MeasuredBlock[]
  totalHeight: number
  renderedCount: number
  totalCount: number
}

const OVERSCAN = 3 // render a few extra blocks above/below viewport

/**
 * Given measured blocks with known y/height, return only the visible range
 * for the current scroll position. Pure arithmetic — no DOM measurement.
 */
export function useVirtualize(
  blocks: MeasuredBlock[],
  scrollTop: number,
  viewportHeight: number,
  gap: number = 12,
): VirtualRange {
  return useMemo(() => {
    if (blocks.length === 0 || viewportHeight <= 0) {
      return {
        startIndex: 0,
        endIndex: 0,
        offsetBefore: 0,
        offsetAfter: 0,
        visibleBlocks: [],
        totalHeight: 0,
        renderedCount: 0,
        totalCount: 0,
      }
    }

    const last = blocks[blocks.length - 1]!
    const totalHeight = last.y + last.height

    // Binary search for first visible block
    const viewTop = scrollTop
    const viewBottom = scrollTop + viewportHeight

    let startIndex = bsearchFirst(blocks, viewTop)
    let endIndex = bsearchLast(blocks, viewBottom)

    // Apply overscan
    startIndex = Math.max(0, startIndex - OVERSCAN)
    endIndex = Math.min(blocks.length - 1, endIndex + OVERSCAN)

    const firstBlock = blocks[startIndex]!
    const lastBlock = blocks[endIndex]!
    const offsetBefore = firstBlock.y + (startIndex > 0 ? gap * startIndex : 0)
    const renderedBottom = lastBlock.y + lastBlock.height + gap * endIndex
    const offsetAfter = Math.max(0, totalHeight + gap * (blocks.length - 1) - renderedBottom)

    return {
      startIndex,
      endIndex: endIndex + 1, // exclusive
      offsetBefore: firstBlock.y,
      offsetAfter: Math.max(0, (totalHeight + gap * (blocks.length - 1)) - (lastBlock.y + lastBlock.height)),
      visibleBlocks: blocks.slice(startIndex, endIndex + 1),
      totalHeight: totalHeight + gap * (blocks.length - 1),
      renderedCount: endIndex - startIndex + 1,
      totalCount: blocks.length,
    }
  }, [blocks, scrollTop, viewportHeight, gap])
}

// Find first block whose bottom edge is >= target
function bsearchFirst(blocks: MeasuredBlock[], target: number): number {
  let lo = 0
  let hi = blocks.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    const block = blocks[mid]!
    if (block.y + block.height < target) {
      lo = mid + 1
    } else {
      hi = mid
    }
  }
  return lo
}

// Find last block whose top edge is <= target
function bsearchLast(blocks: MeasuredBlock[], target: number): number {
  let lo = 0
  let hi = blocks.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >>> 1
    const block = blocks[mid]!
    if (block.y > target) {
      hi = mid - 1
    } else {
      lo = mid
    }
  }
  return lo
}

/**
 * Hook to track scroll position of a container element.
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

  const getSnapshot = useCallback(() => scrollTopRef.current, [])

  return useSyncExternalStore(subscribe, getSnapshot, () => 0)
}
