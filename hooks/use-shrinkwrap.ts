'use client'

import { useMemo } from 'react'
import { prepare, layout, type PreparedText } from '@chenglou/pretext'

/**
 * font string must match the CSS font shorthand for the element being measured.
 * e.g. '14px "DM Sans", sans-serif'
 */
const DEFAULT_FONT = '14px "DM Sans", sans-serif'
const DEFAULT_LINE_HEIGHT = 20

/**
 * computes the tightest bubble width that preserves line count.
 * returns undefined if text is empty or single-line (no shrinkwrap needed).
 */
function shrinkwrap(
  prepared: PreparedText,
  maxWidth: number,
  lineHeight: number,
): number | undefined {
  if (maxWidth <= 0) return undefined

  const initial = layout(prepared, maxWidth, lineHeight)
  if (initial.lineCount <= 1) return undefined

  let lo = 1
  let hi = Math.ceil(maxWidth)

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (layout(prepared, mid, lineHeight).lineCount <= initial.lineCount) {
      hi = mid
    } else {
      lo = mid + 1
    }
  }

  return lo
}

/**
 * hook that returns the tightest pixel width for a text string
 * that preserves the same line count as the original max width.
 *
 * returns undefined when shrinkwrap isn't needed (empty, single line).
 */
export function useShrinkwrap(
  text: string | undefined,
  maxWidth: number,
  options?: {
    font?: string
    lineHeight?: number
    /** horizontal padding on each side (default: 12 for p-3) */
    paddingX?: number
  },
): number | undefined {
  const font = options?.font ?? DEFAULT_FONT
  const lineHeight = options?.lineHeight ?? DEFAULT_LINE_HEIGHT
  const paddingX = options?.paddingX ?? 12

  return useMemo(() => {
    if (!text?.trim()) return undefined
    const contentWidth = maxWidth - paddingX * 2
    if (contentWidth <= 0) return undefined

    const prepared = prepare(text, font)
    const tightContentWidth = shrinkwrap(prepared, contentWidth, lineHeight)
    if (tightContentWidth === undefined) return undefined

    return tightContentWidth + paddingX * 2
  }, [text, maxWidth, paddingX, font, lineHeight])
}
