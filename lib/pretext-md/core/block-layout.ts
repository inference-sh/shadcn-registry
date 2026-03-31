// Block layout coordinator
//
// Stacks blocks vertically, delegates inline measurement to the inline layout engine.
// Block types like code-block, image, hr are measured by plugins — the coordinator
// only handles paragraph, heading, list, blockquote natively.

import { layoutInline } from './inline-layout'
import type {
  BlockNode,
  MeasuredBlock,
  MeasuredLine,
  MeasureConfig,
  MeasureResult,
  FontConfig,
  LineHeightConfig,
  HeadingNode,
  EmbedPlugin,
  EmbedMeasurement,
  PluginContext,
} from './types'

// Core layout constant — the coordinator owns block spacing
const BLOCK_GAP = 12


function getHeadingFont(level: HeadingNode['level']): keyof FontConfig {
  return `h${level}` as keyof FontConfig
}

function getHeadingLineHeight(level: HeadingNode['level'], lineHeights: LineHeightConfig): number {
  return lineHeights[`h${level}` as keyof LineHeightConfig]
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

function findPlugin(block: BlockNode, plugins?: EmbedPlugin[]): EmbedPlugin | null {
  if (!plugins) return null
  for (const p of plugins) {
    if (p.match(block)) return p
  }
  return null
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
  const ctx: PluginContext = { measureBlocks, config }

  // Plugins handle all non-inline block types
  const plugin = findPlugin(block, config.plugins)
  if (plugin) {
    // Full measurement: plugin returns MeasuredBlock with children/lines
    if (plugin.measureBlock) {
      return plugin.measureBlock(block, ctx)
    }
    // Simple measurement: plugin returns height
    const m = plugin.measure(block as any, config.maxWidth, ctx)
    return { node: block, height: resolveEmbedHeight(m, config.maxWidth), y: 0 }
  }

  // Core handles inline block types natively (paragraphs, headings)
  switch (block.kind) {
    case 'paragraph':
      return measureParagraph(block, config)
    case 'heading':
      return measureHeading(block, config)
    default:
      // Unknown block without plugin — rough fallback
      return { node: block, height: 40, y: 0 }
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

