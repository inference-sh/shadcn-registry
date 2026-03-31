'use client'

import React from 'react'
import type {
  BlockNode,
  BlockquoteNode,
  ListNode,
  CodeBlockNode,
  ImageNode,
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

// --- Default plugin set ---

export function defaultPlugins(): EmbedPlugin[] {
  return [codeBlockPlugin(), blockquotePlugin(), listPlugin(), youtubePlugin(), imagePlugin(), hrPlugin()]
}
