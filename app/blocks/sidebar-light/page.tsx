'use client'

import { PageLayout } from '@/components/page-layout'
import { CodeBlock } from '@/registry/blocks/code-block/code-block'
import { SidebarLight, type NavItem } from '@/registry/blocks/sidebar-light/sidebar-light'
import type { TocItem } from '@/registry/blocks/table-of-contents/table-of-contents'
import { Home, Settings, Users, FileText, Folder } from 'lucide-react'

const tocItems: TocItem[] = [
  { id: 'examples', title: 'examples' },
  { id: 'flat', title: 'flat navigation', level: 2 },
  { id: 'nested', title: 'nested navigation', level: 2 },
  { id: 'installation', title: 'installation' },
  { id: 'usage', title: 'usage' },
  { id: 'props', title: 'props' },
]

const usageCode = `import { SidebarLight, type NavItem } from '@/components/sidebar-light'
import { Home, Settings, Users } from 'lucide-react'

const navItems: NavItem[] = [
  { title: 'Home', href: '/', icon: Home },
  { title: 'Settings', href: '/settings', icon: Settings },
  {
    title: 'Users',
    href: '#',
    icon: Users,
    items: [
      { title: 'All Users', href: '/users' },
      { title: 'Add User', href: '/users/new' },
    ],
  },
]

export function MySidebar() {
  return <SidebarLight items={navItems} />
}`

const flatNavItems: NavItem[] = [
  { title: 'home', href: '/', icon: Home },
  { title: 'settings', href: '/settings', icon: Settings },
  { title: 'users', href: '/users', icon: Users },
]

const nestedNavItems: NavItem[] = [
  { title: 'home', href: '/', icon: Home },
  {
    title: 'documents',
    href: '#',
    icon: Folder,
    items: [
      { title: 'reports', href: '/docs/reports', icon: FileText },
      { title: 'invoices', href: '/docs/invoices', icon: FileText },
      { title: 'contracts', href: '/docs/contracts', icon: FileText },
    ],
  },
  {
    title: 'settings',
    href: '#',
    icon: Settings,
    items: [
      { title: 'profile', href: '/settings/profile' },
      { title: 'account', href: '/settings/account' },
      { title: 'notifications', href: '/settings/notifications' },
    ],
  },
]

export default function SidebarLightPage() {
  return (
    <PageLayout toc={tocItems}>
      <div className="max-w-4xl space-y-12">
        {/* Header */}
        <header className="space-y-4">
          <h1 className="text-3xl font-bold">sidebar light</h1>
          <p className="text-muted-foreground">
            lightweight sidebar navigation with nested items and active state highlighting.
          </p>
        </header>

        {/* Examples */}
        <section id="examples" className="space-y-8">
          <h2 className="text-2xl font-semibold">examples</h2>

          <div id="flat" className="space-y-4">
            <h3 className="text-lg font-medium">flat navigation</h3>
            <p className="text-sm text-muted-foreground">
              simple flat navigation with icons.
            </p>
            <div className="border rounded-lg p-4 bg-background max-w-xs">
              <SidebarLight items={flatNavItems} />
            </div>
          </div>

          <div id="nested" className="space-y-4">
            <h3 className="text-lg font-medium">nested navigation</h3>
            <p className="text-sm text-muted-foreground">
              navigation with collapsible sections and nested items.
            </p>
            <div className="border rounded-lg p-4 bg-background max-w-xs">
              <SidebarLight items={nestedNavItems} />
            </div>
          </div>
        </section>

        {/* Installation */}
        <section id="installation" className="space-y-4">
          <h2 className="text-2xl font-semibold">installation</h2>
          <CodeBlock language="bash">
            npx shadcn@latest add https://ui.inference.sh/r/sidebar-light.json
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
                  <td className="px-4 py-2 font-mono text-xs">NavItem[]</td>
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
          <h3 className="text-lg font-medium mt-6">NavItem</h3>
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
                  <td className="px-4 py-2 font-mono text-xs">title</td>
                  <td className="px-4 py-2 font-mono text-xs">string</td>
                  <td className="px-4 py-2 text-xs">display text for the nav item</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">href</td>
                  <td className="px-4 py-2 font-mono text-xs">string</td>
                  <td className="px-4 py-2 text-xs">link destination</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">icon</td>
                  <td className="px-4 py-2 font-mono text-xs">ComponentType</td>
                  <td className="px-4 py-2 text-xs">optional icon component</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">items</td>
                  <td className="px-4 py-2 font-mono text-xs">NavItem[]</td>
                  <td className="px-4 py-2 text-xs">nested navigation items</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
