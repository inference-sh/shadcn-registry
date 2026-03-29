// Block layout coordinator
//
// Stacks blocks vertically, delegates inline measurement to the inline layout engine.
// Block types like code-block, image, hr are measured by plugins — the coordinator
// only handles paragraph, heading, list, blockquote natively.

import { layoutInline } from './inline-layout'
import type {
  BlockNode,
  MeasuredBlock,
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
      // fallback if no plugin: rough estimate
      return { node: block, height: block.code.split('\n').length * 20 + 24, y: 0 }
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
  return { node: block, height: inner.height, y: 0 }
}

function measureList(block: BlockNode & { kind: 'list' }, config: MeasureConfig): MeasuredBlock {
  const innerConfig: MeasureConfig = {
    ...config,
    maxWidth: config.maxWidth - LIST_INDENT,
  }
  let totalHeight = 0
  for (let i = 0; i < block.items.length; i++) {
    const itemBlocks = block.items[i]!
    const inner = measureBlocks(itemBlocks, innerConfig)
    totalHeight += inner.height
    // no gap between list items — lineHeight provides natural spacing
  }
  return { node: block, height: totalHeight, y: 0 }
}
