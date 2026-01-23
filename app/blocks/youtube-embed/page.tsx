'use client'

import { PageLayout } from '@/components/page-layout'
import { CodeBlock } from '@/registry/blocks/code-block/code-block'
import { YouTubeEmbed } from '@/registry/blocks/youtube-embed/youtube-embed'
import type { TocItem } from '@/registry/blocks/table-of-contents/table-of-contents'

const tocItems: TocItem[] = [
  { id: 'examples', title: 'examples' },
  { id: 'installation', title: 'installation' },
  { id: 'usage', title: 'usage' },
  { id: 'props', title: 'props' },
]

const usageCode = `import { YouTubeEmbed } from '@/components/youtube-embed'

export function MyVideo() {
  return (
    <YouTubeEmbed
      videoId="dQw4w9WgXcQ"
      title="My Video"
    />
  )
}`

export default function YouTubeEmbedPage() {
  return (
    <PageLayout toc={tocItems}>
      <div className="max-w-4xl space-y-12">
        {/* Header */}
        <header className="space-y-4">
          <h1 className="text-3xl font-bold">youtube embed</h1>
          <p className="text-muted-foreground">
            responsive youtube video embed with loading state.
          </p>
        </header>

        {/* Examples */}
        <section id="examples" className="space-y-4">
          <h2 className="text-2xl font-semibold">examples</h2>
          <YouTubeEmbed videoId="2HOkLrLU5Vs" />
        </section>

        {/* Installation */}
        <section id="installation" className="space-y-4">
          <h2 className="text-2xl font-semibold">installation</h2>
          <CodeBlock language="bash">
            npx shadcn@latest add https://ui.inference.sh/r/youtube-embed.json
          </CodeBlock>
        </section>

        {/* Usage */}
        <section id="usage" className="space-y-4">
          <h2 className="text-2xl font-semibold">usage</h2>
          <CodeBlock language="tsx">{usageCode}</CodeBlock>
        </section>

        {/* Props */}
        <section id="props" className="space-y-4">
          <h2 className="text-2xl font-semibold">props</h2>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left font-medium">prop</th>
                  <th className="px-4 py-2 text-left font-medium">type</th>
                  <th className="px-4 py-2 text-left font-medium">description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">videoId</td>
                  <td className="px-4 py-2 font-mono text-xs">string</td>
                  <td className="px-4 py-2 text-xs">youtube video id</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
