/**
 * Message measurement strategy for virtualization.
 *
 * Pure coordinator — calls each component's measure function and sums.
 * Components own their dimensions, this just composes them.
 */

import {
  ChatMessageRoleUser,
  ChatMessageRoleAssistant,
  ChatMessageContentTypeReasoning,
  ChatMessageContentTypeText,
  type ChatMessageDTO,
} from '@inferencesh/sdk'
import { parse } from '@/lib/pretext-md/core/parser'
import { measureBlocks } from '@/lib/pretext-md/core/block-layout'
import { defaultConfig } from '@/lib/pretext-md/react/context'
import { defaultPlugins } from '@/lib/pretext-md/react/plugins'
import { measureBubbleChrome } from '@/components/infsh/agent/message-bubble'
import { measureReasoning } from '@/components/infsh/agent/message-reasoning'
import { measureToolInvocations } from '@/components/infsh/agent/tool-invocations'
import type { MeasureStrategy } from '@/lib/virtualize'

const plugins = defaultPlugins()

export function messageStrategy(message: ChatMessageDTO): MeasureStrategy {
  // Pre-parse once — AST doesn't change with width.
  // Only measureBlocks() depends on width. This avoids re-parsing on resize.
  const text = message.content?.find(
    c => c.type === ChatMessageContentTypeText
  )?.text
  const blocks = text?.trim() ? parse(text) : null

  // Pre-extract static values
  const reasoning = message.role === ChatMessageRoleAssistant
    ? message.content?.find(c => c.type === ChatMessageContentTypeReasoning)?.text
    : undefined
  const toolInvocations = message.role === ChatMessageRoleAssistant
    ? message.tool_invocations
    : undefined

  return {
    kind: 'computed',
    measure: (width) => {
      const bubble = measureBubbleChrome(message.role, width)
      let height = bubble.paddingY

      height += measureReasoning(reasoning, false)

      if (blocks) {
        const result = measureBlocks(blocks, {
          maxWidth: bubble.innerWidth,
          fonts: defaultConfig.fonts,
          lineHeights: defaultConfig.lineHeights,
          plugins,
        })
        height += result.height
      }

      height += measureToolInvocations(toolInvocations)

      return height
    },
  }
}
