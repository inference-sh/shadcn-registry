'use client'

/**
 * VirtualizedChatMessages
 *
 * Virtualized message list with auto-scroll behavior.
 * Combines useVirtualizedList (spacers, RO height tracking, scroll correction)
 * with auto-scroll (stick to bottom on new messages, detach on scroll-up).
 */

import React, { memo, useState, useCallback, useRef, useLayoutEffect, useEffect, useMemo, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ChatWidthContext } from '@/hooks/use-chat-width'
import { Button } from '@/components/ui/button'
import { ArrowDown } from 'lucide-react'
import { useAgentChat } from '@inferencesh/sdk/agent'
import type { ChatMessageDTO } from '@inferencesh/sdk'
import {
  ChatMessageContentTypeText,
  ChatMessageContentTypeReasoning,
} from '@inferencesh/sdk'
import { useVirtualizedList, type VirtualItem } from '@/lib/virtualize'
import { messageStrategy } from '../lib/message-strategy'

/** Skip tool-role messages and empty messages (no text, no reasoning, no tools). */
function isRenderable(msg: ChatMessageDTO): boolean {
  if (msg.role === 'tool') return false
  const hasText = msg.content?.some(c => c.type === ChatMessageContentTypeText && c.text?.trim())
  const hasReasoning = msg.content?.some(c => c.type === ChatMessageContentTypeReasoning && c.text?.trim())
  const hasTools = msg.tool_invocations && msg.tool_invocations.length > 0
  return !!(hasText || hasReasoning || hasTools)
}

const ACTIVATION_THRESHOLD = 50
const MIN_SCROLL_UP_THRESHOLD = 10
const LIST_GAP = 8 // gap-2 between messages
const LIST_PADDING_X = 16 // px-4

interface VirtualizedChatMessagesProps {
  renderMessage: (message: ChatMessageDTO) => ReactNode
  className?: string
  scrollToTopPadding?: boolean
  /** Shown after messages when generating with no content yet */
  typingIndicator?: ReactNode
}

