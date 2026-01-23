"use client"

import { useEffect, useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { TableOfContentsIcon } from "lucide-react"

export interface TocItem {
  id: string
  title: string
  level?: number
}

interface TableOfContentsProps {
  items: TocItem[]
  className?: string
}

function useActiveSection(itemIds: string[]) {
  const [activeId, setActiveId] = useState<string>("")

  useEffect(() => {
    if (itemIds.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: "-80px 0px -80% 0px",
        threshold: 0,
      }
    )

    itemIds.forEach((id) => {
      const element = document.getElementById(id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [itemIds])

  return activeId
}

function TableOfContents({ items, className }: TableOfContentsProps) {
  const itemIds = items.map((item) => item.id)
  const activeId = useActiveSection(itemIds)

  const scrollToSection = useCallback((id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }, [])

  if (items.length === 0) {
    return null
  }

  return (
    <nav className={cn("relative", className)}>
      <div className="flex items-center gap-2 mb-3">
        <TableOfContentsIcon className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs font-semibold text-muted-foreground tracking-wide">
          on this page
        </p>
      </div>

      <ul className="space-y-1 border-l border-border">
        {items.map(({ id, title, level = 1 }) => {
          const isActive = activeId === id
          const isChild = level > 1

          return (
            <li key={id}>
              <button
                onClick={() => scrollToSection(id)}
                className={cn(
                  "flex items-center w-full text-left text-[13px] py-1 -ml-px border-l transition-colors",
                  level === 1 && "pl-3 font-medium",
                  level === 2 && "pl-5 text-xs",
                  isActive
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                )}
              >
                {isChild && (
                  <span
                    className={cn(
                      "mr-1.5 text-[10px] font-mono",
                      isActive ? "text-foreground" : "text-muted-foreground/50"
                    )}
                  >
                    └
                  </span>
                )}
                {title}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export { TableOfContents, useActiveSection }
export type { TableOfContentsProps }
