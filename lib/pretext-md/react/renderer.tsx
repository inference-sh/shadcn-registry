'use client'

import React, { useMemo, memo, useState, useRef, useEffect, useLayoutEffect, createContext, useContext } from 'react'
import { parse } from '../core/parser'
import { measureBlocks } from '../core/block-layout'
import type {
  BlockNode,
  ListNode,
  TableNode,
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
  renderTable,
} from './plugins'
import { CodeBlock } from '@/components/infsh/code-block/code-block'

const DEFAULT_PLUGINS = defaultPlugins()

// --- Plugin render registry ---
// Maps plugin name → render function. Plugins own both measure and render.
// Receives MeasuredBlock so container plugins can render measured children.

type PluginRenderer = (block: MeasuredBlock, renderChild: (b: MeasuredBlock) => React.ReactNode) => React.ReactNode

const defaultRenderers: Record<string, PluginRenderer> = {
  'code-block': (b) => renderCodeBlock(b.node as CodeBlockNode),
  'blockquote': (b, renderChild) => (
    <blockquote className="relative" style={{ paddingLeft: b.contentLeft ?? 16 }}>
      {b.quoteRails?.map((x, i) => (
        <span
          key={i}
          className="absolute top-0 bottom-0 w-0.5 bg-muted-foreground/30"
          style={{ left: x }}
        />
      ))}
      {b.children?.map((child, i) => <React.Fragment key={i}>{renderChild(child)}</React.Fragment>)}
    </blockquote>
  ),
  'list': (b) => {
    return (
      <div className="relative">
        {b.items?.map((measuredBlocks, i) => (
          <div key={i} className="relative" style={i > 0 ? { marginTop: 4 } : undefined}>
            {measuredBlocks.map((child, j) => {
              if (child.marker) {
                return (
                  <div key={j} className="relative" style={{ paddingLeft: child.contentLeft ?? 0 }}>
                    <span
                      className="absolute text-muted-foreground text-sm select-none"
                      style={{ left: child.marker.x, top: 0, lineHeight: 'inherit' }}
                    >
                      {child.marker.text}
                    </span>
                    <MeasuredBlockRenderer block={child} />
                  </div>
                )
              }
              return <MeasuredBlockRenderer key={j} block={child} />
            })}
          </div>
        ))}
      </div>
    )
  },
  'youtube': (b) => renderYouTube(b.node as ImageNode),
  'image': (b) => renderImage(b.node as ImageNode),
  'table': (b) => renderTable(b.node as TableNode),
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
  className?: string
  measured?: boolean
  plugins?: EmbedPlugin[]
  renderers?: Record<string, PluginRenderer>
}

