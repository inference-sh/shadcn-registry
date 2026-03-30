'use client'

import React from 'react'
import type {
  ImageNode,
  EmbedPlugin,
} from '../core/types'
import { YouTubeEmbed } from '@/components/infsh/youtube-embed'
import ZoomableImage from '@/components/infsh/zoomable-image'

// --- YouTube detection ---

function getYouTubeVideoId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/)
  return m?.[1] ?? null
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

// --- Default plugin set ---

export function defaultPlugins(): EmbedPlugin[] {
  return [youtubePlugin(), imagePlugin(), hrPlugin()]
}
