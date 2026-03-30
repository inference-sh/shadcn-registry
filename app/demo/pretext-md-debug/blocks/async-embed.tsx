'use client'

import React, { useRef, useEffect } from 'react'

// Initial placeholder before content loads
export const PLACEHOLDER_HEIGHT = 200

/**
 * Wrapper for async content (images, videos, iframes).
 * Reports actual height once content loads.
 */
export function AsyncEmbed({ children, onHeightChange }: {
  children: React.ReactNode
  onHeightChange?: (height: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height ?? 0
      if (height > 0) onHeightChange?.(height)
    })
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [onHeightChange])

  return <div ref={ref}>{children}</div>
}
