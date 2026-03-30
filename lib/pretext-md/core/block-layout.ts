// Block layout coordinator
//
// Stacks blocks vertically, delegates inline measurement to the inline layout engine.
// Block types like code-block, image, hr are measured by plugins — the coordinator
// only handles paragraph, heading, list, blockquote natively.

import {
  prepareWithSegments,
  layoutNextLine,
  type LayoutCursor,
} from '@chenglou/pretext'
import { splitLines } from '@/components/infsh/code-block/utils'
import { layoutInline } from './inline-layout'
import type {
  BlockNode,
  CodeBlockNode,
  MeasuredBlock,
  MeasuredLine,
  MeasureConfig,
  MeasureResult,
  FontConfig,
  LineHeightConfig,
  HeadingNode,
  EmbedPlugin,
  EmbedMeasurement,
} from './types'

// Uniform gap between all blocks — like space-y on a flex container.
// Blocks own zero margin; the coordinator owns all spacing.
const BLOCK_GAP = 12
// hr default height (overridable by plugin)
const HR_HEIGHT = 1
// blockquote left padding + border
const BLOCKQUOTE_INDENT = 20
// list item indent
const LIST_INDENT = 24

// Code block chrome dimensions (must match renderer CSS)
export const CODE_BLOCK = {
  headerHeight: 33,  // py-2 (16px) + text-xs line (16px) + border-b (1px)
  paddingX: 32,      // p-4 left + right
  paddingY: 32,      // p-4 top + bottom
  border: 2,         // border top + bottom
} as const

const CODE_LINE_START: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
const CODE_UNBOUNDED = 100_000

function getHeadingFont(level: HeadingNode['level']): keyof FontConfig {
  return `h${level}` as keyof FontConfig
}

function getHeadingLineHeight(level: HeadingNode['level'], lineHeights: LineHeightConfig): number {
  return lineHeights[`h${level}` as keyof LineHeightConfig]
}

/**
 * Try to measure a block with a matching plugin.
 * Returns the measurement if a plugin matches, null otherwise.
 */
function tryPluginMeasure(
  block: BlockNode,
  maxWidth: number,
  plugins: EmbedPlugin[] | undefined,
): EmbedMeasurement | null {
  if (!plugins) return null
  for (const plugin of plugins) {
    if (plugin.match(block)) {
      return plugin.measure(block as any, maxWidth)
    }
  }
  return null
}

function resolveEmbedHeight(m: EmbedMeasurement, maxWidth: number): number {
  switch (m.kind) {
    case 'fixed':
    case 'computed':
      return m.height
    case 'aspect-ratio': {
      const h = maxWidth / m.ratio
      return m.maxHeight ? Math.min(h, m.maxHeight) : h
    }
  }
}

/**
 * Measure all blocks and return exact heights, y-offsets, and line data.
 */
export function measureBlocks(
  blocks: BlockNode[],
  config: MeasureConfig,
): MeasureResult {
  const measured: MeasuredBlock[] = []
  let y = 0

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]!
    const mb = measureBlock(block, config)
    mb.y = y
    measured.push(mb)
    y += mb.height
    if (i < blocks.length - 1) y += BLOCK_GAP
  }

  const totalLines = measured.reduce((sum, b) => sum + (b.lines?.length ?? 0), 0)

  return {
    height: y,
    lineCount: totalLines,
    blocks: measured,
  }
}

function measureBlock(block: BlockNode, config: MeasureConfig): MeasuredBlock {
  // Try plugins first — they can handle any block type
  const pluginResult = tryPluginMeasure(block, config.maxWidth, config.plugins)
  if (pluginResult) {
    return { node: block, height: resolveEmbedHeight(pluginResult, config.maxWidth), y: 0 }
  }

  // Built-in handling for core block types
  switch (block.kind) {
    case 'paragraph':
      return measureParagraph(block, config)
    case 'heading':
      return measureHeading(block, config)
    case 'code-block':
      return measureCodeBlock(block, config)
    case 'hr':
      return { node: block, height: HR_HEIGHT, y: 0 }
    case 'image':
      // fallback if no plugin: placeholder
      return { node: block, height: 300, y: 0 }
    case 'blockquote':
      return measureBlockquote(block, config)
    case 'list':
      return measureList(block, config)
  }
}

