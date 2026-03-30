'use client'

import React, { useState, useLayoutEffect, useRef, useMemo, useCallback } from 'react'
import { Markdown } from '@/lib/pretext-md/react'
import { parse } from '@/lib/pretext-md/core'
import { measureBlocks } from '@/lib/pretext-md/core/block-layout'
import { defaultConfig } from '@/lib/pretext-md/react/context'
import { defaultPlugins } from '@/lib/pretext-md/react/plugins'

import {
  ReasoningBlock,
  COLLAPSED_HEIGHT as REASONING_HEIGHT,
} from './blocks/reasoning'
import {
  ToolInvocationBlock,
  COLLAPSED_HEIGHT as TOOL_HEIGHT,
} from './blocks/tool-invocation'
import {
  AsyncEmbed,
  PLACEHOLDER_HEIGHT as EMBED_PLACEHOLDER,
} from './blocks/async-embed'
import { YouTubeEmbed } from '@/components/infsh/youtube-embed'
import ZoomableImage from '@/components/infsh/zoomable-image'

// --- Block definition ---

const plugins = defaultPlugins()

type DebugBlock = {
  label: string
  initialHeight: (width: number) => number // predicted before any DOM
  render: (width: number, onHeightChange: (height: number) => void) => React.ReactNode
}

function pretextHeight(md: string, width: number): number {
  return measureBlocks(parse(md), {
    maxWidth: width,
    fonts: defaultConfig.fonts,
    lineHeights: defaultConfig.lineHeights,
    plugins,
  }).height
}

const MD_PARAGRAPH = 'Here\'s the server with **JWT auth middleware**. The `/login` endpoint returns a token, and `/me` is a *protected route* that requires `Bearer <token>` in the Authorization header.'
const MD_CODE = '```typescript\nimport express from \'express\'\nimport jwt from \'jsonwebtoken\'\n\nconst app = express()\napp.use(express.json())\n\nconst SECRET = process.env.JWT_SECRET\n\nfunction authenticate(req, res, next) {\n  const token = req.headers.authorization?.split(\' \')[1]\n  if (!token) return res.status(401).json({ error: \'No token\' })\n  req.user = jwt.verify(token, SECRET)\n  next()\n}\n```'
const MD_LIST = '- **Rate limiting**: 100 requests per 15 minutes per IP\n- **Input validation**: `zod` schemas for request bodies\n- [CORS](https://example.com) configured for production'
const MD_BLOCKQUOTE = '> Pretext proved that text measurement can be **pure arithmetic** — zero DOM reads, zero reflows.'

