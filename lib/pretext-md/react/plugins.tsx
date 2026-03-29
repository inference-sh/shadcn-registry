'use client'

import React from 'react'
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

export function codeBlockPlugin(): EmbedPlugin {
  return {
    name: 'code-block',
    match: (node) => node.kind === 'code-block',
    measure: (node) => {
      const lineCount = node.code.split('\n').length
      const hasHeader = !!node.lang
      // Matches CodeBlock component (with !my-0, showLineNumbers=false):
      // header: py-2(16) + text-xs leading(18) + border-b(1) = 35
      // content: p-4(32) + lines * leading-6(24)
      // border: top(1) + bottom(1)
      const height =
        (hasHeader ? 35 : 0) + 32 + lineCount * 24 + 2
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
    measure: () => ({ kind: 'fixed', height: 300 }),
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
