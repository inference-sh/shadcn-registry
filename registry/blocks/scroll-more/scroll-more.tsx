'use client'

import { useRef, useState, useEffect, useCallback, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

interface ScrollMoreProps {
  children: ReactNode
  className?: string
  /** 'fade' for gradient edges, 'badge' for a clickable pill, 'both' for both (default: 'both') */
  indicator?: 'fade' | 'badge' | 'both'
  /** fade height in pixels (default: 32) */
  fadeHeight?: number
  /** badge label (default: 'scroll for more') */
  badgeLabel?: string
}

/**
 * wraps scrollable content with scroll indicators —
 * gradient fades, a clickable badge, or both.
 */
export function ScrollMore({
  children,
  className,
  indicator = 'both',
  fadeHeight = 32,
  badgeLabel = 'scroll for more',
}: ScrollMoreProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const check = () => {
      setCanScrollUp(el.scrollTop > 2)
      setCanScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 2)
    }

    check()
    el.addEventListener('scroll', check, { passive: true })

    const ro = new ResizeObserver(check)
    ro.observe(el)

    return () => {
      el.removeEventListener('scroll', check)
      ro.disconnect()
    }
  }, [])

  const scrollDown = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.scrollBy({ top: el.clientHeight * 0.75, behavior: 'smooth' })
  }, [])

  const showFade = indicator === 'fade' || indicator === 'both'
  const showBadge = indicator === 'badge' || indicator === 'both'

  return (
    <div className={cn('relative min-h-0', className)}>
      {showFade && (
        <div
          className={cn(
            'absolute inset-x-0 top-0 z-10 pointer-events-none transition-opacity duration-200',
            'bg-gradient-to-b from-background to-transparent',
            canScrollUp ? 'opacity-100' : 'opacity-0',
          )}
          style={{ height: fadeHeight }}
        />
      )}

      <div ref={ref} className="h-full overflow-y-auto">
        {children}
      </div>

      {showFade && (
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 z-10 pointer-events-none transition-opacity duration-200',
            'bg-gradient-to-t from-background to-transparent',
            canScrollDown ? 'opacity-100' : 'opacity-0',
          )}
          style={{ height: fadeHeight }}
        />
      )}

      {showBadge && canScrollDown && (
        <button
          type="button"
          onClick={scrollDown}
          className={cn(
            'absolute bottom-2 left-1/2 -translate-x-1/2 z-20',
            'flex items-center gap-1 px-2.5 py-1 rounded-full',
            'bg-background border shadow-sm',
            'text-xs text-muted-foreground hover:text-foreground',
            'transition-all duration-200 animate-in fade-in-0 slide-in-from-bottom-1',
            'cursor-pointer',
          )}
        >
          <ChevronDown className="h-3 w-3" />
          <span>{badgeLabel}</span>
        </button>
      )}
    </div>
  )
}
