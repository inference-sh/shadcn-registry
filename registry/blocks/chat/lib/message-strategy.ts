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
  return {
    kind: 'computed',
    measure: (width) => {
      const bubble = measureBubbleChrome(message.role, width)
      let height = bubble.paddingY

      // Reasoning (collapsed by default)
      if (message.role === ChatMessageRoleAssistant) {
        const reasoning = message.content?.find(
          c => c.type === ChatMessageContentTypeReasoning
        )?.text
        height += measureReasoning(reasoning, false)
      }

      // Markdown body (pretext measures both user plain text and assistant markdown)
      const text = message.content?.find(
        c => c.type === ChatMessageContentTypeText
      )?.text
      if (text?.trim()) {
        const blocks = parse(text)
        const result = measureBlocks(blocks, {
          maxWidth: bubble.innerWidth,
          fonts: defaultConfig.fonts,
          lineHeights: defaultConfig.lineHeights,
          plugins,
        })
        height += result.height
      }

      // Tool invocations
      if (message.role === ChatMessageRoleAssistant) {
        height += measureToolInvocations(message.tool_invocations)
      }

      return height
    },
  }
}
