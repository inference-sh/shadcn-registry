'use client'

import React from 'react'
import type {
  BlockNode,
  BlockquoteNode,
  ListNode,
  CodeBlockNode,
  ImageNode,
  TableNode,
  EmbedPlugin,
  PluginContext,
} from '../core/types'
import { splitLines } from '@/components/infsh/code-block/utils'
import { CodeBlock } from '@/components/infsh/code-block/code-block'
import { YouTubeEmbed } from '@/components/infsh/youtube-embed'
import ZoomableImage from '@/components/infsh/zoomable-image'

// --- YouTube detection ---

function getYouTubeVideoId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/)
  return m?.[1] ?? null
}

// --- Code block plugin ---
// Owns its own chrome dimensions — core doesn't know about these.

const CODE_BLOCK_CHROME = {
  headerHeight: 33,  // py-2 (16px) + text-xs line (16px) + border-b (1px)
  paddingY: 32,      // p-4 top + bottom
  border: 2,         // border top + bottom
} as const

export function codeBlockPlugin(lineHeight: number = 18): EmbedPlugin {
  return {
    name: 'code-block',
    match: (node) => node.kind === 'code-block',
    measure: (node) => {
      const codeNode = node as CodeBlockNode
      const hasHeader = !!codeNode.lang
      const numLines = splitLines(codeNode.code).length
      const height =
        (hasHeader ? CODE_BLOCK_CHROME.headerHeight : 0) +
        CODE_BLOCK_CHROME.paddingY +
        numLines * lineHeight +
        CODE_BLOCK_CHROME.border
      return { kind: 'computed', height }
    },
  }
}

export function renderCodeBlock(node: CodeBlockNode): React.ReactNode {
  return (
    <CodeBlock language={node.lang} showHeader={!!node.lang} showLineNumbers={false} className="!my-0 !h-auto">
      {node.code}
    </CodeBlock>
  )
}

// --- YouTube plugin ---

export function youtubePlugin(): EmbedPlugin {
  return {
    name: 'youtube',
    match: (node) =>
      node.kind === 'image' && getYouTubeVideoId((node as ImageNode).src) !== null,
    measure: () => ({ kind: 'aspect-ratio', ratio: 16 / 9 }),
  }
}

export function renderYouTube(node: ImageNode): React.ReactNode {
  const videoId = getYouTubeVideoId(node.src)!
  return <YouTubeEmbed videoId={videoId} title={node.alt} />
}

// --- Image plugin ---

export function imagePlugin(): EmbedPlugin {
  return {
    name: 'image',
    match: (node) => node.kind === 'image',
    measure: (_, maxWidth) => ({ kind: 'aspect-ratio', ratio: 16 / 9, maxHeight: 400 }),
  }
}

export function renderImage(node: ImageNode): React.ReactNode {
  return <ZoomableImage src={node.src} alt={node.alt} className="rounded-md max-w-full" />
}

// --- HR plugin ---

export function hrPlugin(): EmbedPlugin {
  return {
    name: 'hr',
    match: (node) => node.kind === 'hr',
    measure: () => ({ kind: 'fixed', height: 1 }),
  }
}

// --- Blockquote plugin ---

export function blockquotePlugin(indent: number = 20): EmbedPlugin {
  return {
    name: 'blockquote',
    match: (node) => node.kind === 'blockquote',
    measure: () => ({ kind: 'fixed', height: 0 }), // unused — measureBlock handles it
    measureBlock: (node: BlockquoteNode, ctx) => {
      const innerConfig = { ...ctx.config, maxWidth: ctx.config.maxWidth - indent }
      const inner = ctx.measureBlocks(node.children, innerConfig)
      return { node, height: inner.height, y: 0, children: inner.blocks }
    },
  }
}

// --- List plugin ---

export function listPlugin(indent: number = 24): EmbedPlugin {
  return {
    name: 'list',
    match: (node) => node.kind === 'list',
    measure: () => ({ kind: 'fixed', height: 0 }), // unused — measureBlock handles it
    measureBlock: (node: ListNode, ctx) => {
      const innerConfig = { ...ctx.config, maxWidth: ctx.config.maxWidth - indent }
      let totalHeight = 0
      const measuredItems = node.items.map(itemBlocks => {
        const inner = ctx.measureBlocks(itemBlocks, innerConfig)
        totalHeight += inner.height
        return inner.blocks
      })
      return { node, height: totalHeight, y: 0, items: measuredItems }
    },
  }
}

// --- Table plugin ---

const TABLE_ROW_HEIGHT = 33 // px-3 py-1.5 (12px) + text-sm line (~16px) + border (1px) + padding
const TABLE_HEADER_HEIGHT = 33

export function tablePlugin(): EmbedPlugin {
  return {
    name: 'table',
    match: (node) => node.kind === 'table',
    measure: (node) => {
      const table = node as TableNode
      const height = TABLE_HEADER_HEIGHT + (table.rows.length - 1) * TABLE_ROW_HEIGHT + 2 // 2 = border
      return { kind: 'computed', height }
    },
  }
}

export function renderTable(node: TableNode): React.ReactNode {
  if (node.rows.length === 0) return null
  const [headerRow, ...bodyRows] = node.rows
  const align = node.align

  return (
    <div className="min-w-0 overflow-x-auto border border-border rounded-md">
      <table className="w-full">
        {headerRow && (
          <thead className="border-b border-border">
            <tr>
              {headerRow.map((cell, i) => (
                <th
                  key={i}
                  className="px-3 py-1.5 text-left text-xs text-muted-foreground"
                  style={align[i] ? { textAlign: align[i]! } : undefined}
                >
                  <FlowCellInlines items={cell} />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {bodyRows.map((row, ri) => (
            <tr key={ri} className="border-b border-border last:border-0">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="px-3 py-1.5 text-sm"
                  style={align[ci] ? { textAlign: align[ci]! } : undefined}
                >
                  <FlowCellInlines items={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Render inline items inside a table cell — reuses the same inline rendering as flow mode. */
function FlowCellInlines({ items }: { items: import('../core/types').InlineItem[] }) {
  return (
    <>
      {items.map((item, i) => {
        switch (item.kind) {
          case 'text': {
            const Tag = item.font === 'bold' || item.font === 'boldItalic' ? 'strong' : item.font === 'italic' ? 'em' : item.font === 'strikethrough' ? 'del' : 'span'
            if (item.font === 'boldItalic') return <strong key={i}><em>{item.text}</em></strong>
            return <Tag key={i}>{item.text}</Tag>
          }
          case 'code':
            return <code key={i} className="bg-foreground/[0.06] rounded px-1 py-0.5 text-[0.9em]">{item.text}</code>
          case 'link':
            return <a key={i} href={item.href} className="underline text-primary"><FlowCellInlines items={item.items} /></a>
          case 'break':
            return <br key={i} />
          default:
            return null
        }
      })}
    </>
  )
}

// --- Default plugin set ---

export function defaultPlugins(): EmbedPlugin[] {
  return [codeBlockPlugin(), blockquotePlugin(), listPlugin(), youtubePlugin(), imagePlugin(), hrPlugin(), tablePlugin()]
}