function measureParagraph(block: BlockNode & { kind: 'paragraph' }, config: MeasureConfig): MeasuredBlock {
  const lines = layoutInline(
    block.items,
    config.maxWidth,
    config.fonts,
    config.lineHeights.body,
  )
  const height = lines.length * config.lineHeights.body
  return { node: block, height, y: 0, lines }
}

function measureHeading(block: HeadingNode, config: MeasureConfig): MeasuredBlock {
  const lineHeight = getHeadingLineHeight(block.level, config.lineHeights)
  const headingFonts: FontConfig = {
    ...config.fonts,
    body: config.fonts[getHeadingFont(block.level)],
    bold: config.fonts[getHeadingFont(block.level)],
  }
  const lines = layoutInline(
    block.items,
    config.maxWidth,
    headingFonts,
    lineHeight,
  )
  const height = lines.length * lineHeight
  return { node: block, height, y: 0, lines }
}

function measureBlockquote(block: BlockNode & { kind: 'blockquote' }, config: MeasureConfig): MeasuredBlock {
  const innerConfig: MeasureConfig = {
    ...config,
    maxWidth: config.maxWidth - BLOCKQUOTE_INDENT,
  }
  const inner = measureBlocks(block.children, innerConfig)
  return { node: block, height: inner.height, y: 0, children: inner.blocks }
}

function measureCodeBlock(block: CodeBlockNode, config: MeasureConfig): MeasuredBlock {
  const hasHeader = !!block.lang
  const lineHeight = config.lineHeights.code
  const font = config.fonts.code

  // Code doesn't wrap — one visual line per physical line, horizontal scroll for overflow.
  const lines = layoutCodeLines(block.code, font, lineHeight)
  const contentHeight = lines.length * lineHeight
  const height =
    (hasHeader ? CODE_BLOCK.headerHeight : 0) +
    CODE_BLOCK.paddingY +
    contentHeight +
    CODE_BLOCK.border

  return { node: block, height, y: 0, lines }
}

/**
 * Layout code text into measured lines.
 * One visual line per physical line — no wrapping.
 * Long lines scroll horizontally via overflow-x on the pre element.
 */
function layoutCodeLines(
  code: string,
  font: string,
  lineHeight: number,
): MeasuredLine[] {
  const lines: MeasuredLine[] = []
  const physicalLines = splitLines(code)

  let y = 0
  for (const codeLine of physicalLines) {
    if (codeLine === '') {
      lines.push({ fragments: [], width: 0, y })
      y += lineHeight
      continue
    }

    // Measure full line width (no wrapping — unbounded width)
    const prepared = prepareWithSegments(codeLine, font)
    const whole = layoutNextLine(prepared, CODE_LINE_START, CODE_UNBOUNDED)

    lines.push({
      fragments: [{
        text: whole?.text ?? codeLine,
        width: whole?.width ?? 0,
        font,
        fontStyle: 'body',
        leadingGap: 0,
      }],
      width: whole?.width ?? 0,
      y,
    })
    y += lineHeight
  }

  return lines
}

function measureList(block: BlockNode & { kind: 'list' }, config: MeasureConfig): MeasuredBlock {
  const innerConfig: MeasureConfig = {
    ...config,
    maxWidth: config.maxWidth - LIST_INDENT,
  }
  let totalHeight = 0
  const measuredItems: MeasuredBlock[][] = []
  for (let i = 0; i < block.items.length; i++) {
    const itemBlocks = block.items[i]!
    const inner = measureBlocks(itemBlocks, innerConfig)
    measuredItems.push(inner.blocks)
    totalHeight += inner.height
    // no gap between list items — lineHeight provides natural spacing
  }
  return { node: block, height: totalHeight, y: 0, items: measuredItems }
}
