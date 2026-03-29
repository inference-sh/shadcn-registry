'use client'

import React, { useState, useLayoutEffect, useMemo } from 'react'
import { Markdown } from '@/lib/pretext-md/react'
import { parse } from '@/lib/pretext-md/core'
import { measureBlocks } from '@/lib/pretext-md/core/block-layout'
import { shrinkwrap } from '@/lib/pretext-md/core/shrinkwrap'
import { defaultConfig } from '@/lib/pretext-md/react/context'
import { defaultPlugins } from '@/lib/pretext-md/react/plugins'

// --- Sample content ---

const SAMPLE_MARKDOWN = `# Hello pretext-md

This is a **measured markdown** renderer powered by [pretext](https://github.com/chenglou/pretext).

Every line is measured with *pure arithmetic* — no DOM reflow, no \`getBoundingClientRect\`, no guessing.

## Features

- **Bold** and *italic* and ~~strikethrough~~
- Inline \`code\` with proper measurement
- [Links](https://example.com) that work
- Mixed **bold and *bold italic*** text

## Code blocks

\`\`\`typescript
import { measure, shrinkwrap } from 'pretext-md'

const result = measure(markdown, {
  maxWidth: 400,
  fonts: { body: '14px "Inter"', bold: 'bold 14px "Inter"' },
})

result.height    // exact total height in px
result.lineCount // total lines across all blocks
\`\`\`

## Embeds

![Big Buck Bunny](https://www.youtube.com/watch?v=aqz-KE-bpKQ)

![A mountain landscape](https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80)

---

> Pretext proved that text measurement can be pure arithmetic — zero DOM reads, zero reflows. pretext-md bridges the gap between "markdown string" and "measured layout."

Regular paragraph after the blockquote. This text demonstrates how pretext-md handles line wrapping with exact width prediction. No layout shift, no reflow.`

const BUBBLE_MESSAGES = [
  "Hey, did you see the new **pretext-md** library? It does *exact height prediction* for markdown before anything touches the DOM.",
  "That sounds cool but how is it different from just using `react-markdown`?",
  "The key difference is **shrinkwrap** — it finds the tightest bubble width that keeps the same line count. CSS `fit-content` always wastes space on multiline text.",
  "Oh interesting, so the bubble is as narrow as possible without adding extra line breaks?",
  "Exactly. And because it uses [pretext](https://github.com/chenglou/pretext) for measurement, it handles **bold**, *italic*, `code`, and [links](https://example.com) with mixed fonts correctly.",
  "Nice, does it work with code blocks too?\n\n```js\nconst x = 42\n```",
  "Yep — code blocks get `computed` height: `lineCount × lineHeight + padding`. No DOM measurement needed.",
]

const PADDING_X = 12

// --- Hooks ---

const plugins = defaultPlugins()

function useMeasure(markdown: string, width: number, mounted: boolean) {
  return useMemo(() => {
    if (!mounted || width <= 0) return null
    const blocks = parse(markdown)
    const config = {
      maxWidth: width,
      fonts: defaultConfig.fonts,
      lineHeights: defaultConfig.lineHeights,
      plugins,
    }
    const result = measureBlocks(blocks, config)
    const sw = shrinkwrap(markdown, config)
    return { result, sw }
  }, [markdown, width, mounted])
}

function useBubbleShrinkwrap(text: string, maxWidth: number, mounted: boolean) {
  return useMemo(() => {
    if (!mounted || maxWidth <= 0) return null
    const contentMax = maxWidth - PADDING_X * 2
    const config = {
      maxWidth: contentMax,
      fonts: defaultConfig.fonts,
      lineHeights: defaultConfig.lineHeights,
    }
    const sw = shrinkwrap(text, config)
    return {
      shrinkWidth: sw.width + PADDING_X * 2,
      shrinkHeight: sw.height,
      fullWidth: maxWidth,
    }
  }, [text, maxWidth, mounted])
}

// --- Main page ---

