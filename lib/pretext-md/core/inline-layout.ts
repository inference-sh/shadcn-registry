// Mixed-font inline layout engine
//
// Based on chenglou's rich-note demo pattern:
// - Flatten inline items to prepared runs
// - Layout lines greedily with layoutNextLine per run
// - Use leadingGap (marginLeft) for inter-fragment spacing instead of absolute x
// - Trim text, convert boundary whitespace to measured gaps

import {
  prepareWithSegments,
  layoutNextLine,
  walkLineRanges,
  type PreparedTextWithSegments,
  type LayoutCursor,
} from '@chenglou/pretext'
import type {
  InlineItem,
  FontConfig,
  FontStyle,
  MeasuredLine,
  LineFragment,
} from './types'

// --- Internal types ---

type PreparedTextItem = {
  kind: 'text'
  font: string
  fontStyle: FontStyle
  chromeWidth: number
  endCursor: LayoutCursor
  fullText: string
  fullWidth: number
  leadingGap: number
  prepared: PreparedTextWithSegments
  href?: string
  isCode?: boolean
  isStrikethrough?: boolean
}

type PreparedBreakItem = {
  kind: 'break'
}

type PreparedItem = PreparedTextItem | PreparedBreakItem

// --- Constants ---

const LINE_START: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
const UNBOUNDED = 100_000
const CODE_CHROME_WIDTH = 8 // 4px padding each side

// --- Measurement helpers ---

const collapsedSpaceWidthCache = new Map<string, number>()

function measureSingleLineWidth(prepared: PreparedTextWithSegments): number {
  let maxWidth = 0
  walkLineRanges(prepared, UNBOUNDED, line => {
    if (line.width > maxWidth) maxWidth = line.width
  })
  return maxWidth
}

function getCollapsedSpaceWidth(font: string): number {
  const cached = collapsedSpaceWidthCache.get(font)
  if (cached !== undefined) return cached
  const joined = measureSingleLineWidth(prepareWithSegments('A A', font))
  const compact = measureSingleLineWidth(prepareWithSegments('AA', font))
  const w = Math.max(0, joined - compact)
  collapsedSpaceWidthCache.set(font, w)
  return w
}

// Resolve FontStyle to CSS font string
function resolveFont(style: FontStyle, fonts: FontConfig): string {
  switch (style) {
    case 'body': return fonts.body
    case 'bold': return fonts.bold
    case 'italic': return fonts.italic
    case 'boldItalic': return fonts.boldItalic
    case 'strikethrough': return fonts.body
  }
}

// --- Flatten + prepare ---
// Two-pass: first flatten the inline tree to raw runs (preserving gap state
// across link boundaries), then prepare each run with pretext.

type RawRun =
  | { kind: 'text'; text: string; font: string; fontStyle: FontStyle; href?: string; isCode?: boolean; isStrikethrough?: boolean; chromeWidth: number }
  | { kind: 'break' }

function flattenRuns(items: InlineItem[], fonts: FontConfig, out: RawRun[], parentHref?: string): void {
  for (const item of items) {
    switch (item.kind) {
      case 'text':
        out.push({
          kind: 'text',
          text: item.text,
          font: resolveFont(item.font, fonts),
          fontStyle: item.font,
          href: parentHref,
          isStrikethrough: item.font === 'strikethrough',
          chromeWidth: 0,
        })
        break
      case 'code':
        out.push({
          kind: 'text',
          text: item.text,
          font: fonts.code,
          fontStyle: 'body',
          href: parentHref,
          isCode: true,
          chromeWidth: CODE_CHROME_WIDTH,
        })
        break
      case 'link':
        flattenRuns(item.items, fonts, out, item.href)
        break
      case 'break':
        out.push({ kind: 'break' })
        break
    }
  }
}

function prepareRuns(runs: RawRun[]): PreparedItem[] {
  const out: PreparedItem[] = []
  let pendingGap = 0

  for (const run of runs) {
    if (run.kind === 'break') {
      out.push({ kind: 'break' })
      pendingGap = 0
      continue
    }

    const hasLeading = /^\s/.test(run.text)
    const hasTrailing = /\s$/.test(run.text)
    const trimmed = run.text.trim()
    const carryGap = pendingGap
    pendingGap = hasTrailing ? getCollapsedSpaceWidth(run.font) : 0
    if (trimmed.length === 0) continue

    const prepared = prepareWithSegments(trimmed, run.font)
    const wholeLine = layoutNextLine(prepared, LINE_START, UNBOUNDED)
    if (wholeLine === null) continue

    out.push({
      kind: 'text',
      font: run.font,
      fontStyle: run.fontStyle,
      chromeWidth: run.chromeWidth,
      endCursor: wholeLine.end,
      fullText: wholeLine.text,
      fullWidth: wholeLine.width,
      leadingGap: carryGap > 0 || hasLeading ? getCollapsedSpaceWidth(run.font) : 0,
      prepared,
      href: run.href,
      isCode: run.isCode,
      isStrikethrough: run.isStrikethrough,
    })
  }

  return out
}

function flattenAndPrepare(items: InlineItem[], fonts: FontConfig): PreparedItem[] {
  const runs: RawRun[] = []
  flattenRuns(items, fonts, runs)
  return prepareRuns(runs)
}

// --- Cursor helpers ---

function cursorsMatch(a: LayoutCursor, b: LayoutCursor): boolean {
  return a.segmentIndex === b.segmentIndex && a.graphemeIndex === b.graphemeIndex
}

// --- Line layout ---