function buildBlocks(): DebugBlock[] {
  return [
    {
      label: 'reasoning',
      initialHeight: () => REASONING_HEIGHT,
      render: (_, onH) => (
        <ReasoningBlock
          reasoning="The user wants a REST API with auth. Express + JWT is the standard approach."
          onHeightChange={onH}
        />
      ),
    },
    {
      label: 'tool: createFile',
      initialHeight: () => TOOL_HEIGHT,
      render: (_, onH) => (
        <ToolInvocationBlock
          invocation={{ toolName: 'createFile', state: 'result', result: { path: 'src/server.ts' } }}
          onHeightChange={onH}
        />
      ),
    },
    {
      label: 'tool: runCommand',
      initialHeight: () => TOOL_HEIGHT,
      render: (_, onH) => (
        <ToolInvocationBlock
          invocation={{ toolName: 'runCommand', state: 'result', result: { output: 'added 3 packages' } }}
          onHeightChange={onH}
        />
      ),
    },
    {
      label: 'paragraph (pretext)',
      initialHeight: (w) => pretextHeight(MD_PARAGRAPH, w),
      render: (w) => <Markdown content={MD_PARAGRAPH} maxWidth={w} />,
    },
    {
      label: 'code block (pretext)',
      initialHeight: (w) => pretextHeight(MD_CODE, w),
      render: (w) => <Markdown content={MD_CODE} maxWidth={w} />,
    },
    {
      label: 'list (pretext)',
      initialHeight: (w) => pretextHeight(MD_LIST, w),
      render: (w) => <Markdown content={MD_LIST} maxWidth={w} />,
    },
    {
      label: 'youtube (async)',
      initialHeight: () => EMBED_PLACEHOLDER,
      render: (_, onH) => (
        <AsyncEmbed onHeightChange={onH}>
          <YouTubeEmbed videoId="aqz-KE-bpKQ" title="Big Buck Bunny" />
        </AsyncEmbed>
      ),
    },
    {
      label: 'image (async)',
      initialHeight: () => EMBED_PLACEHOLDER,
      render: (_, onH) => (
        <AsyncEmbed onHeightChange={onH}>
          <ZoomableImage
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80"
            alt="Mountain"
            className="rounded-md max-w-full"
          />
        </AsyncEmbed>
      ),
    },
    {
      label: 'blockquote (pretext)',
      initialHeight: (w) => pretextHeight(MD_BLOCKQUOTE, w),
      render: (w) => <Markdown content={MD_BLOCKQUOTE} maxWidth={w} />,
    },
    {
      label: 'hr (pretext)',
      initialHeight: (w) => pretextHeight('---', w),
      render: (w) => <Markdown content="---" maxWidth={w} />,
    },
  ]
}

const GAP = 8

