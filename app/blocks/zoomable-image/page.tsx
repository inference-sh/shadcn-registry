'use client'

import { PageLayout } from '@/components/page-layout'
import { CodeBlock } from '@/registry/blocks/code-block/code-block'
import ZoomableImage from '@/registry/blocks/zoomable-image/zoomable-image'
import type { TocItem } from '@/registry/blocks/table-of-contents/table-of-contents'

const tocItems: TocItem[] = [
  { id: 'examples', title: 'examples' },
  { id: 'installation', title: 'installation' },
  { id: 'usage', title: 'usage' },
  { id: 'props', title: 'props' },
]

const usageCode = `import ZoomableImage from '@/components/zoomable-image'

export function MyImage() {
  return (
    <ZoomableImage
      src="/images/photo.jpg"
      alt="A beautiful landscape"
      className="rounded-lg"
    />
  )
}`

export default function ZoomableImagePage() {
  return (
    <PageLayout toc={tocItems}>
      <div className="max-w-4xl space-y-12">
        {/* Header */}
        <header className="space-y-4">
          <h1 className="text-3xl font-bold">zoomable image</h1>
          <p className="text-muted-foreground">
            click-to-zoom image component with medium.com-style lightbox.
            powered by{' '}
            <a
              href="https://github.com/rpearce/react-medium-image-zoom"
              className="underline underline-offset-4 hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              react-medium-image-zoom
            </a>
            .
          </p>
        </header>

        {/* Examples */}
        <section id="examples" className="space-y-4">
          <h2 className="text-2xl font-semibold">examples</h2>
          <p className="text-sm text-muted-foreground">
            click the image to zoom in, click again or scroll to close.
          </p>
          <div className="max-w-md">
            <ZoomableImage
              src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800"
              alt="Mountain landscape"
              className="rounded-lg"
            />
          </div>
        </section>

        {/* Installation */}
        <section id="installation" className="space-y-4">
          <h2 className="text-2xl font-semibold">installation</h2>
          <CodeBlock language="bash">
            npx shadcn@latest add https://ui.inference.sh/r/zoomable-image.json
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
                  <td className="px-4 py-2 font-mono text-xs">src</td>
                  <td className="px-4 py-2 font-mono text-xs">string</td>
                  <td className="px-4 py-2 font-mono text-xs">-</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">alt</td>
                  <td className="px-4 py-2 font-mono text-xs">string</td>
                  <td className="px-4 py-2 font-mono text-xs"><code>&quot;&quot;</code></td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">disabled</td>
                  <td className="px-4 py-2 font-mono text-xs">boolean</td>
                  <td className="px-4 py-2 font-mono text-xs">false</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">zoomSrc</td>
                  <td className="px-4 py-2 font-mono text-xs">string</td>
                  <td className="px-4 py-2 font-mono text-xs">-</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">zoomMargin</td>
                  <td className="px-4 py-2 font-mono text-xs">number</td>
                  <td className="px-4 py-2 font-mono text-xs">16</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