export const Markdown = memo(function Markdown({
  content,
  className,
  measured = true,
  plugins: userPlugins,
  renderers: userRenderers,
}: MarkdownProps) {
  const config = usePretextMdConfig()
  const plugins = userPlugins ?? DEFAULT_PLUGINS
  const renderers = useMemo(
    () => ({ ...defaultRenderers, ...userRenderers }),
    [userRenderers],
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // Measure the parent's width, not our own container.
  // Measured lines use white-space:nowrap which prevents the container from
  // shrinking below content width — reading our own width would be circular.
  useLayoutEffect(() => {
    const parent = containerRef.current?.parentElement
    if (parent) {
      const w = Math.floor(parent.clientWidth)
      if (w > 0) setContainerWidth(w)
    }
  }, [])

  useEffect(() => {
    const parent = containerRef.current?.parentElement
    if (!parent || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => {
      const w = Math.floor(parent.clientWidth)
      setContainerWidth(prev => Math.abs(prev - w) > 1 ? w : prev)
    })
    ro.observe(parent)
    return () => ro.disconnect()
  }, [])

  const blocks = useMemo(() => content ? parse(content) : [], [content])

  const measuredResult = useMemo(() => {
    if (!measured || containerWidth <= 0 || blocks.length === 0) return null
    const measureConfig: MeasureConfig = {
      maxWidth: containerWidth,
      fonts: config.fonts,
      lineHeights: config.lineHeights,
      plugins,
    }
    return measureBlocks(blocks, measureConfig)
  }, [blocks, containerWidth, config.fonts, config.lineHeights, measured, plugins])

  const ctx = { plugins, renderers }

  // Always render the container — never unmount the ref.
  // Content inside is gated on width + content availability.
  return (
    <PluginsContext.Provider value={ctx}>
      <div ref={containerRef} className={className} style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
        {measuredResult ? (
          measuredResult.blocks.map((block, i) => (
            <MeasuredBlockRenderer key={i} block={block} />
          ))
        ) : blocks.length > 0 ? (
          blocks.map((block, i) => (
            <FlowBlockRenderer key={i} node={block} />
          ))
        ) : null}
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
    if (render) return <>{render(block, (child) => <MeasuredBlockRenderer block={child} />)}</>
  }

  // Core inline block types
  switch (node.kind) {
    case 'paragraph':
      return <MeasuredInlineBlock block={block} tag="p" />
    case 'heading':
      return <MeasuredInlineBlock block={block} tag={`h${node.level}`} />
    default:
      return null
  }
}

function MeasuredInlineBlock({ block, tag }: { block: MeasuredBlock; tag: string }) {
  if (!block.lines) return null
  const Tag = tag as any
  const lh = block.lines.length > 0 ? block.height / block.lines.length : 20
  return (
    <Tag style={{ margin: 0, width: '100%' }}>
      {block.lines.map((line, i) => (
        <MeasuredLineRenderer key={i} line={line} lineHeight={lh} />
      ))}
    </Tag>
  )
}


function MeasuredLineRenderer({ line, lineHeight }: { line: MeasuredLine; lineHeight: number }) {
  return (
    <span style={{ display: 'block', height: lineHeight, whiteSpace: 'nowrap' }}>
      {line.fragments.map((frag, i) => (
        <FragmentRenderer key={i} fragment={frag} />
      ))}
    </span>
  )
}

function FragmentRenderer({ fragment }: { fragment: LineFragment }) {
  const style: React.CSSProperties = { font: fragment.font }
  const space = fragment.leadingGap > 0 ? ' ' : ''

  if (fragment.isCode) {
    return (
      <>{space}<code
        className="bg-foreground/[0.06] rounded px-1 py-0.5"
        style={style}
      >{fragment.text}</code></>
    )
  }

  let content: React.ReactNode = fragment.text
  if (fragment.isStrikethrough) content = <del>{content}</del>
  if (fragment.href) {
    return <>{space}<a href={fragment.href} className="underline text-primary" style={style}>{content}</a></>
  }
  return <>{space}<span style={style}>{content}</span></>
}


// ============================================================
// FLOW MODE — normal browser layout, same parsed AST
// ============================================================

function FlowBlockRenderer({ node }: { node: BlockNode }) {
  const { plugins, renderers } = usePlugins()

  // Leaf plugins (code-block, youtube, image, hr) work in flow mode too
  const plugin = findPluginForNode(node, plugins)
  if (plugin && !plugin.measureBlock) {
    const render = renderers[plugin.name]
    if (render) return <>{render({ node, height: 0, y: 0 }, () => null)}</>
  }

  switch (node.kind) {
    case 'paragraph':
      return <p className="text-sm leading-5"><FlowInlineItems items={node.items} /></p>
    case 'heading':
      return <FlowHeading node={node} />
    case 'code-block':
      return <FlowCodeBlock node={node as CodeBlockNode} />
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

function FlowCodeBlock({ node }: { node: CodeBlockNode }) {
  return (
    <CodeBlock language={node.lang} showHeader={!!node.lang} showLineNumbers={false} className="!my-0 !h-auto">
      {node.code}
    </CodeBlock>
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
