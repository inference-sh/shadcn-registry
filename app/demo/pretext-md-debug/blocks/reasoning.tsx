'use client'

import React, { useState, useRef, useLayoutEffect } from 'react'

// Initial predicted height (collapsed state)
export const COLLAPSED_HEIGHT = 33

export function ReasoningBlock({ reasoning, onHeightChange }: {
  reasoning: string
  onHeightChange?: (height: number) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (ref.current) onHeightChange?.(ref.current.offsetHeight)
  }, [open])

  return (
    <div ref={ref} className="border border-border/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-muted/50"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        <span>thought process</span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`ml-auto transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="px-3 py-2 text-xs text-muted-foreground max-h-[200px] overflow-y-auto border-t border-border/50">
          {reasoning}
        </div>
      )}
    </div>
  )
}
