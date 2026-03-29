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
  className: string
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

function prepareRuns(runs: RawRun[], fonts: FontConfig): PreparedItem[] {
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
      className: '',
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
  return prepareRuns(runs, fonts)
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

  const lines = layoutPreparedItems(prepared, maxWidth)
  return lines.map((line, i) => ({
    fragments: line.fragments,
    width: line.width,
    y: i * lineHeight,
  }))
}

type RawLine = {
  fragments: LineFragment[]
  width: number
}

function layoutPreparedItems(items: PreparedItem[], maxWidth: number): RawLine[] {
  const lines: RawLine[] = []
  const safeWidth = Math.max(1, maxWidth)

  let itemIndex = 0
  let textCursor: LayoutCursor | null = null

  while (itemIndex < items.length) {
    const item = items[itemIndex]!

    // Handle hard breaks
    if (item.kind === 'break') {
      lines.push({ fragments: [], width: 0 })
      itemIndex++
      textCursor = null
      continue
    }

    const fragments: LineFragment[] = []
    let lineWidth = 0
    let remainingWidth = safeWidth

    lineLoop:
    while (itemIndex < items.length) {
      const item = items[itemIndex]!
      if (item.kind === 'break') break lineLoop

      // Skip exhausted items
      if (textCursor !== null && cursorsMatch(textCursor, item.endCursor)) {
        itemIndex++
        textCursor = null
        continue
      }

      const leadingGap = fragments.length === 0 ? 0 : item.leadingGap
      const reservedWidth = leadingGap + item.chromeWidth

      // Can't even fit the chrome on this line
      if (fragments.length > 0 && reservedWidth >= remainingWidth) break lineLoop

      // Fast path: entire item fits on this line
      if (textCursor === null) {
        const fullWidth = leadingGap + item.fullWidth + item.chromeWidth
        if (fullWidth <= remainingWidth) {
          fragments.push({
            text: item.fullText,
            x: 0, // not used in gap-based layout
            width: item.fullWidth + item.chromeWidth,
            font: item.font,
            fontStyle: item.fontStyle,
            href: item.href,
            isCode: item.isCode,
            isStrikethrough: item.isStrikethrough,
            leadingGap,
          })
          lineWidth += fullWidth
          remainingWidth = Math.max(0, safeWidth - lineWidth)
          itemIndex++
          continue
        }
      }

      // Slow path: need to break this item
      const startCursor = textCursor ?? LINE_START
      const availableWidth = Math.max(1, remainingWidth - reservedWidth)
      const line = layoutNextLine(item.prepared, startCursor, availableWidth)

      if (line === null) {
        itemIndex++
        textCursor = null
        continue
      }
      if (cursorsMatch(startCursor, line.end)) {
        if (fragments.length > 0) break lineLoop
        itemIndex++
        textCursor = null
        continue
      }

      // Guard against character-level word breaking only.
      // graphemeIndex > 0 means pretext broke mid-word (character level).
      // graphemeIndex === 0 means it broke at a word/segment boundary — that's fine.
      if (fragments.length > 0 && line.end.graphemeIndex > 0) {
        const fullLine = layoutNextLine(item.prepared, startCursor, safeWidth - item.chromeWidth)
        if (fullLine && !cursorsMatch(line.end, fullLine.end)) {
          break lineLoop
        }
      }

      fragments.push({
        text: line.text,
        x: 0,
        width: line.width + item.chromeWidth,
        font: item.font,
        fontStyle: item.fontStyle,
        href: item.href,
        isCode: item.isCode,
        isStrikethrough: item.isStrikethrough,
        leadingGap,
      })
      lineWidth += leadingGap + line.width + item.chromeWidth
      remainingWidth = Math.max(0, safeWidth - lineWidth)

      if (cursorsMatch(line.end, item.endCursor)) {
        // Item fully consumed
        itemIndex++
        textCursor = null
        continue
      }

      // Item continues on next line
      textCursor = line.end
      break lineLoop
    }

    if (fragments.length === 0) break
    lines.push({ fragments, width: lineWidth })
  }

  return lines
}

/**
 * Quick line count — same algorithm, no fragment allocation.
 */
export function countInlineLines(
  items: InlineItem[],
  maxWidth: number,
  fonts: FontConfig,
): number {
  const prepared = flattenAndPrepare(items, fonts)
  if (prepared.length === 0) return 0
  return layoutPreparedItems(prepared, maxWidth).length
}
