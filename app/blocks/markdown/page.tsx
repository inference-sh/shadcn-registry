'use client'

import { PageLayout } from '@/components/page-layout'
import { MarkdownRenderer } from '@/registry/blocks/markdown/markdown-renderer'
import { CodeBlock } from '@/registry/blocks/code-block/code-block'
import { YouTubeEmbed } from '@/registry/blocks/youtube-embed/youtube-embed'
import ZoomableImage from '@/registry/blocks/zoomable-image/zoomable-image'
import type { TocItem } from '@/registry/blocks/table-of-contents/table-of-contents'

const tocItems: TocItem[] = [
  { id: 'examples', title: 'examples' },
  { id: 'headings', title: 'headings & text', level: 2 },
  { id: 'code', title: 'code blocks', level: 2 },
  { id: 'lists', title: 'lists', level: 2 },
  { id: 'tables', title: 'tables', level: 2 },
  { id: 'media', title: 'links & media', level: 2 },
  { id: 'standalone', title: 'standalone components' },
  { id: 'installation', title: 'installation' },
  { id: 'usage', title: 'usage' },
]

const usageCode = `import { MarkdownRenderer } from '@/components/markdown-renderer'

export function MyComponent() {
  const content = \`
# Hello World

This is **bold** and *italic* text.

\\\`\\\`\\\`typescript
const greeting = 'Hello!'
\\\`\\\`\\\`
\`

  return <MarkdownRenderer content={content} />
}`

const markdownExamples = [
  {
    id: 'headings',
    title: 'headings & text',
    content: `# Heading 1
## Heading 2
### Heading 3

Regular paragraph with **bold**, *italic*, and ~~strikethrough~~ text.

> This is a blockquote with some important information.`,
  },
  {
    id: 'code',
    title: 'code blocks',
    content: `Inline \`code\` looks like this.

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

async function getUser(id: string): Promise<User> {
  const response = await fetch(\`/api/users/\${id}\`);
  return response.json();
}
\`\`\``,
  },
  {
    id: 'lists',
    title: 'lists',
    content: `**Unordered List:**
- First item
- Second item
  - Nested item
  - Another nested item
- Third item

**Ordered List:**
1. Step one
2. Step two
3. Step three`,
  },
  {
    id: 'tables',
    title: 'tables',
    content: `| Feature | Status | Notes |
|---------|--------|-------|
| Markdown | ✅ | Full GFM support |
| Code blocks | ✅ | Syntax highlighting |
| Tables | ✅ | With styling |
| Images | ✅ | Zoomable |`,
  },
  {
    id: 'media',
    title: 'links & media',
    content: `Check out [inference.sh](https://inference.sh) for more.

YouTube videos auto-embed: https://www.youtube.com/watch?v=2HOkLrLU5Vs

Images are zoomable:
![Example](https://picsum.photos/400/200)`,
  },
]

export default function MarkdownDemoPage() {
  return (
    <PageLayout toc={tocItems}>
      <div className="max-w-4xl space-y-12">
        {/* Header */}
        <header className="space-y-4">
          <h1 className="text-3xl font-bold">markdown renderer</h1>
          <p className="text-lg text-muted-foreground">
            high-fidelity markdown with code blocks, youtube embeds, and zoomable images.
          </p>
        </header>

        {/* Examples */}
        <section id="examples" className="space-y-6">
          <h2 className="text-2xl font-semibold">examples</h2>

          <div className="space-y-4">
            {markdownExamples.map((example) => (
              <div key={example.id} id={example.id} className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 border-b">
                  <h3 className="text-sm font-medium">{example.title}</h3>
                </div>
                <div className="p-4">
                  <MarkdownRenderer content={example.content} />
                </div>
              </div>
            ))}
          </div>

          {/* Compact Mode */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 border-b">
              <h3 className="text-sm font-medium">compact mode</h3>
              <p className="text-xs text-muted-foreground">smaller text for chat interfaces</p>
            </div>
            <div className="p-4">
              <MarkdownRenderer
                content="Compact mode uses smaller text sizes, perfect for **chat interfaces** with `inline code` support."
                compact
              />
            </div>
          </div>
        </section>

        {/* Standalone Components */}
        <section id="standalone" className="space-y-6">
          <h2 className="text-2xl font-semibold">standalone components</h2>
          <p className="text-muted-foreground">
            these components can be installed separately for use outside of the markdown renderer.
          </p>

          <div className="space-y-4">
            {/* Code Block */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 border-b">
                <h3 className="text-sm font-medium">code block</h3>
                <p className="text-xs text-muted-foreground">syntax-highlighted code with copy button</p>
              </div>
              <div className="px-4 py-2 border-b bg-muted/30">
                <code className="text-xs">
                  npx shadcn@latest add https://ui.inference.sh/r/code-block.json
                </code>
              </div>
              <div className="p-4">
                <CodeBlock language="python">
                  {`def fibonacci(n):
    """Calculate the nth Fibonacci number."""
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Example usage
for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")`}
                </CodeBlock>
              </div>
            </div>

            {/* YouTube Embed */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 border-b">
                <h3 className="text-sm font-medium">youtube embed</h3>
                <p className="text-xs text-muted-foreground">responsive video embed</p>
              </div>
              <div className="px-4 py-2 border-b bg-muted/30">
                <code className="text-xs">
                  npx shadcn@latest add https://ui.inference.sh/r/youtube-embed.json
                </code>
              </div>
              <div className="p-4">
                <YouTubeEmbed videoId="2HOkLrLU5Vs" title="Example video" />
              </div>
            </div>

            {/* Zoomable Image */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 border-b">
                <h3 className="text-sm font-medium">zoomable image</h3>
                <p className="text-xs text-muted-foreground">click to zoom with lightbox</p>
              </div>
              <div className="px-4 py-2 border-b bg-muted/30">
                <code className="text-xs">
                  npx shadcn@latest add https://ui.inference.sh/r/zoomable-image.json
                </code>
              </div>
              <div className="p-4">
                <div className="max-w-md">
                  <ZoomableImage
                    src="https://picsum.photos/600/400"
                    alt="Sample landscape image - click to zoom"
                    className="rounded-lg cursor-zoom-in"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">click the image to zoom</p>
              </div>
            </div>
          </div>
        </section>

        {/* Installation */}
        <section id="installation" className="space-y-4">
          <h2 className="text-2xl font-semibold">installation</h2>
          <CodeBlock language="bash">
            npx shadcn@latest add https://ui.inference.sh/r/markdown.json
          </CodeBlock>
        </section>

        {/* Usage */}
        <section id="usage" className="space-y-4">
          <h2 className="text-2xl font-semibold">usage</h2>
          <CodeBlock language="tsx">{usageCode}</CodeBlock>
        </section>
      </div>
    </PageLayout>
  )
}
