/**
 * Message - Default message composition
 * 
 * Combines MessageBubble, MessageContent, MessageReasoning, and ToolInvocations
 * into a sensible default. Use individual primitives for custom layouts.
 */

import React, { memo } from 'react';
import {
  ChatMessageRoleUser,
  ChatMessageRoleAssistant,
  ChatMessageContentTypeReasoning,
  ChatMessageContentTypeText,
} from '@inferencesh/sdk';
import { isTerminalChatMessageStatus } from '@/components/agent/types';
import { MessageBubble } from '@/components/agent/message-bubble';
import { MessageContent } from '@/components/agent/message-content';
import { MessageReasoning } from '@/components/agent/message-reasoning';
import { ToolInvocations } from '@/components/agent/tool-invocations';
import type { ChatMessageDTO } from '@/components/agent/types';

export interface MessageProps {
  message: ChatMessageDTO;
  /** Truncate user messages */
  truncateUser?: boolean;
}

/**
 * Default message rendering with all features:
 * - Reasoning block (collapsed, for assistant)
 * - Text content
 * - Tool invocations (for assistant)
 */
export const Message = memo(function Message({
  message,
  truncateUser = false,
}: MessageProps) {
  const isUser = message.role === ChatMessageRoleUser;
  const isAssistant = message.role === ChatMessageRoleAssistant;

  // Skip tool messages
  if (message.role === 'tool') return null;

  const reasoningContent = message.content?.find(
    c => c.type === ChatMessageContentTypeReasoning
  )?.text;

  const hasText = message.content?.some(
    c => c.type === ChatMessageContentTypeText && c.text?.trim()
  );

  const hasTools = message.tool_invocations && message.tool_invocations.length > 0;

  // Skip empty messages (no text, no reasoning, no tools)
  if (!hasText && !reasoningContent && !hasTools) return null;

  const isGenerating = !isTerminalChatMessageStatus(message.status);

  return (
    <MessageBubble message={message}>
      {isAssistant && reasoningContent && (
        <MessageReasoning
          reasoning={reasoningContent}
          isReasoning={isGenerating && !hasText}
        />
      )}
      <MessageContent message={message} truncate={isUser && truncateUser} />
      {isAssistant && <ToolInvocations message={message} />}
    </MessageBubble>
  );
});

