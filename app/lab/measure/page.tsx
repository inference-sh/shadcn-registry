'use client'

// Measurement lab — regression page for measured-text layout.
//
// Measured lines are white-space:nowrap, so they cannot wrap on their own: if
// the renderer lays text out wider than the box it renders into, the excess
// spills past the border instead of reflowing. That is invisible at full width
// and obvious when narrow, so drag the slider left.
//
// Originally built to settle whether measuring our own element was circular.
// It is not — see the comment on the measurement effect in renderer.tsx.

import * as React from 'react'
import { Markdown, contentBoxWidth } from '@/lib/pretext-md/react/renderer'

const SAMPLE = `**Responsive reflow** — drag the slider to resize. Text is re-measured on every width change.

A longer paragraph that exercises the line breaking machinery across many candidate break opportunities, including hyphenated-words and punctuation, so the layout pass has real work to do rather than trivially short input.

\`\`\`typescript
const strategy = { kind: 'computed', measure: (w) => measureBlocks(parse(md), w) }
\`\`\`

> Blockquotes are measured recursively — the indent is subtracted from maxWidth.
`

type Stats = { contentWidth: number; overflow: number }

function useStats(ref: React.RefObject<HTMLDivElement | null>, dep: number): Stats | null {
  const [stats, setStats] = React.useState<Stats | null>(null)

  React.useEffect(() => {
    const id = requestAnimationFrame(() => {
      const box = ref.current
      if (!box) return
      setStats({
        // Same helper the renderer measures with, so the reference width and
        // the measured width cannot drift apart (notably in rounding).
        contentWidth: contentBoxWidth(box),
        // scrollWidth is exactly the overflow extent being tested for — one
        // property read instead of rect-measuring the whole subtree.
        overflow: Math.max(0, box.scrollWidth - box.clientWidth),
      })
    })
    return () => cancelAnimationFrame(id)
  }, [ref, dep])

  return stats
}

function Variant({
  label,
  width,
  note,
  fit = false,
}: {
  label: string
  width: number
  note: string
  /** Size the box to its content (w-fit), as agent tool-invocation cards do. */
  fit?: boolean
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const stats = useStats(ref, width)
  const bad = (stats?.overflow ?? 0) > 0

  return (
    <div className="flex-1 min-w-0 space-y-2">
      <h2 className="text-sm font-semibold">{label}</h2>
      <p className="text-xs text-muted-foreground min-h-[32px]">{note}</p>

      <div
        className={`rounded-md border px-2 py-1 text-[11px] font-mono ${
          bad ? 'border-red-500 text-red-500' : 'text-muted-foreground'
        }`}
      >
        content {stats?.contentWidth ?? '–'}px · overflow {stats?.overflow ?? '–'}px{' '}
        {bad ? '← OVERFLOWING' : '✓'}
      </div>

      {/* Padded + bordered, so any measurement that ignores padding visibly
          spills past the border. `fit` reproduces the agent tool-invocation
          shape, where the box is sized by its content rather than given a
          width. */}
      <div style={{ width: `${width}%` }} className="transition-[width] duration-100">
        <div
          ref={ref}
          className={`border rounded-lg p-4 bg-card ${fit ? 'w-fit max-w-full' : ''}`}
        >
          <Markdown content={SAMPLE} />
        </div>
      </div>
    </div>
  )
}

export default function MeasureLab() {
  const [width, setWidth] = React.useState(100)

  return (
    <div className="mx-auto max-w-6xl p-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">measurement lab</h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Identical content in two container shapes. Overflow must stay at 0 at every width — a
          non-zero value means text is being laid out wider than the box it renders into.
        </p>
      </header>

      <div className="flex items-center gap-4 sticky top-0 bg-background/95 backdrop-blur py-3 z-10 border-b">
        <label className="text-sm font-medium whitespace-nowrap">Width: {width}%</label>
        <input
          type="range"
          min={20}
          max={100}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          className="flex-1"
        />
        <div className="flex gap-1">
          {[100, 60, 40, 25].map((p) => (
            <button
              key={p}
              onClick={() => setWidth(p)}
              className="rounded border px-2 py-1 text-xs hover:bg-muted cursor-pointer"
            >
              {p}%
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-8 items-start">
        <Variant
          label="fixed-width parent"
          width={width}
          note="The common case: a padded, bordered box with an explicit width."
        />
        <Variant
          label="content-sized parent (w-fit max-w-full)"
          width={width}
          fit
          note="The agent tool-invocation shape, where the box is sized by its content."
        />
      </div>

      <section className="text-xs text-muted-foreground border-t pt-4 space-y-1">
        <p><strong>How to read it:</strong></p>
        <p>· overflow &gt; 0 means content is wider than the box it renders into — text crosses the border.</p>
        <p>· Both shapes should track the box down to 20% with overflow 0.</p>
      </section>
    </div>
  )
}
