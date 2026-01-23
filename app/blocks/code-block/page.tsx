'use client'

import { PageLayout } from '@/components/page-layout'
import { CodeBlock, CompactCodeBlock } from '@/registry/blocks/code-block/code-block'
import type { TocItem } from '@/registry/blocks/table-of-contents/table-of-contents'

const tocItems: TocItem[] = [
  { id: 'examples', title: 'examples' },
  { id: 'full', title: 'full code block', level: 2 },
  { id: 'compact', title: 'compact code block', level: 2 },
  { id: 'installation', title: 'installation' },
  { id: 'usage', title: 'usage' },
  { id: 'props', title: 'props' },
]

const usageCode = `import { CodeBlock, CompactCodeBlock } from '@/components/code-block'

export function MyComponent() {
  const code = \`function hello() {
  console.log('Hello, world!')
}\`

  return (
    <div>
      <CodeBlock language="typescript">{code}</CodeBlock>
      <CompactCodeBlock language="typescript">{code}</CompactCodeBlock>
    </div>
  )
}`

const jsExample = `import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  )
}`

const pythonExample = `def fibonacci(n):
    """Generate fibonacci sequence up to n."""
    a, b = 0, 1
    while a < n:
        yield a
        a, b = b, a + b

# Print first 10 fibonacci numbers
for num in fibonacci(100):
    print(num)`

const bashExample = `#!/bin/bash
# Install dependencies
npm install

# Run development server
npm run dev`

export default function CodeBlockPage() {
  return (
    <PageLayout toc={tocItems}>
      <div className="max-w-4xl space-y-12">
        {/* Header */}
        <header className="space-y-4">
          <h1 className="text-3xl font-bold">code block</h1>
          <p className="text-muted-foreground">
            syntax-highlighted code block with line numbers and copy button.
          </p>
        </header>

        {/* Examples */}
        <section id="examples" className="space-y-8">
          <h2 className="text-2xl font-semibold">examples</h2>

          <div id="full" className="space-y-4">
            <h3 className="text-lg font-medium">full code block</h3>
            <p className="text-sm text-muted-foreground">
              the default code block with header, line numbers, and copy button.
            </p>
            <CodeBlock language="typescript">
              {jsExample}
            </CodeBlock>
            <CodeBlock language="python">
              {pythonExample}
            </CodeBlock>
            <CodeBlock language="bash">
              {bashExample}
            </CodeBlock>
          </div>

          <div id="compact" className="space-y-4">
            <h3 className="text-lg font-medium">compact code block</h3>
            <p className="text-sm text-muted-foreground">
              a simpler code block for dense ui contexts like chat messages.
            </p>
            <CompactCodeBlock language="typescript">
              {jsExample}
            </CompactCodeBlock>
          </div>
        </section>

        {/* Installation */}
        <section id="installation" className="space-y-4">
          <h2 className="text-2xl font-semibold">installation</h2>
          <CodeBlock language="bash">
            npx shadcn@latest add https://ui.inference.sh/r/code-block.json
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
                  <td className="px-4 py-2 font-mono text-xs">language</td>
                  <td className="px-4 py-2 font-mono text-xs">string</td>
                  <td className="px-4 py-2 font-mono text-xs"><code>&quot;code&quot;</code></td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">showLineNumbers</td>
                  <td className="px-4 py-2 font-mono text-xs">boolean</td>
                  <td className="px-4 py-2 font-mono text-xs">true</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">showCopyButton</td>
                  <td className="px-4 py-2 font-mono text-xs">boolean</td>
                  <td className="px-4 py-2 font-mono text-xs">true</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">showHeader</td>
                  <td className="px-4 py-2 font-mono text-xs">boolean</td>
                  <td className="px-4 py-2 font-mono text-xs">true</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">enableHighlighting</td>
                  <td className="px-4 py-2 font-mono text-xs">boolean</td>
                  <td className="px-4 py-2 font-mono text-xs">true</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
