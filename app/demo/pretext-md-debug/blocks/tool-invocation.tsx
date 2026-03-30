'use client'

import React, { useState, useRef, useLayoutEffect } from 'react'

// Initial predicted height (collapsed state)
export const COLLAPSED_HEIGHT = 33

export function ToolInvocationBlock({ invocation, onHeightChange }: {
  invocation: { toolName: string; state: string; result?: any }
  onHeightChange?: (height: number) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isDone = invocation.state === 'result'

  useLayoutEffect(() => {
    if (ref.current) onHeightChange?.(ref.current.offsetHeight)
  }, [open])

  return (
    <div ref={ref} className="border border-border/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-muted/50"
      >
        {isDone ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin text-primary">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        )}
        <span className="font-mono">{invocation.toolName}</span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`ml-auto transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && invocation.result && (
        <div className="border-t border-border/50">
          <pre className="px-3 py-2 text-xs text-muted-foreground max-h-[150px] overflow-y-auto">
            {JSON.stringify(invocation.result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