export default function PretextMdDemo() {
  const [width, setWidth] = useState(500)
  const [bubbleMax, setBubbleMax] = useState(360)
  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN)
  const [mounted, setMounted] = useState(false)

  useLayoutEffect(() => { setMounted(true) }, [])

  const measured = useMeasure(markdown, width, mounted)
  const result = measured?.result
  const sw = measured?.sw
  const contentWidth = width - 32

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">pretext-md demo</h1>
          <p className="text-muted-foreground">loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto space-y-12">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold mb-1">pretext-md</h1>
          <p className="text-muted-foreground">
            measured markdown renderer — exact heights, shrinkwrap widths, zero reflow
          </p>
        </div>

        {/* ==================== SHRINKWRAP SHOWDOWN ==================== */}
        <section>
          <h2 className="text-lg font-bold mb-1">shrinkwrap showdown</h2>
          <p className="text-sm text-muted-foreground mb-4">
            CSS <code className="bg-muted rounded px-1 text-xs">fit-content</code> vs pretext shrinkwrap.
            Same messages, same max width. Shrinkwrap finds the tightest bubble that preserves line count.
          </p>

          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm font-medium whitespace-nowrap">
              Max bubble: {bubbleMax}px
            </label>
            <input
              type="range"
              min={200}
              max={500}
              value={bubbleMax}
              onChange={(e) => setBubbleMax(Number(e.target.value))}
              className="flex-1 max-w-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* CSS fit-content */}
            <div>
              <div className="text-xs font-medium mb-3 text-muted-foreground">
                CSS fit-content
              </div>
              <div className="space-y-2">
                {BUBBLE_MESSAGES.map((msg, i) => (
                  <FitContentBubble key={i} text={msg} maxWidth={bubbleMax} isUser={i % 2 === 1} />
                ))}
              </div>
            </div>

            {/* pretext shrinkwrap */}
            <div>
              <div className="text-xs font-medium mb-3">
                pretext shrinkwrap
              </div>
              <div className="space-y-2">
                {BUBBLE_MESSAGES.map((msg, i) => (
                  <ShrinkwrapBubble key={i} text={msg} maxWidth={bubbleMax} isUser={i % 2 === 1} mounted={mounted} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ==================== HEIGHT PREDICTION ==================== */}
        <section>
          <h2 className="text-lg font-bold mb-1">height prediction</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Exact height before render. The container is pre-sized — no layout shift, no <code className="bg-muted rounded px-1 text-xs">ResizeObserver</code>.
          </p>

          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm font-medium whitespace-nowrap">
              Width: {width}px
            </label>
            <input
              type="range"
              min={200}
              max={800}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="flex-1 max-w-xs"
            />
            {result && sw && (
              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {result.blocks.length} blocks · {result.lineCount} lines · {Math.round(result.height)}px
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Flow */}
            <div>
              <div className="text-xs font-medium mb-2 text-muted-foreground">
                flow (browser layout)
              </div>
              <div
                className="border border-border rounded-md p-4 overflow-hidden"
                style={{ width }}
              >
                <Markdown content={markdown} maxWidth={contentWidth} measured={false} />
              </div>
            </div>

            {/* Measured */}
            <div>
              <div className="text-xs font-medium mb-2">
                measured (pretext)
                {result && (
                  <span className="text-muted-foreground font-normal ml-2">
                    {Math.round(result.height)}px predicted
                  </span>
                )}
              </div>
              <div
                className="border border-border rounded-md p-4 relative overflow-hidden"
                style={{ width }}
              >
                <Markdown content={markdown} maxWidth={contentWidth} />
              </div>
            </div>
          </div>

          {result && (
            <div className="mt-3 flex gap-2 flex-wrap">
              {result.blocks.map((b, i) => (
                <span key={i} className="text-xs bg-muted rounded px-2 py-1 text-muted-foreground">
                  {b.node.kind} {Math.round(b.height)}px
                </span>
              ))}
            </div>
          )}
        </section>

        {/* ==================== EDITOR ==================== */}
        <section>
          <h2 className="text-lg font-bold mb-1">try it</h2>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="w-full h-48 bg-muted rounded-md p-3 text-sm font-mono resize-y border border-border"
          />
        </section>
      </div>
    </div>
  )
}

// --- Bubble components ---

function FitContentBubble({ text, maxWidth, isUser }: { text: string; maxWidth: number; isUser: boolean }) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`rounded-2xl px-3 py-2 text-sm ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
        style={{ maxWidth, width: 'fit-content' }}
      >
        <Markdown content={text} maxWidth={maxWidth - PADDING_X * 2} measured={false} />
      </div>
    </div>
  )
}

function ShrinkwrapBubble({
  text, maxWidth, isUser, mounted,
}: {
  text: string; maxWidth: number; isUser: boolean; mounted: boolean
}) {
  const sw = useBubbleShrinkwrap(text, maxWidth, mounted)

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`rounded-2xl px-3 py-2 text-sm relative ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
        style={{ width: sw?.shrinkWidth ?? maxWidth, maxWidth }}
      >
        <Markdown content={text} maxWidth={(sw?.shrinkWidth ?? maxWidth) - PADDING_X * 2} />
        {sw && (
          <div className="absolute -bottom-4 left-0 text-[10px] text-muted-foreground">
            {sw.shrinkWidth}px
            {sw.shrinkWidth < sw.fullWidth && (
              <span className="text-primary ml-1">
                −{sw.fullWidth - sw.shrinkWidth}px
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
