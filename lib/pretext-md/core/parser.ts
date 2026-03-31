// mdast walker — converts remark AST to our layout IR (BlockNode/InlineItem)

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import type {
  BlockNode,
  InlineItem,
  FontStyle,
} from './types'
import type {
  Root,
  Content,
  PhrasingContent,
  Paragraph,
  Heading,
  Code,
  Blockquote,
  List,
  ListItem,
  ThematicBreak,
  Text,
  Emphasis,
  Strong,
  InlineCode,
  Link,
  Delete,
  Break,
  Image,
  Table,
  TableRow,
  TableCell,
  AlignType,
} from 'mdast'

const parser = unified().use(remarkParse).use(remarkGfm)

export function parse(markdown: string): BlockNode[] {
  const tree = parser.parse(markdown) as Root
  return walkBlocks(tree.children)
}

function walkBlocks(nodes: Content[]): BlockNode[] {
  const blocks: BlockNode[] = []
  for (const node of nodes) {
    const block = walkBlock(node)
    if (block) blocks.push(block)
  }
  return blocks
}

function walkBlock(node: Content): BlockNode | null {
  switch (node.type) {
    case 'paragraph':
      return walkParagraph(node as Paragraph)
    case 'heading':
      return walkHeading(node as Heading)
    case 'code':
      return walkCode(node as Code)
    case 'blockquote':
      return walkBlockquote(node as Blockquote)
    case 'list':
      return walkList(node as List)
    case 'thematicBreak':
      return { kind: 'hr' } as const
    case 'table':
      return walkTable(node as Table)
    default:
      return null
  }
}

function walkParagraph(node: Paragraph): BlockNode {
  // Image-only paragraph → promote to block-level image
  if (node.children.length === 1 && node.children[0]!.type === 'image') {
    const img = node.children[0] as Image
    return { kind: 'image', src: img.url, alt: img.alt ?? undefined }
  }
  return {
    kind: 'paragraph',
    items: walkInlines(node.children, 'body'),
  }
}

function walkHeading(node: Heading): BlockNode {
  return {
    kind: 'heading',
    level: node.depth as 1 | 2 | 3 | 4 | 5 | 6,
    items: walkInlines(node.children, 'body'),
  }
}

function walkCode(node: Code): BlockNode {
  return {
    kind: 'code-block',
    lang: node.lang ?? '',
    code: node.value,
    meta: node.meta ?? undefined,
  }
}

function walkBlockquote(node: Blockquote): BlockNode {
  return {
    kind: 'blockquote',
    children: walkBlocks(node.children),
  }
}

function walkList(node: List): BlockNode {
  return {
    kind: 'list',
    ordered: node.ordered ?? false,
    start: node.start ?? undefined,
    items: node.children.map((item: ListItem) => walkBlocks(item.children)),
  }
}

function walkTable(node: Table): BlockNode {
  const align = (node.align ?? []).map((a: AlignType | null | undefined) =>
    a === 'left' || a === 'center' || a === 'right' ? a : null,
  )
  const rows = node.children.map((row: TableRow) =>
    row.children.map((cell: TableCell) =>
      walkInlines(cell.children as PhrasingContent[], 'body'),
    ),
  )
  return { kind: 'table', align, rows }
}

// --- Inline walking ---

function walkInlines(nodes: PhrasingContent[], fontStyle: FontStyle): InlineItem[] {
  const items: InlineItem[] = []
  for (const node of nodes) {
    walkInline(node, fontStyle, items)
  }
  return items
}

function walkInline(node: PhrasingContent, fontStyle: FontStyle, out: InlineItem[]): void {
  switch (node.type) {
    case 'text':
      out.push({ kind: 'text', text: (node as Text).value, font: fontStyle })
      break
    case 'strong':
      walkInlineChildren((node as Strong).children, applyBold(fontStyle), out)
      break
    case 'emphasis':
      walkInlineChildren((node as Emphasis).children, applyItalic(fontStyle), out)
      break
    case 'delete':
      walkInlineChildren((node as Delete).children, 'strikethrough', out)
      break
    case 'inlineCode':
      out.push({ kind: 'code', text: (node as InlineCode).value })
      break
    case 'link':
      out.push({
        kind: 'link',
        href: (node as Link).url,
        items: walkInlines((node as Link).children, fontStyle),
      })
      break
    case 'break':
      out.push({ kind: 'break' })
      break
    default:
      // skip unknown inline nodes
      break
  }
}

function walkInlineChildren(nodes: PhrasingContent[], fontStyle: FontStyle, out: InlineItem[]): void {
  for (const node of nodes) {
    walkInline(node, fontStyle, out)
  }
}

function applyBold(current: FontStyle): FontStyle {
  if (current === 'italic' || current === 'boldItalic') return 'boldItalic'
  return 'bold'
}

function applyItalic(current: FontStyle): FontStyle {
  if (current === 'bold' || current === 'boldItalic') return 'boldItalic'
  return 'italic'
}
