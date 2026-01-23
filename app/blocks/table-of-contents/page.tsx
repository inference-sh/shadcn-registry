'use client'

import { PageLayout } from '@/components/page-layout'
import { CodeBlock } from '@/registry/blocks/code-block/code-block'
import { TableOfContents, type TocItem } from '@/registry/blocks/table-of-contents/table-of-contents'

const tocItems: TocItem[] = [
  { id: 'examples', title: 'examples' },
  { id: 'basic', title: 'basic usage', level: 2 },
  { id: 'nested', title: 'nested sections', level: 2 },
  { id: 'installation', title: 'installation' },
  { id: 'usage', title: 'usage' },
  { id: 'props', title: 'props' },
]

const usageCode = `import { TableOfContents, type TocItem } from '@/components/table-of-contents'

const items: TocItem[] = [
  { id: 'introduction', title: 'Introduction' },
  { id: 'getting-started', title: 'Getting Started' },
  { id: 'installation', title: 'Installation', level: 2 },
  { id: 'configuration', title: 'Configuration', level: 2 },
  { id: 'api', title: 'API Reference' },
]

export function MyTableOfContents() {
  return <TableOfContents items={items} />
}`

const basicTocItems: TocItem[] = [
  { id: 'overview', title: 'overview' },
  { id: 'features', title: 'features' },
  { id: 'getting-started', title: 'getting started' },
]

const nestedTocItems: TocItem[] = [
  { id: 'introduction', title: 'introduction' },
  { id: 'installation', title: 'installation' },
  { id: 'npm', title: 'npm', level: 2 },
  { id: 'yarn', title: 'yarn', level: 2 },
  { id: 'usage', title: 'usage' },
  { id: 'basic-example', title: 'basic example', level: 2 },
  { id: 'advanced-example', title: 'advanced example', level: 2 },
]

export default function TableOfContentsPage() {
  return (
    <PageLayout toc={tocItems}>
      <div className="max-w-4xl space-y-12">
        {/* Header */}
        <header className="space-y-4">
          <h1 className="text-3xl font-bold">table of contents</h1>
          <p className="text-muted-foreground">
            auto-scrolling table of contents with intersection observer for active section highlighting.
          </p>
        </header>

        {/* Examples */}
        <section id="examples" className="space-y-8">
          <h2 className="text-2xl font-semibold">examples</h2>

          <div id="basic" className="space-y-4">
            <h3 className="text-lg font-medium">basic usage</h3>
            <p className="text-sm text-muted-foreground">
              simple flat table of contents.
            </p>
            <div className="border rounded-lg p-4 bg-background max-w-xs">
              <TableOfContents items={basicTocItems} />
            </div>
          </div>

          <div id="nested" className="space-y-4">
            <h3 className="text-lg font-medium">nested sections</h3>
            <p className="text-sm text-muted-foreground">
              table of contents with nested subsections using the level property.
            </p>
            <div className="border rounded-lg p-4 bg-background max-w-xs">
              <TableOfContents items={nestedTocItems} />
            </div>
          </div>
        </section>

        {/* Installation */}
        <section id="installation" className="space-y-4">
          <h2 className="text-2xl font-semibold">installation</h2>
          <CodeBlock language="bash">
            npx shadcn@latest add https://ui.inference.sh/r/table-of-contents.json
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
                  <th className="px-4 py-2 text-left font-medium">default</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">items</td>
                  <td className="px-4 py-2 font-mono text-xs">TocItem[]</td>
                  <td className="px-4 py-2 font-mono text-xs">-</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">className</td>
                  <td className="px-4 py-2 font-mono text-xs">string</td>
                  <td className="px-4 py-2 font-mono text-xs">-</td>
                </tr>
              </tbody>
            </table>
          </div>
          <h3 className="text-lg font-medium mt-6">TocItem</h3>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left font-medium">property</th>
                  <th className="px-4 py-2 text-left font-medium">type</th>
                  <th className="px-4 py-2 text-left font-medium">description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">id</td>
                  <td className="px-4 py-2 font-mono text-xs">string</td>
                  <td className="px-4 py-2 text-xs">element id to scroll to</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">title</td>
                  <td className="px-4 py-2 font-mono text-xs">string</td>
                  <td className="px-4 py-2 text-xs">display text</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">level</td>
                  <td className="px-4 py-2 font-mono text-xs">number</td>
                  <td className="px-4 py-2 text-xs">nesting level (1 = top, 2 = nested)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
