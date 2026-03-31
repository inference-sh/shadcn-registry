// Layout IR types for pretext-md
// These types bridge the gap between mdast (remark's AST) and pretext measurement.

// --- Font configuration ---

export type FontConfig = {
  body: string       // e.g. '14px "Inter", sans-serif'
  bold: string       // e.g. 'bold 14px "Inter", sans-serif'
  italic: string     // e.g. 'italic 14px "Inter", sans-serif'
  boldItalic: string // e.g. 'bold italic 14px "Inter", sans-serif'
  code: string       // e.g. '13px "Fira Code", monospace'
  h1: string
  h2: string
  h3: string
  h4: string
  h5: string
  h6: string
}

export type LineHeightConfig = {
  body: number    // e.g. 20
  code: number    // e.g. 18
  h1: number      // e.g. 32
  h2: number      // e.g. 28
  h3: number      // e.g. 24
  h4: number
  h5: number
  h6: number
}

export type MeasureConfig = {
  maxWidth: number
  fonts: FontConfig
  lineHeights: LineHeightConfig
  plugins?: EmbedPlugin[]
}

// --- Block-level nodes (parser output) ---

export type BlockNode =
  | ParagraphNode
  | HeadingNode
  | CodeBlockNode
  | BlockquoteNode
  | ListNode
  | ThematicBreakNode
  | ImageNode
  | TableNode

export type ParagraphNode = {
  kind: 'paragraph'
  items: InlineItem[]
}

export type HeadingNode = {
  kind: 'heading'
  level: 1 | 2 | 3 | 4 | 5 | 6
  items: InlineItem[]
}

export type CodeBlockNode = {
  kind: 'code-block'
  lang: string
  code: string
  meta?: string
}

export type BlockquoteNode = {
  kind: 'blockquote'
  children: BlockNode[]
}

export type ListNode = {
  kind: 'list'
  ordered: boolean
  start?: number
  items: BlockNode[][]
}

export type ThematicBreakNode = {
  kind: 'hr'
}

export type ImageNode = {
  kind: 'image'
  src: string
  alt?: string
}

export type TableAlignType = 'left' | 'center' | 'right' | null

export type TableNode = {
  kind: 'table'
  align: TableAlignType[]
  rows: InlineItem[][][] // rows → cells → inline items
}

// --- Inline items (within paragraphs/headings) ---

export type InlineItem =
  | TextItem
  | CodeItem
  | LinkItem
  | BreakItem

export type TextItem = {
  kind: 'text'
  text: string
  font: FontStyle
}

export type CodeItem = {
  kind: 'code'
  text: string
}

export type LinkItem = {
  kind: 'link'
  items: InlineItem[]
  href: string
}

export type BreakItem = {
  kind: 'break'
}

// font style resolved during inline layout based on FontConfig
export type FontStyle = 'body' | 'bold' | 'italic' | 'boldItalic' | 'strikethrough'

// --- Measured output ---

export type MeasuredBlock = {
  node: BlockNode
  height: number
  y: number
  lines?: MeasuredLine[]          // for paragraph/heading/code blocks
  children?: MeasuredBlock[]      // for blockquote inner blocks
  items?: MeasuredBlock[][]       // for list items (each item = array of measured blocks)
}

export type MeasuredLine = {
  fragments: LineFragment[]
  width: number
  y: number // offset within block
}

export type LineFragment = {
  text: string
  width: number
  font: string      // resolved CSS font string
  fontStyle: FontStyle
  leadingGap: number // marginLeft gap before this fragment
  href?: string
  isCode?: boolean
  isStrikethrough?: boolean
}

export type MeasureResult = {
  height: number
  lineCount: number
  blocks: MeasuredBlock[]
}

// --- Plugin system ---

export type EmbedMeasurement =
  | { kind: 'fixed'; height: number }
  | { kind: 'computed'; height: number }
  | { kind: 'aspect-ratio'; ratio: number; maxHeight?: number }

/** Context passed to plugins for recursive measurement. */
export type PluginContext = {
  measureBlocks: (blocks: BlockNode[], config: MeasureConfig) => MeasureResult
  config: MeasureConfig
}

export type EmbedPlugin = {
  name: string
  match: (node: BlockNode) => boolean
  /** Simple measurement — returns a height. For leaf blocks (code, image, hr). */
  measure: (node: any, maxWidth: number, ctx?: PluginContext) => EmbedMeasurement
  /** Full measurement — returns MeasuredBlock with children/lines. For container blocks (blockquote, list). */
  measureBlock?: (node: any, ctx: PluginContext) => MeasuredBlock
}