export default function PretextMdDebug() {
  const [width, setWidth] = useState(500)
  const [mounted, setMounted] = useState(false)
  // Actual heights reported by components (overrides initial prediction)
  const [actualHeights, setActualHeights] = useState<Map<number, number>>(() => new Map())

  useLayoutEffect(() => { setMounted(true) }, [])

  const contentWidth = width - 24
  const blocks = useMemo(() => mounted ? buildBlocks() : [], [mounted])

  const reportHeight = useCallback((index: number, height: number) => {
    setActualHeights(prev => {
      const existing = prev.get(index)
      if (existing !== undefined && Math.abs(existing - height) < 1) return prev
      const next = new Map(prev)
      next.set(index, height)
      return next
    })
  }, [])

  // Heights: use actual if reported, otherwise initial prediction
  const heights = useMemo(() => {
    return blocks.map((b, i) => {
      const initial = b.initialHeight(contentWidth)
      const actual = actualHeights.get(i)
      return { initial, current: actual ?? initial, source: actual !== undefined ? 'measured' : 'predicted' }
    })
  }, [blocks, contentWidth, actualHeights])

  const totalHeight = heights.reduce((s, h) => s + h.current, 0) + Math.max(0, blocks.length - 1) * GAP

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold">pretext-md debug</h1>
          <p className="text-muted-foreground">loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">pretext-md debug</h1>
          <p className="text-sm text-muted-foreground">
            Every block owns its measurement. Initial prediction vs actual DOM height.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Width: {width}px</label>
          <input
            type="range" min={300} max={800} value={width}
            onChange={e => setWidth(Number(e.target.value))}
            className="flex-1 max-w-xs"
          />
          <span className="text-xs text-muted-foreground">
            total: {Math.round(totalHeight)}px
          </span>
        </div>

        <div className="grid grid-cols-[1fr_1fr] gap-8">
          {/* LEFT: rendered */}
          <div>
            <div className="text-xs font-medium mb-2 text-muted-foreground">rendered</div>
            <div className="border border-border rounded-xl p-3 overflow-hidden" style={{ width }}>
              <div className="flex flex-col" style={{ gap: GAP }}>
                {blocks.map((block, i) => (
                  <DOMBlock key={i} label={block.label} height={heights[i]!}>
                    {block.render(contentWidth, (h) => reportHeight(i, h))}
                  </DOMBlock>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: table */}
          <div>
            <div className="text-xs font-medium mb-2 text-muted-foreground">height breakdown</div>
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-3 py-2 font-medium">block</th>
                    <th className="text-right px-3 py-2 font-medium w-16">initial</th>
                    <th className="text-right px-3 py-2 font-medium w-16">actual</th>
                    <th className="text-right px-3 py-2 font-medium w-16">diff</th>
                    <th className="text-right px-3 py-2 font-medium w-16">src</th>
                  </tr>
                </thead>
                <tbody>
                  {blocks.map((block, i) => {
                    const h = heights[i]!
                    const diff = Math.round(h.current - h.initial)
                    const hasDrift = Math.abs(diff) > 2 && h.source === 'predicted'
                    return (
                      <tr key={i} className={`border-t border-border ${hasDrift ? 'bg-red-500/10' : ''}`}>
                        <td className="px-3 py-1.5 truncate max-w-[200px]">{block.label}</td>
                        <td className="text-right px-3 py-1.5 font-mono">{Math.round(h.initial)}</td>
                        <td className="text-right px-3 py-1.5 font-mono">{Math.round(h.current)}</td>
                        <td className={`text-right px-3 py-1.5 font-mono ${hasDrift ? 'text-red-500 font-bold' : ''}`}>
                          {diff > 0 ? `+${diff}` : `${diff}`}
                        </td>
                        <td className="text-right px-3 py-1.5">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            h.source === 'measured' ? 'bg-amber-500' : hasDrift ? 'bg-red-500' : 'bg-emerald-500'
                          }`} />
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="border-t border-border bg-muted/30">
                    <td className="px-3 py-1 text-muted-foreground">gaps ({blocks.length - 1} × {GAP})</td>
                    <td className="text-right px-3 py-1 font-mono">{(blocks.length - 1) * GAP}</td>
                    <td className="text-right px-3 py-1 font-mono">{(blocks.length - 1) * GAP}</td>
                    <td className="text-right px-3 py-1 font-mono">0</td>
                    <td />
                  </tr>
                  <tr className="border-t-2 border-border font-medium">
                    <td className="px-3 py-2">total</td>
                    <td className="text-right px-3 py-2 font-mono">
                      {Math.round(heights.reduce((s, h) => s + h.initial, 0) + (blocks.length - 1) * GAP)}
                    </td>
                    <td className="text-right px-3 py-2 font-mono">{Math.round(totalHeight)}</td>
                    <td className="text-right px-3 py-2 font-mono">
                      {Math.round(totalHeight - (heights.reduce((s, h) => s + h.initial, 0) + (blocks.length - 1) * GAP))}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-xs text-muted-foreground space-y-1">
              <p><span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1" /> initial prediction accurate</p>
              <p><span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1" /> component reported actual height</p>
              <p><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" /> prediction drift &gt; 2px (no correction)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- DOM block with measurement badge ---

function DOMBlock({ label, height, children }: {
  label: string
  height: { initial: number; current: number; source: string }
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [domHeight, setDomHeight] = useState<number | null>(null)

  useLayoutEffect(() => {
    if (ref.current) setDomHeight(ref.current.offsetHeight)
  })

  const diff = domHeight !== null ? Math.round(domHeight - height.current) : null
  const hasDrift = diff !== null && Math.abs(diff) > 2
  const isAsync = height.source === 'measured'

  return (
    <div ref={ref} className="relative">
      <div className={`absolute -left-1 top-0 bottom-0 w-0.5 rounded ${
        hasDrift ? 'bg-red-500' : isAsync ? 'bg-amber-500' : 'bg-emerald-500/50'
      }`} />
      <div className={`absolute -right-1 -top-1 text-[9px] px-1 rounded z-10 whitespace-nowrap ${
        hasDrift ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground'
      }`}>
        {Math.round(height.current)}px
        {domHeight !== null && diff !== 0 ? ` (dom: ${Math.round(domHeight)}, ${diff! > 0 ? '+' : ''}${diff})` : ''}
      </div>
      {children}
    </div>
  )
}
