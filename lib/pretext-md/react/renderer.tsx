'use client'

import React, { useMemo, memo, createContext, useContext } from 'react'
import { parse } from '../core/parser'
import { measureBlocks } from '../core/block-layout'
import type {
  BlockNode,
  InlineItem,
  MeasuredBlock,
  MeasuredLine,
  LineFragment,
  MeasureConfig,
  HeadingNode,
  ImageNode,
  CodeBlockNode,
  EmbedPlugin,
} from '../core/types'
import { usePretextMdConfig } from './context'
import {
  defaultPlugins,
  renderCodeBlock,
  renderYouTube,
  renderImage,
} from './plugins'

// --- Plugin render registry ---
// Maps plugin name → render function. Plugins own both measure and render.

type PluginRenderer = (node: BlockNode) => React.ReactNode

const defaultRenderers: Record<string, PluginRenderer> = {
  'code-block': (n) => renderCodeBlock(n as CodeBlockNode),
  'youtube': (n) => renderYouTube(n as ImageNode),
  'image': (n) => renderImage(n as ImageNode),
  'hr': () => <hr className="border-border" />,
}

// --- Plugin context ---

const PluginsContext = createContext<{
  plugins: EmbedPlugin[]
  renderers: Record<string, PluginRenderer>
}>({ plugins: [], renderers: defaultRenderers })

function usePlugins() {
  return useContext(PluginsContext)
}

function findPluginForNode(
  node: BlockNode,
  plugins: EmbedPlugin[],
): EmbedPlugin | null {
  for (const p of plugins) {
    if (p.match(node)) return p
  }
  return null
}

// --- Main component ---

type MarkdownProps = {
  content: string
  maxWidth: number
  className?: string
  measured?: boolean
  plugins?: EmbedPlugin[]
  renderers?: Record<string, PluginRenderer>
}

export const Markdown = memo(function Markdown({
  content,
  maxWidth,
  className,
  measured = true,
  plugins: userPlugins,
  renderers: userRenderers,
}: MarkdownProps) {
  const config = usePretextMdConfig()
  const plugins = userPlugins ?? defaultPlugins()
  const renderers = useMemo(
    () => ({ ...defaultRenderers, ...userRenderers }),
    [userRenderers],
  )

  const data = useMemo(() => {
    if (!content) return null
    const blocks = parse(content)
    if (!measured || maxWidth <= 0) return { blocks, result: null }
    const measureConfig: MeasureConfig = {
      maxWidth,
      fonts: config.fonts,
      lineHeights: config.lineHeights,
      plugins,
    }
    return { blocks, result: measureBlocks(blocks, measureConfig) }
  }, [content, maxWidth, config.fonts, config.lineHeights, measured, plugins])

  if (!data) return null

  const ctx = { plugins, renderers }

  if (!data.result) {
    return (
      <PluginsContext.Provider value={ctx}>
        <div className={className}>
          {data.blocks.map((block, i) => (
            <FlowBlockRenderer key={i} node={block} />
          ))}
        </div>
      </PluginsContext.Provider>
    )
  }

  return (
    <PluginsContext.Provider value={ctx}>
      <div className={className} style={{ position: 'relative', height: data.result.height }}>
        {data.result.blocks.map((block, i) => (
          <MeasuredBlockRenderer key={i} block={block} />
        ))}
      </div>
    </PluginsContext.Provider>
  )
})

// ============================================================
// MEASURED MODE
// ============================================================

function MeasuredBlockRenderer({ block }: { block: MeasuredBlock }) {
  const { plugins, renderers } = usePlugins()
  const node = block.node

  // Plugin-rendered blocks
  const plugin = findPluginForNode(node, plugins)
  if (plugin) {
    const render = renderers[plugin.name]
    if (render) {
      return <div style={absBlock(block.y)}>{render(node)}</div>
    }
  }

  // Built-in block types
  switch (node.kind) {
    case 'paragraph':
      return <MeasuredInlineBlock block={block} tag="p" />
    case 'heading':
      return <MeasuredHeading block={block} level={node.level} />
    case 'blockquote':
      return <MeasuredBlockquote block={block} />
    case 'list':
      return <MeasuredList block={block} />
    default:
      return null
  }
}

function MeasuredInlineBlock({ block, tag: Tag }: { block: MeasuredBlock; tag: 'p' | 'div' }) {
  if (!block.lines) return null
  return (
    <Tag style={{ position: 'absolute', top: block.y, left: 0, height: block.height, width: '100%', margin: 0 }}>
      {block.lines.map((line, i) => (
        <MeasuredLineRenderer key={i} line={line} />
      ))}
    </Tag>
  )
}

function MeasuredHeading({ block, level }: { block: MeasuredBlock; level: HeadingNode['level'] }) {
  if (!block.lines) return null
  const Tag = `h${level}` as const
  return (
    <Tag style={{ position: 'absolute', top: block.y, left: 0, height: block.height, width: '100%', margin: 0 }}>
      {block.lines.map((line, i) => (
        <MeasuredLineRenderer key={i} line={line} />
      ))}
    </Tag>
  )
}

function MeasuredLineRenderer({ line }: { line: MeasuredLine }) {
  return (
    <span
      style={{
        position: 'absolute', top: line.y, left: 0,
        display: 'flex', alignItems: 'baseline', flexWrap: 'nowrap', gap: 0,
        width: 'max-content',
      }}
    >
      {line.fragments.map((frag, i) => (
        <FragmentRenderer key={i} fragment={frag} />
      ))}
    </span>
  )
}

