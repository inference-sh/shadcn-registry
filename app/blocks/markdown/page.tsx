'use client'

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { PageLayout } from '@/components/page-layout'
import { Markdown } from '@/lib/pretext-md/react'
import { useVirtualizedList, type VirtualItem, type MeasureStrategy } from '@/lib/virtualize'
import { parse } from '@/lib/pretext-md/core/parser'
import { measureBlocks } from '@/lib/pretext-md/core/block-layout'
import { defaultConfig } from '@/lib/pretext-md/react/context'
import { defaultPlugins } from '@/lib/pretext-md/react/plugins'
import type { TocItem } from '@/registry/blocks/table-of-contents/table-of-contents'

const tocItems: TocItem[] = [
  { id: 'plugins', title: 'plugins' },
  { id: 'responsive', title: 'responsive', level: 2 },
  { id: 'virtualized', title: 'virtualized', level: 2 },
  { id: 'installation', title: 'installation' },
]

// --- Plugin showcase content ---

const PLUGIN_EXAMPLES: { title: string; content: string }[] = [
  {
    title: 'headings & inline formatting',
    content: `# Heading 1
## Heading 2
### Heading 3

Regular paragraph with **bold**, *italic*, and ~~strikethrough~~ text. Inline \`code\` works too. Links like [inference.sh](https://inference.sh) are styled automatically.

> Blockquotes can contain **mixed formatting** and work with the measurement engine — every line is measured, not estimated.`,
  },
  {
    title: 'code blocks',
    content: `\`\`\`typescript
interface MeasureStrategy {
  kind: 'fixed' | 'computed'
  height?: number
  measure?: (width: number) => number
}

// Height = lines × lineHeight + chrome
// No DOM needed — pure arithmetic
function measureCodeBlock(code: string, lineHeight = 18) {
  const lines = code.split('\\n').length
  return lines * lineHeight + 67 // header + padding + border
}
\`\`\``,
  },
  {
    title: 'tables',
    content: `| Feature | Measured | Plugin |
|---------|----------|--------|
| Paragraphs | pretext inline layout | core |
| Headings | pretext with font config | core |
| Code blocks | lines × lineHeight + chrome | code-block |
| Tables | rows × rowHeight + header | table |
| Blockquotes | recursive with indent | blockquote |
| Lists | recursive with indent | list |
| Images | aspect ratio, max height | image |
| YouTube | 16:9 aspect ratio | youtube |
| HR | fixed 1px | hr |`,
  },
  {
    title: 'lists',
    content: `**Unordered:**
- Text measurement via [pretext](https://github.com/chenglou/pretext) — pure canvas, zero DOM
- Plugin system — blocks own their dimensions **and** rendering
- Virtualizable — strategy heights feed directly into the virtualizer

**Ordered with nesting:**
1. Parse markdown (remark + remark-gfm)
2. Walk AST into layout IR (\`BlockNode\` / \`InlineItem\`)
3. Measure:
   - Inline: pretext \`prepareWithSegments\` + \`layoutNextLine\`
   - Blocks: plugins handle their own height
4. Render measured lines or fall back to flow mode`,
  },
  {
    title: 'images & embeds',
    content: `Images are zoomable — click to expand:

![Mountain landscape](https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80)

YouTube links auto-embed:

![Video](https://www.youtube.com/watch?v=aqz-KE-bpKQ)

---

Horizontal rules are a 1px fixed-height plugin.`,
  },
]

// --- Virtualized demo content ---

const VIRTUAL_MESSAGES = [
  "**Message 1** — Every block in this list is measured *before* it enters the DOM. The virtualizer only renders what's visible.",
  "Here's a code block inside a virtualized item:\n\n```typescript\nconst strategy: MeasureStrategy = {\n  kind: 'computed',\n  measure: (width) => measureBlocks(parse(content), config).height\n}\n```",
  "Lists work too:\n- Item one with **bold**\n- Item two with `inline code`\n- Item three with [a link](https://inference.sh)",
  "| Col A | Col B |\n|-------|-------|\n| Tables | work |\n| inside | virtualized items |",
  "> Blockquotes are measured recursively — the indent is subtracted from maxWidth, then inner blocks are measured at the narrower width.",
  "Short message.",
  "**Longer message** with multiple paragraphs.\n\nThe second paragraph continues here with *italic* and ~~strikethrough~~ formatting.\n\n```bash\nnpx shadcn@latest add https://ui.inference.sh/r/markdown.json\n```\n\nAnd a final paragraph after the code block.",
  "Plain text — no formatting at all. Just measured with pretext's body font.",
]

function generateVirtualMessages(count: number): { id: number; content: string }[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    content: VIRTUAL_MESSAGES[i % VIRTUAL_MESSAGES.length]!,
  }))
}

// --- Page ---

