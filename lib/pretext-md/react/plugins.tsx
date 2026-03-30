'use client'

import React from 'react'
import { prepare, layout } from '@chenglou/pretext'
import type {
  CodeBlockNode,
  ImageNode,
  EmbedPlugin,
} from '../core/types'
import { CodeBlock } from '@/components/infsh/code-block/code-block'
import { YouTubeEmbed } from '@/components/infsh/youtube-embed'
import ZoomableImage from '@/components/infsh/zoomable-image'

// --- YouTube detection ---

function getYouTubeVideoId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/)
  return m?.[1] ?? null
}

// --- Code block plugin ---

// Code block uses pretext to measure monospace content.
// Monospace = every char same width = pretext measurement is trivially exact.
const CODE_FONT = '14px "DM Mono", "Fira Code", ui-monospace, monospace'
const CODE_LINE_HEIGHT = 24 // leading-6
const CODE_HEADER = 36      // py-2 + text-xs + border-b
const CODE_PADDING = 32     // p-4 top + bottom
const CODE_BORDER = 2       // top + bottom

export function codeBlockPlugin(): EmbedPlugin {
  return {
    name: 'code-block',
    match: (node) => node.kind === 'code-block',
    measure: (node, maxWidth) => {
      const hasHeader = !!node.lang
      // Use pretext to measure the code content with monospace font
      const contentWidth = maxWidth - 32 // p-4 left + right
      const prepared = prepare(node.code, CODE_FONT, { whiteSpace: 'pre-wrap' })
      const result = layout(prepared, contentWidth, CODE_LINE_HEIGHT)
      const height =
        (hasHeader ? CODE_HEADER : 0) +
        CODE_PADDING +
        result.height +
        CODE_BORDER
      return { kind: 'computed', height }
    },
  }
}

export function renderCodeBlock(node: CodeBlockNode): React.ReactNode {
  // Strip my-6 and h-full from CodeBlock — block coordinator handles spacing/sizing
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
    // Images load async — height unknown until load.
    // Use aspect-ratio 16:9 as default estimate, capped at 400px.
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

// --- Default plugin set ---

export function defaultPlugins(): EmbedPlugin[] {
  // Order matters: youtube must come before image (youtube images are also ImageNodes)
  return [codeBlockPlugin(), youtubePlugin(), imagePlugin(), hrPlugin()]
}