function FragmentRenderer({ fragment }: { fragment: LineFragment }) {
  const style: React.CSSProperties = {
    display: 'inline-block',
    whiteSpace: 'pre',
    font: fragment.font,
    verticalAlign: 'baseline',
  }
  if (fragment.leadingGap > 0) style.marginLeft = fragment.leadingGap

  if (fragment.isCode) {
    return (
      <code
        className="bg-foreground/[0.06] rounded px-1 py-0.5"
        style={{ ...style, font: fragment.font }}
      >
        {fragment.text}
      </code>
    )
  }

  let content: React.ReactNode = fragment.text
  if (fragment.isStrikethrough) content = <del>{content}</del>
  if (fragment.href) {
    return <a href={fragment.href} className="underline text-primary" style={style}>{content}</a>
  }
  return <span style={style}>{content}</span>
}

const absBlock = (y: number, height?: number): React.CSSProperties => ({
  position: 'absolute', top: y, left: 0, width: '100%', height, margin: 0,
})

function MeasuredBlockquote({ block }: { block: MeasuredBlock }) {
  const node = block.node as BlockNode & { kind: 'blockquote' }
  return (
    <blockquote className="border-l-2 border-muted-foreground/30 pl-4" style={absBlock(block.y, block.height)}>
      {node.children.map((child, i) => (
        <div key={i} className="text-sm">
          {child.kind === 'paragraph' ? <FlowInlineItems items={child.items} /> : null}
        </div>
      ))}
    </blockquote>
  )
}

function MeasuredList({ block }: { block: MeasuredBlock }) {
  const node = block.node as BlockNode & { kind: 'list' }
  const Tag = node.ordered ? 'ol' : 'ul'
  return (
    <Tag
      className={node.ordered ? 'list-decimal pl-6' : 'list-disc pl-6'}
      style={{ ...absBlock(block.y, block.height), display: 'flex', flexDirection: 'column' }}
      start={node.start}
    >
      {node.items.map((itemBlocks, i) => (
        <li key={i} className="text-sm leading-5">
          {itemBlocks.map((child, j) =>
            child.kind === 'paragraph' ? <FlowInlineItems key={j} items={child.items} /> : null
          )}
        </li>
      ))}
    </Tag>
  )
}

// ============================================================
// FLOW MODE — normal browser layout, same parsed AST
// ============================================================

function FlowBlockRenderer({ node }: { node: BlockNode }) {
  const { plugins, renderers } = usePlugins()

  // Plugin-rendered blocks
  const plugin = findPluginForNode(node, plugins)
  if (plugin) {
    const render = renderers[plugin.name]
    if (render) return <>{render(node)}</>
  }

  switch (node.kind) {
    case 'paragraph':
      return <p className="text-sm leading-5"><FlowInlineItems items={node.items} /></p>
    case 'heading':
      return <FlowHeading node={node} />
    case 'blockquote':
      return (
        <blockquote className="border-l-2 border-muted-foreground/30 pl-4">
          {node.children.map((child, i) => (
            <FlowBlockRenderer key={i} node={child} />
          ))}
        </blockquote>
      )
    case 'list': {
      const Tag = node.ordered ? 'ol' : 'ul'
      return (
        <Tag className={`${node.ordered ? 'list-decimal' : 'list-disc'} pl-6 text-sm leading-5`} start={node.start}>
          {node.items.map((itemBlocks, i) => (
            <li key={i}>
              {itemBlocks.map((child, j) => (
                <FlowBlockRenderer key={j} node={child} />
              ))}
            </li>
          ))}
        </Tag>
      )
    }
    default:
      return null
  }
}

function FlowHeading({ node }: { node: HeadingNode }) {
  const Tag = `h${node.level}` as const
  const sizes: Record<number, string> = {
    1: 'text-2xl font-bold',
    2: 'text-xl font-bold',
    3: 'text-base font-bold',
    4: 'text-sm font-bold',
    5: 'text-sm font-bold',
    6: 'text-xs font-bold',
  }
  return (
    <Tag className={sizes[node.level]}>
      <FlowInlineItems items={node.items} />
    </Tag>
  )
}

function FlowInlineItems({ items }: { items: InlineItem[] }) {
  return (
    <>
      {items.map((item, i) => (
        <FlowInlineItem key={i} item={item} />
      ))}
    </>
  )
}

function FlowInlineItem({ item }: { item: InlineItem }) {
  switch (item.kind) {
    case 'text': {
      const Tag = item.font === 'bold' || item.font === 'boldItalic' ? 'strong' : item.font === 'italic' ? 'em' : item.font === 'strikethrough' ? 'del' : 'span'
      if (item.font === 'boldItalic') return <strong><em>{item.text}</em></strong>
      return <Tag>{item.text}</Tag>
    }
    case 'code':
      return <code className="bg-foreground/[0.06] rounded px-1 py-0.5 text-[0.9em]">{item.text}</code>
    case 'link':
      return (
        <a href={item.href} className="underline text-primary">
          <FlowInlineItems items={item.items} />
        </a>
      )
    case 'break':
      return <br />
    default:
      return null
  }
}
