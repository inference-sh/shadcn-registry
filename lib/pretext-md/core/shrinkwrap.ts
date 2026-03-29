// Shrinkwrap — binary search for the tightest width that preserves line count.
//
// For mixed-font markdown content, this uses the inline layout engine's
// countInlineLines (which uses pretext per-run) rather than pretext's
// single-font layout directly.

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
    // single line — shrinkwrap to content width
    const maxFragWidth = getMaxContentWidth(initial)
    return { width: maxFragWidth, height: initial.height }
  }

  let lo = 1
  let hi = Math.ceil(config.maxWidth)

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2)
    const candidate = measureBlocks(blocks, { ...config, maxWidth: mid })
    if (candidate.height <= initial.height) {
      hi = mid
    } else {
      lo = mid + 1
    }
  }

  const final = measureBlocks(blocks, { ...config, maxWidth: lo })
  return { width: lo, height: final.height }
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
