"use client"

import { useState } from "react"
import { SidebarLight, NavItem } from "@/registry/blocks/sidebar-light/sidebar-light"
import { TableOfContents, TocItem } from "@/registry/blocks/table-of-contents/table-of-contents"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MessageSquare, FileText, Puzzle, Wrench, Home, Layers, Code, Play, ImageIcon, ListOrdered, PanelLeft, List, Bot, Component, Menu, X, Activity } from "lucide-react"

interface PageLayoutProps {
  children: React.ReactNode
  toc?: TocItem[]
  className?: string
}


const navigation: NavItem[] = [
  {
    title: "home",
    href: "/",
    icon: Home,
  },
  {
    title: "blocks",
    href: "#",
    icon: Layers,
    items: [
      {
        title: "agent",
        href: "#",
        icon: Bot,
        items: [
          {
            title: "agent",
            href: "/blocks/agent",
            icon: Bot,
          },
          {
            title: "chat",
            href: "/blocks/chat",
            icon: MessageSquare,
          },
          {
            title: "tools",
            href: "/blocks/tools",
            icon: Wrench,
          },
          {
            title: "task",
            href: "/blocks/task",
            icon: Activity,
          },
          {
            title: "widgets",
            href: "/blocks/widgets",
            icon: Puzzle,
          },
        ],
      },
      {
        title: "components",
        href: "#",
        icon: Component,
        items: [
          {
            title: "markdown",
            href: "/blocks/markdown",
            icon: FileText,
          },
          {
            title: "code block",
            href: "/blocks/code-block",
            icon: Code,
          },
          {
            title: "steps",
            href: "/blocks/steps",
            icon: ListOrdered,
          },
          {
            title: "sidebar light",
            href: "/blocks/sidebar-light",
            icon: PanelLeft,
          },
          {
            title: "table of contents",
            href: "/blocks/table-of-contents",
            icon: List,
          },
          {
            title: "youtube embed",
            href: "/blocks/youtube-embed",
            icon: Play,
          },
          {
            title: "zoomable image",
            href: "/blocks/zoomable-image",
            icon: ImageIcon,
          },
        ],
      },
    ],
  },
]

export function PageLayout({ children, toc, className }: PageLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
      {/* Mobile Menu Toggle */}
      <div className="lg:hidden border-b">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 py-3"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          <span className="text-sm font-medium">menu</span>
        </Button>
        {mobileMenuOpen && (
          <div className="pb-4">
            <SidebarLight items={navigation} />
          </div>
        )}
      </div>

      <div className="flex gap-8">
        {/* Left Sidebar - Navigation */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-14 pt-6 pb-8">
            <SidebarLight items={navigation} />
          </div>
        </aside>

        {/* Main Content */}
        <main className={cn("flex-1 min-w-0 py-6", className)}>
          {children}
        </main>

        {/* Right Sidebar - Table of Contents */}
        {toc && toc.length > 0 && (
          <aside className="hidden xl:block w-56 shrink-0">
            <div className="sticky top-14 pt-6 pb-8">
              <TableOfContents items={toc} />
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