export default function MarkdownDemoPage() {
  const [width, setWidth] = useState(100)
  const [msgCount, setMsgCount] = useState(200)

  return (
    <PageLayout toc={tocItems}>
      <div className="max-w-4xl space-y-12">
        {/* Header */}
        <header className="space-y-4">
          <h1 className="text-3xl font-bold">markdown</h1>
          <p className="text-lg text-muted-foreground">
            measured markdown renderer powered by <a href="https://github.com/chenglou/pretext" className="underline">pretext</a>. every block is measured before it hits the DOM — pure arithmetic, zero reflows.
          </p>
        </header>

        {/* Plugins */}
        <section id="plugins" className="space-y-6">
          <h2 className="text-2xl font-semibold">plugins</h2>
          <p className="text-muted-foreground text-sm">
            each block type is a plugin that owns its measurement and rendering. core only handles paragraphs and headings.
          </p>

          <div className="space-y-4">
            {PLUGIN_EXAMPLES.map((ex) => (
              <div key={ex.title} className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 border-b">
                  <h3 className="text-sm font-medium">{ex.title}</h3>
                </div>
                <div className="p-4">
                  <Markdown content={ex.content} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Responsive */}
        <section id="responsive" className="space-y-6">
          <h2 className="text-2xl font-semibold">responsive</h2>
          <p className="text-muted-foreground text-sm">
            text reflows on width change. the component auto-measures its container via ResizeObserver.
          </p>

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium whitespace-nowrap">Width: {width}%</label>
            <input
              type="range"
              min={30}
              max={100}
              step={5}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="flex-1 max-w-xs"
            />
          </div>

          <div
            className="border rounded-lg p-4 transition-[width] duration-150"
            style={{ width: `${width}%` }}
          >
            <Markdown content={`**Responsive reflow** — drag the slider to resize. Text is re-measured via pretext on every width change. Code blocks, tables, and embeds adapt too.

\`\`\`typescript
// pretext measures text with canvas
// zero DOM reads, zero layout thrashing
const prepared = prepareWithSegments(runs, font)
let line = layoutNextLine(prepared, maxWidth)
\`\`\`

| Feature | Responsive |
|---------|-----------|
| Text | Reflows via pretext |
| Code | Scrolls horizontally |
| Tables | Overflow scroll |
| Images | Aspect ratio preserved |

- List items reflow with the container
- **Bold** and *italic* text stays on the correct lines
- Inline \`code\` respects word boundaries`} />
          </div>
        </section>

        {/* Virtualized */}
        <section id="virtualized" className="space-y-6">
          <h2 className="text-2xl font-semibold">virtualized</h2>
          <p className="text-muted-foreground text-sm">
            measurement strategies feed directly into a virtualizer. only visible items are in the DOM.
          </p>

          <VirtualizedDemo msgCount={msgCount} setMsgCount={setMsgCount} />
        </section>

        {/* Installation */}
        <section id="installation" className="space-y-4">
          <h2 className="text-2xl font-semibold">installation</h2>
          <Markdown content={`\`\`\`bash
npx shadcn@latest add https://ui.inference.sh/r/markdown.json
\`\`\``} />
        </section>
      </div>
    </PageLayout>
  )
}

// --- Virtualized list demo ---

const plugins = defaultPlugins()

function VirtualizedDemo({ msgCount, setMsgCount }: { msgCount: number; setMsgCount: (n: number) => void }) {
  const containerElRef = useRef<HTMLDivElement | null>(null)
  const roRef = useRef<ResizeObserver | null>(null)
  const [chatWidth, setChatWidth] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)

  const containerRef = useCallback((el: HTMLDivElement | null) => {
    if (roRef.current) { roRef.current.disconnect(); roRef.current = null }
    containerElRef.current = el
    if (!el) return
    setChatWidth(el.clientWidth)
    setViewportHeight(el.clientHeight)
    roRef.current = new ResizeObserver(() => {
      if (!containerElRef.current) return
      setChatWidth(containerElRef.current.clientWidth)
      setViewportHeight(containerElRef.current.clientHeight)
    })
    roRef.current.observe(el)
  }, [])

  const messages = useMemo(() => generateVirtualMessages(msgCount), [msgCount])
  const innerWidth = chatWidth > 32 ? chatWidth - 32 : 0

  const virtualItems: VirtualItem<{ id: number; content: string }>[] = useMemo(() => {
    if (innerWidth <= 0) return []
    return messages.map(msg => ({
      id: msg.id,
      strategy: {
        kind: 'computed' as const,
        measure: (w: number) => {
          const blocks = parse(msg.content)
          const result = measureBlocks(blocks, {
            maxWidth: w,
            fonts: defaultConfig.fonts,
            lineHeights: defaultConfig.lineHeights,
            plugins,
          })
          return result.height
        },
      },
      data: msg,
    }))
  }, [messages, innerWidth])

  const list = useVirtualizedList(virtualItems, viewportHeight, innerWidth, 12)

  return (
    <>
      <div className="flex items-center gap-4 flex-wrap">
        <label className="text-sm font-medium whitespace-nowrap">Items: {msgCount}</label>
        <input
          type="range"
          min={50}
          max={1000}
          step={50}
          value={msgCount}
          onChange={(e) => setMsgCount(Number(e.target.value))}
          className="flex-1 max-w-[150px]"
        />
        <div className="flex gap-3 text-xs">
          <span className="bg-muted rounded px-2 py-1">{list.totalCount} total</span>
          <span className="bg-primary/10 text-primary rounded px-2 py-1">{list.renderedCount} in DOM</span>
          <span className="bg-muted rounded px-2 py-1">{Math.round(list.totalHeight).toLocaleString()}px</span>
        </div>
      </div>

      <div
        ref={(el) => {
          containerRef(el)
          list.scrollRef(el)
        }}
        className="border rounded-lg overflow-y-auto bg-muted/10"
        style={{ height: 400 }}
      >
        <div style={{ height: list.topSpacer }} />
        <div className="flex flex-col gap-3 px-4 py-3">
          {list.items.map(item => (
            <div
              key={item.id}
              ref={list.getItemRef(item.id)}
              className="border border-border/50 rounded-lg p-3 bg-background"
            >
              <div className="text-[10px] text-muted-foreground/40 mb-1">#{item.data.id}</div>
              <Markdown content={item.data.content} />
            </div>
          ))}
        </div>
        <div style={{ height: list.bottomSpacer }} />
      </div>
    </>
  )
}
