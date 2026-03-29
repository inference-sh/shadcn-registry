// Shrinkwrap — binary search for the tightest width that preserves total height.

import { parse } from './parser'
import { measureBlocks } from './block-layout'
import type { MeasureConfig, MeasureResult } from './types'

export type ShrinkwrapResult = {
  width: number
  height: number
}

/**
 * Find the tightest width that preserves the same total height.
 * Binary search on width, measuring at each candidate.
 */
export function shrinkwrap(
  markdown: string,
  config: MeasureConfig,
): ShrinkwrapResult {
  const blocks = parse(markdown)
  const initial = measureBlocks(blocks, config)

  if (initial.lineCount <= 1) {
    const maxFragWidth = getMaxContentWidth(initial)
    return { width: maxFragWidth, height: initial.height }
  }

  // Reuse a single config object, mutating maxWidth per iteration
  const searchConfig = { ...config }
  let lo = 1
  let hi = Math.ceil(config.maxWidth)
  let lastHeight = initial.height

  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    searchConfig.maxWidth = mid
    const candidate = measureBlocks(blocks, searchConfig)
    if (candidate.height <= initial.height) {
      hi = mid
      lastHeight = candidate.height
    } else {
      lo = mid + 1
    }
  }

  return { width: lo, height: lastHeight }
}

function getMaxContentWidth(result: MeasureResult): number {
  let max = 0
  for (const block of result.blocks) {
    if (block.lines) {
      for (const line of block.lines) {
        max = Math.max(max, line.width)
      }
    }
  }
  return Math.ceil(max)
}