export const VirtualizedChatMessages = memo(function VirtualizedChatMessages({
  renderMessage,
  className,
  scrollToTopPadding = false,
  typingIndicator,
}: VirtualizedChatMessagesProps) {
  const { messages } = useAgentChat()

  // --- Container dimensions ---
  const [chatWidth, setChatWidth] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)
  const containerElRef = useRef<HTMLDivElement | null>(null)

  // --- Auto-scroll state ---
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const shouldAutoScrollRef = useRef(true)
  shouldAutoScrollRef.current = shouldAutoScroll
  const previousScrollTop = useRef<number | null>(null)

  // --- Convert renderable messages to virtual items ---
  const virtualItems: VirtualItem<ChatMessageDTO>[] = useMemo(() => {
    if (chatWidth <= 0) return []
    return messages.filter(isRenderable).map(msg => ({
      id: msg.id,
      strategy: messageStrategy(msg),
      data: msg,
    }))
  }, [messages, chatWidth])

  const list = useVirtualizedList(virtualItems, viewportHeight, chatWidth - LIST_PADDING_X * 2, LIST_GAP)

  // --- Merge scroll ref with our container ref ---
  // useVirtualizedList returns scrollRef (ref callback) that attaches scroll listener + RO.
  // We also need the element for auto-scroll + dimension measurement.
  const mergedRef = useCallback((el: HTMLDivElement | null) => {
    containerElRef.current = el
    list.scrollRef(el)
  }, [list.scrollRef])

  // --- Measure container ---
  useLayoutEffect(() => {
    const el = containerElRef.current
    if (!el) return
    const update = () => {
      if (!containerElRef.current) return
      setChatWidth(containerElRef.current.clientWidth)
      setViewportHeight(containerElRef.current.clientHeight)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // --- Auto-scroll: scroll handler ---
  // Only disable auto-scroll on deliberate user scroll-up.
  // Re-enable when user scrolls back to bottom.
  // Never disable from programmatic scrolls or spacer updates
  // (those look like "not at bottom" momentarily but aren't user-initiated).
  const handleScroll = useCallback(() => {
    const el = containerElRef.current
    if (!el) return

    const { scrollTop, scrollHeight, clientHeight } = el

    // Ignore Safari rubber-band
    if (scrollTop < 0 || scrollTop + clientHeight > scrollHeight + 1) return

    const distanceFromBottom = Math.abs(scrollHeight - scrollTop - clientHeight)
    const isAtBottom = distanceFromBottom < ACTIVATION_THRESHOLD

    const isScrollingUp = previousScrollTop.current !== null
      ? scrollTop < previousScrollTop.current
      : false
    const scrollUpDistance = previousScrollTop.current !== null
      ? previousScrollTop.current - scrollTop
      : 0
    const isDeliberateScrollUp = isScrollingUp && scrollUpDistance > MIN_SCROLL_UP_THRESHOLD

    if (isDeliberateScrollUp && !isAtBottom) {
      // User deliberately scrolled up — detach
      setShouldAutoScroll(false)
    } else if (isAtBottom) {
      // User scrolled back to bottom — re-attach
      setShouldAutoScroll(true)
    }
    // Otherwise: spacer update, programmatic scroll, etc. — don't change state.

    previousScrollTop.current = scrollTop
  }, [])

  const handleTouchStart = useCallback(() => {
    setShouldAutoScroll(false)
  }, [])

  const scrollToBottom = useCallback(() => {
    if (containerElRef.current) {
      containerElRef.current.scrollTop = containerElRef.current.scrollHeight
    }
  }, [])

  // --- Auto-scroll on new messages ---
  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      scrollToBottom()
    }
  }, [messages, scrollToBottom])

  // --- Auto-scroll on content height growth ---
  useEffect(() => {
    const el = containerElRef.current
    if (!el) return
    let prevHeight = el.scrollHeight
    const ro = new ResizeObserver(() => {
      const h = el.scrollHeight
      if (shouldAutoScrollRef.current && h > prevHeight) {
        scrollToBottom()
      }
      prevHeight = h
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [scrollToBottom])

  // --- Spacer for scroll-to-top ---
  const spacerHeight = scrollToTopPadding ? viewportHeight * 0.9 : 0

  return (
    <ChatWidthContext.Provider value={chatWidth}>
      <div className={cn('flex flex-col min-h-0 min-w-0 relative', className)}>
        <div
          ref={mergedRef}
          className="flex-1 overflow-y-auto min-w-0"
          onScroll={handleScroll}
          onTouchStart={handleTouchStart}
        >
          {/* Top spacer (virtualizer) */}
          <div style={{ height: list.topSpacer }} />

          {/* Visible messages */}
          <div className="flex flex-col gap-2 px-4 py-3">
            {list.items.map(item => (
              <div key={item.id} ref={list.getItemRef(item.id)}>
                {renderMessage(item.data)}
              </div>
            ))}
          </div>

          {/* Bottom spacer (virtualizer) */}
          <div style={{ height: list.bottomSpacer }} />

          {/* Typing indicator — shown outside virtualizer, after all messages */}
          {typingIndicator && (
            <div className="px-4 py-2">{typingIndicator}</div>
          )}

          {/* Scroll-to-top padding */}
          {scrollToTopPadding && messages.length > 0 && (
            <div aria-hidden="true" className="shrink-0" style={{ minHeight: spacerHeight }} />
          )}
        </div>

        {/* Scroll to bottom button */}
        {!shouldAutoScroll && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <Button
              onClick={() => {
                scrollToBottom()
                setShouldAutoScroll(true)
              }}
              size="sm"
              variant="default"
              className="bg-background hover:bg-muted text-foreground hover:text-foreground rounded-full shadow-md animate-in fade-in-0 slide-in-from-bottom-2 cursor-pointer"
            >
              <ArrowDown className="h-4 w-4" />
              <span className="text-xs font-normal text-muted-foreground">scroll to bottom</span>
            </Button>
          </div>
        )}
      </div>
    </ChatWidthContext.Provider>
  )
})

VirtualizedChatMessages.displayName = 'VirtualizedChatMessages'