export function layoutInline(
  items: InlineItem[],
  maxWidth: number,
  fonts: FontConfig,
  lineHeight: number,
): MeasuredLine[] {
  const prepared = flattenAndPrepare(items, fonts)
  if (prepared.length === 0) return []

  const lineRanges = layoutLineRanges(prepared, maxWidth)
  return lineRanges.map((range, i) => {
    const line: MeasuredLine = {
      fragments: null!,
      width: range.width,
      y: i * lineHeight,
    }
    // Lazy: fragments are materialized on first access.
    // Offscreen lines never pay the string allocation cost.
    let cached: LineFragment[] | null = null
    Object.defineProperty(line, 'fragments', {
      get() {
        if (cached === null) cached = materializeRange(prepared, range)
        return cached
      },
      enumerable: true,
    })
    return line
  })
}

// --- Line range types (lazy materialization) ---
// The layout pass produces ranges (cursor positions + widths) without
// allocating fragment text. Materialization runs only for visible lines.

type FragmentRange = {
  itemIndex: number       // index into prepared items array
  startCursor: LayoutCursor | null  // null = whole item (fast path)
  endCursor: LayoutCursor
  width: number
  leadingGap: number
  availableWidth: number  // text width offered during layout (for re-layout during materialization)
}

type LineRange = {
  fragmentRanges: FragmentRange[]
  width: number
}

function layoutLineRanges(items: PreparedItem[], maxWidth: number): LineRange[] {
  const lines: LineRange[] = []
  const safeWidth = Math.max(1, maxWidth)

  let itemIdx = 0
  let textCursor: LayoutCursor | null = null

  while (itemIdx < items.length) {
    const item = items[itemIdx]!

    if (item.kind === 'break') {
      lines.push({ fragmentRanges: [], width: 0 })
      itemIdx++
      textCursor = null
      continue
    }

    const ranges: FragmentRange[] = []
    let lineWidth = 0
    let remainingWidth = safeWidth

    lineLoop:
    while (itemIdx < items.length) {
      const item = items[itemIdx]!
      if (item.kind === 'break') break lineLoop

      if (textCursor !== null && cursorsMatch(textCursor, item.endCursor)) {
        itemIdx++
        textCursor = null
        continue
      }

      const leadingGap = ranges.length === 0 ? 0 : item.leadingGap
      const reservedWidth = leadingGap + item.chromeWidth

      if (ranges.length > 0 && reservedWidth >= remainingWidth) break lineLoop

      // Fast path: entire item fits
      if (textCursor === null) {
        const fullWidth = leadingGap + item.fullWidth + item.chromeWidth
        if (fullWidth <= remainingWidth) {
          ranges.push({
            itemIndex: itemIdx,
            startCursor: null, // null = whole item
            endCursor: item.endCursor,
            width: item.fullWidth + item.chromeWidth,
            leadingGap,
            availableWidth: UNBOUNDED,
          })
          lineWidth += fullWidth
          remainingWidth = Math.max(0, safeWidth - lineWidth)
          itemIdx++
          continue
        }
      }

      // Slow path: break item
      const startCursor = textCursor ?? LINE_START
      const availableWidth = Math.max(1, remainingWidth - reservedWidth)
      const line = layoutNextLine(item.prepared, startCursor, availableWidth)

      if (line === null) { itemIdx++; textCursor = null; continue }
      if (cursorsMatch(startCursor, line.end)) {
        if (ranges.length > 0) break lineLoop
        itemIdx++; textCursor = null; continue
      }

      // Guard against mid-word breaking when not first on line
      if (ranges.length > 0 && line.end.graphemeIndex > 0) {
        const fullLine = layoutNextLine(item.prepared, startCursor, safeWidth - item.chromeWidth)
        if (fullLine && !cursorsMatch(line.end, fullLine.end)) {
          break lineLoop
        }
      }

      ranges.push({
        itemIndex: itemIdx,
        startCursor,
        endCursor: line.end,
        width: line.width + item.chromeWidth,
        leadingGap,
        availableWidth,
      })
      lineWidth += leadingGap + line.width + item.chromeWidth
      remainingWidth = Math.max(0, safeWidth - lineWidth)

      if (cursorsMatch(line.end, item.endCursor)) {
        itemIdx++; textCursor = null; continue
      }
      textCursor = line.end
      break lineLoop
    }

    if (ranges.length === 0) break
    lines.push({ fragmentRanges: ranges, width: lineWidth })
  }

  return lines
}

// Materialize a single line range into actual fragment objects.
// Called lazily — only when the renderer accesses .fragments on a visible line.
function materializeRange(items: PreparedItem[], range: LineRange): LineFragment[] {
  return range.fragmentRanges.map(fr => {
    const item = items[fr.itemIndex]! as PreparedTextItem
    let text: string
    if (fr.startCursor === null) {
      // Fast path: whole item was placed intact
      text = item.fullText
    } else {
      // Partial item: re-layout at the same available width to reproduce the break
      const line = layoutNextLine(item.prepared, fr.startCursor, fr.availableWidth)
      text = line?.text ?? ''
    }
    return {
      text,
      width: fr.width,
      font: item.font,
      fontStyle: item.fontStyle,
      href: item.href,
      isCode: item.isCode,
      isStrikethrough: item.isStrikethrough,
      leadingGap: fr.leadingGap,
    }
  })
}

/**
 * Quick line count — same range algorithm, no materialization.
 */
export function countInlineLines(
  items: InlineItem[],
  maxWidth: number,
  fonts: FontConfig,
): number {
  const prepared = flattenAndPrepare(items, fonts)
  if (prepared.length === 0) return 0
  return layoutLineRanges(prepared, maxWidth).length
}
