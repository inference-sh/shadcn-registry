'use client'

import React, { useMemo, memo, useState, useRef, useEffect, createContext, useContext } from 'react'
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
import { CODE_BLOCK } from '../core/block-layout'
import { usePretextMdConfig } from './context'
import {
  defaultPlugins,
  renderYouTube,
  renderImage,
} from './plugins'
import { CodeBlock } from '@/components/infsh/code-block/code-block'
import { tokenize, type TokenizeContext } from '@/components/infsh/code-block/tokenizer'
import { tokenStyles } from '@/components/infsh/code-block/styles'
import { normalizeLanguage } from '@/components/infsh/code-block/languages'

const DEFAULT_PLUGINS = defaultPlugins()

// --- Plugin render registry ---
// Maps plugin name → render function. Plugins own both measure and render.

type PluginRenderer = (node: BlockNode) => React.ReactNode

const defaultRenderers: Record<string, PluginRenderer> = {
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
  /** Fixed width for measurement. If omitted, auto-measures container width. */
  maxWidth?: number
  className?: string
  measured?: boolean
  plugins?: EmbedPlugin[]
  renderers?: Record<string, PluginRenderer>
}

export const Markdown = memo(function Markdown({
  content,
  maxWidth: maxWidthProp,
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

  // Auto-measure container width when maxWidth not provided
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => {
      if (entry) {
        const w = Math.floor(entry.contentRect.width)
        setContainerWidth(prev => Math.abs(prev - w) > 1 ? w : prev)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const maxWidth = maxWidthProp ?? containerWidth

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
        <div ref={containerRef} className={className} style={{ display: 'flex', flexDirection: 'column', gap: 12, width: maxWidthProp === undefined ? '100%' : undefined }}>
          {data.blocks.map((block, i) => (
            <FlowBlockRenderer key={i} node={block} />
          ))}
        </div>
      </PluginsContext.Provider>
    )
  }

  return (
    <PluginsContext.Provider value={ctx}>
      <div ref={containerRef} className={className} style={{ display: 'flex', flexDirection: 'column', gap: 12, width: maxWidthProp === undefined ? '100%' : undefined }}>
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

  // Plugin-rendered blocks — natural flow, no absolute positioning
  const plugin = findPluginForNode(node, plugins)
  if (plugin) {
    const render = renderers[plugin.name]
    if (render) return <>{render(node)}</>
  }

  // Built-in block types
  switch (node.kind) {
    case 'paragraph':
      return <MeasuredInlineBlock block={block} tag="p" />
    case 'heading':
      return <MeasuredInlineBlock block={block} tag={`h${node.level}`} />
    case 'code-block':
      return <MeasuredCodeBlock block={block} />
    case 'blockquote':
      return <MeasuredBlockquote block={block} />
    case 'list':
      return <MeasuredList block={block} />
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

function MeasuredCodeBlock({ block }: { block: MeasuredBlock }) {
  const node = block.node as CodeBlockNode
  const config = usePretextMdConfig()
  const hasHeader = !!node.lang
  const lineHeight = config.lineHeights.code
  const font = config.fonts.code
  const [copied, setCopied] = useState(false)

  // Tokenize for syntax highlighting (doesn't affect measurement)
  const tokenizedLines = useMemo(() => {
    if (!node.lang) return null
    const lang = normalizeLanguage(node.lang)
    const physicalLines = node.code.split('\n')
    if (physicalLines.length > 0 && physicalLines[physicalLines.length - 1] === '') {
      physicalLines.pop()
    }
    const result: ReturnType<typeof tokenize>['tokens'][] = []
    let context: TokenizeContext = {}
    for (const line of physicalLines) {
      const r = tokenize(line, lang, context)
      result.push(r.tokens)
      context = r.context
    }
    return result
  }, [node.code, node.lang])

  // Map measured lines back to physical lines for token lookup.
  // Multiple measured lines can come from one physical line (wrapping).
  // Track which physical line each measured line belongs to and the char offset.
  const lineTokenMap = useMemo(() => {
    if (!tokenizedLines || !block.lines) return null
    const physicalLines = node.code.split('\n')
    if (physicalLines.length > 0 && physicalLines[physicalLines.length - 1] === '') {
      physicalLines.pop()
    }

    const map: { physicalIdx: number; charOffset: number }[] = []
    let physicalIdx = 0
    let charOffset = 0

    for (const line of block.lines) {
      map.push({ physicalIdx, charOffset })
      const text = line.fragments.map(f => f.text).join('')
      charOffset += text.length
      // If this consumed all chars in the physical line, move to next
      if (charOffset >= (physicalLines[physicalIdx]?.length ?? 0)) {
        physicalIdx++
        charOffset = 0
      }
    }
    return map
  }, [tokenizedLines, block.lines, node.code])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(node.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <div className="w-full rounded-lg border border-border overflow-hidden bg-muted/20">
      {hasHeader && (
        <div
          style={{ height: CODE_BLOCK.headerHeight }}
          className="flex items-center justify-between px-2 border-b border-white/5 bg-muted"
        >
          <span className="text-xs text-zinc-500 font-mono">{node.lang}</span>
          <button
            onClick={handleCopy}
            className="cursor-pointer flex items-center gap-1.5 rounded text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
          >
            <span>{copied ? 'copied!' : 'copy'}</span>
          </button>
        </div>
      )}
      <pre style={{ padding: CODE_BLOCK.paddingY / 2 }} className="overflow-auto">
        <code>
          {block.lines?.map((line, i) => {
            const lineText = line.fragments.map(f => f.text).join('')
            const tokens = getTokensForLine(lineText, i, tokenizedLines, lineTokenMap)
            return (
              <span key={i} style={{ display: 'block', height: lineHeight, whiteSpace: 'pre', font }}>
                {tokens
                  ? tokens.map((tok, j) =>
                      tok.type ? (
                        <span key={j} className={tokenStyles[tok.type]}>{tok.content}</span>
                      ) : (
                        <span key={j}>{tok.content}</span>
                      )
                    )
                  : lineText || ' '
                }
              </span>
            )
          })}
        </code>
      </pre>
    </div>
  )
}

/** Get syntax tokens for a measured line, handling wrapped lines. */
function getTokensForLine(
  lineText: string,
  lineIdx: number,
  tokenizedLines: ReturnType<typeof tokenize>['tokens'][] | null,
  lineTokenMap: { physicalIdx: number; charOffset: number }[] | null,
): ReturnType<typeof tokenize>['tokens'] | null {
  if (!tokenizedLines || !lineTokenMap) return null
  const mapping = lineTokenMap[lineIdx]
  if (!mapping) return null

  const tokens = tokenizedLines[mapping.physicalIdx]
  if (!tokens) return null

  if (mapping.charOffset === 0 && lineText.length >= (getPhysicalLineLength(tokens))) {
    // Entire physical line on one measured line — return tokens directly
    return tokens
  }

  // Wrapped line — slice tokens to match this measured line's char range
  return sliceTokens(tokens, mapping.charOffset, mapping.charOffset + lineText.length)
}

function getPhysicalLineLength(tokens: ReturnType<typeof tokenize>['tokens']): number {
  return tokens.reduce((sum, t) => sum + t.content.length, 0)
}

function sliceTokens(
  tokens: ReturnType<typeof tokenize>['tokens'],
  start: number,
  end: number,
): ReturnType<typeof tokenize>['tokens'] {
  const result: ReturnType<typeof tokenize>['tokens'] = []
  let pos = 0
  for (const token of tokens) {
    const tokEnd = pos + token.content.length
    if (tokEnd <= start) { pos = tokEnd; continue }
    if (pos >= end) break
    const sliceStart = Math.max(0, start - pos)
    const sliceEnd = Math.min(token.content.length, end - pos)
    const content = token.content.slice(sliceStart, sliceEnd)
    if (content) result.push({ ...token, content })
    pos = tokEnd
  }
  return result
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

function MeasuredBlockquote({ block }: { block: MeasuredBlock }) {
  return (
    <blockquote className="border-l-2 border-muted-foreground/30 pl-4">
      {block.children?.map((child, i) => (
        <MeasuredBlockRenderer key={i} block={child} />
      ))}
    </blockquote>
  )
}

function MeasuredList({ block }: { block: MeasuredBlock }) {
  const node = block.node as BlockNode & { kind: 'list' }
  const Tag = node.ordered ? 'ol' : 'ul'
  return (
    <Tag className={node.ordered ? 'list-decimal pl-6' : 'list-disc pl-6'} start={node.start}>
      {block.items?.map((measuredBlocks, i) => (
        <li key={i}>
          {measuredBlocks.map((child, j) => (
            <MeasuredBlockRenderer key={j} block={child} />
          ))}
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
