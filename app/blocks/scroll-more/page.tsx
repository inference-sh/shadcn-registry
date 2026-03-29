'use client'

import { useState } from 'react'
import { PageLayout } from '@/components/page-layout'
import { ScrollMore } from '@/registry/blocks/scroll-more/scroll-more'
import { CodeBlock } from '@/registry/blocks/code-block/code-block'
import type { TocItem } from '@/registry/blocks/table-of-contents/table-of-contents'

const tocItems: TocItem[] = [
  { id: 'examples', title: 'examples' },
  { id: 'fade-only', title: 'fade only', level: 2 },
  { id: 'badge-only', title: 'badge only', level: 2 },
  { id: 'both', title: 'both', level: 2 },
  { id: 'installation', title: 'installation' },
  { id: 'usage', title: 'usage' },
  { id: 'props', title: 'props' },
]

const usageCode = `import { ScrollMore } from "@/components/scroll-more"

export function TermsPanel() {
  return (
    <div className="h-[300px]">
      <ScrollMore indicator="both">
        <div className="p-4 space-y-4">
          <p>lots of content here...</p>
          {/* more content */}
        </div>
      </ScrollMore>
    </div>
  )
}`

const sampleItems = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  label: [
    'review submission documents',
    'verify identity credentials',
    'check compliance requirements',
    'validate tax information',
    'process background check',
    'confirm address details',
    'review financial statements',
    'check licensing status',
    'validate insurance coverage',
    'process payment information',
    'verify employment history',
    'check reference contacts',
    'review legal disclosures',
    'validate certification status',
    'process security clearance',
    'confirm beneficiary details',
    'review audit findings',
    'check regulatory filings',
    'validate reporting data',
    'process final approval',
  ][i],
}))

function DemoBox({
  indicator,
  label,
}: {
  indicator: 'fade' | 'badge' | 'both'
  label: string
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="h-[250px] border rounded-lg bg-card">
        <ScrollMore indicator={indicator} className="h-full">
          <div className="p-4 space-y-2">
            {sampleItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-3 py-2 rounded-md border text-sm"
              >
                <span className="text-muted-foreground/50 font-mono text-xs w-6">{item.id}.</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </ScrollMore>
      </div>
    </div>
  )
}

export default function ScrollMorePage() {
  return (
    <PageLayout toc={tocItems}>
      <div className="max-w-4xl space-y-12">
        <header className="space-y-4">
          <h1 className="text-3xl font-bold">scroll more</h1>
          <p className="text-muted-foreground">
            scroll indicator wrapper — shows gradient fades and/or a clickable badge
            when content overflows. useful for panels, sidebars, and forms where
            users might not realize there's more content below.
          </p>
        </header>

        {/* examples */}
        <section id="examples" className="space-y-8">
          <h2 className="text-2xl font-semibold">examples</h2>

          <div id="fade-only">
            <DemoBox indicator="fade" label="fade only — subtle gradient at edges" />
          </div>

          <div id="badge-only">
            <DemoBox indicator="badge" label="badge only — clickable pill that scrolls down" />
          </div>

          <div id="both">
            <DemoBox indicator="both" label="both (default) — fade + badge" />
          </div>
        </section>

        {/* installation */}
        <section id="installation" className="space-y-4">
          <h2 className="text-2xl font-semibold">installation</h2>
          <CodeBlock language="bash">
            npx shadcn@latest add https://ui.inference.sh/r/scroll-more.json
          </CodeBlock>
        </section>

        {/* usage */}
        <section id="usage" className="space-y-4">
          <h2 className="text-2xl font-semibold">usage</h2>
          <CodeBlock language="tsx">{usageCode}</CodeBlock>
        </section>

        {/* props */}
        <section id="props" className="space-y-4">
          <h2 className="text-2xl font-semibold">props</h2>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium">prop</th>
                  <th className="text-left px-4 py-2 font-medium">type</th>
                  <th className="text-left px-4 py-2 font-medium">default</th>
                  <th className="text-left px-4 py-2 font-medium">description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">indicator</td>
                  <td className="px-4 py-2 font-mono text-xs">'fade' | 'badge' | 'both'</td>
                  <td className="px-4 py-2 font-mono text-xs">'both'</td>
                  <td className="px-4 py-2 text-muted-foreground">which scroll indicators to show</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">fadeHeight</td>
                  <td className="px-4 py-2 font-mono text-xs">number</td>
                  <td className="px-4 py-2 font-mono text-xs">32</td>
                  <td className="px-4 py-2 text-muted-foreground">gradient fade height in pixels</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">badgeLabel</td>
                  <td className="px-4 py-2 font-mono text-xs">string</td>
                  <td className="px-4 py-2 font-mono text-xs">'scroll for more'</td>
                  <td className="px-4 py-2 text-muted-foreground">text shown in the badge pill</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">className</td>
                  <td className="px-4 py-2 font-mono text-xs">string</td>
                  <td className="px-4 py-2 font-mono text-xs">—</td>
                  <td className="px-4 py-2 text-muted-foreground">additional classes for the wrapper</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
