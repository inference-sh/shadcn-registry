/**
 * ChatContainer Primitive
 * 
 * A layout wrapper for the chat UI using CSS Grid.
 * Provides structure: [header] [messages] [input]
 */

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import type { ChatContainerProps } from '@/components/agent/types';

/**
 * ChatContainer - Grid layout wrapper for chat components
 * 
 * @example
 * ```tsx
 * <ChatContainer className="h-screen">
 *   <Header />
 *   <ChatMessages>...</ChatMessages>
 *   <ChatInput />
 * </ChatContainer>
 * ```
 */
export const ChatContainer = forwardRef<HTMLDivElement, ChatContainerProps>(
  ({ children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'grid max-h-full w-full grid-rows-[auto_1fr_auto]',
          className
        )}
      >
        {children}
      </div>
    );
  }
);

ChatContainer.displayName = 'ChatContainer';

