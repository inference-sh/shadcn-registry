/**
 * MessageBubble Primitive
 * 
 * Styled container for a chat message.
 */

import React, { memo, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChatMessageRoleUser, type ChatMessageDTO } from '@inferencesh/sdk';

interface MessageBubbleProps {
  message: ChatMessageDTO;
  children?: ReactNode;
  className?: string;
}

/**
 * MessageBubble - Styled container for messages
 * 
 * @example
 * ```tsx
 * <MessageBubble message={message}>
 *   <MessageContent message={message} />
 *   <ToolInvocations message={message} />
 * </MessageBubble>
 * ```
 */
export const MessageBubble = memo(function MessageBubble({
  message,
  children,
  className,
}: MessageBubbleProps) {
  const isUser = message.role === ChatMessageRoleUser;
  // Check if any tool invocation has a widget
  // const hasWidget = message.tool_invocations?.some(inv => inv.widget != null);
  return (
    <div
      className={cn(
        'group relative w-full',
        isUser ? 'flex justify-end' : 'flex justify-start',
        className
      )}
    >
      <div
        className={cn(
          'relative rounded-xl text-sm break-words whitespace-pre-wrap [&_*]:max-w-full [&_*]:min-w-0',
          isUser
            ? 'bg-muted/50 text-foreground max-w-[70%] min-w-0 p-3'
            : 'text-foreground max-w-full min-w-0 w-full',
          // Widgets should take full width
          // hasWidget && 'w-full'
        )}
      >
        {children}
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

