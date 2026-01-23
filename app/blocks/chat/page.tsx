'use client'

import { PageLayout } from '@/components/page-layout'
import { CodeBlock } from '@/registry/blocks/code-block/code-block'
import { ChatContainer } from '@/registry/blocks/chat/components/chat-container'
import { MessageStatusIndicator } from '@/registry/blocks/chat/components/message-status-indicator'
import type { TocItem } from '@/registry/blocks/table-of-contents/table-of-contents'
import { cn } from '@/lib/utils'
import { ArrowUp, Paperclip, ImagePlus } from 'lucide-react'

const tocItems: TocItem[] = [
  { id: 'examples', title: 'examples' },
  { id: 'chat-container', title: 'chat container', level: 2 },
  { id: 'message-bubble', title: 'message bubble', level: 2 },
  { id: 'chat-input', title: 'chat input', level: 2 },
  { id: 'typing-indicator', title: 'typing indicator', level: 2 },
  { id: 'installation', title: 'installation' },
  { id: 'usage', title: 'usage' },
]

const installCode = `npx shadcn@latest add https://ui.inference.sh/r/chat`

const usageCode = `import { ChatContainer } from '@/components/chat/chat-container'
import { ChatInput } from '@/components/chat/chat-input'
import { ChatMessages } from '@/components/chat/chat-messages'
import { MessageBubble } from '@/components/chat/message-bubble'
import { MessageContent } from '@/components/chat/message-content'

export function Chat() {
  return (
    <ChatContainer>
      <ChatMessages>
        <MessageBubble message={userMessage}>
          <MessageContent message={userMessage} />
        </MessageBubble>
        <MessageBubble message={assistantMessage}>
          <MessageContent message={assistantMessage} />
        </MessageBubble>
      </ChatMessages>
      <ChatInput />
    </ChatContainer>
  )
}`

// Static preview components for demo purposes
function MessageBubblePreview({
  role,
  children
}: {
  role: 'user' | 'assistant'
  children: React.ReactNode
}) {
  const isUser = role === 'user'
  return (
    <div className={cn(
      'group relative w-full',
      isUser ? 'flex justify-end' : 'flex justify-start'
    )}>
      <div className={cn(
        'relative rounded-xl text-sm',
        isUser
          ? 'bg-muted/50 text-foreground max-w-[70%] min-w-0 p-3'
          : 'text-foreground max-w-full min-w-0'
      )}>
        {children}
      </div>
    </div>
  )
}

function ChatInputPreview() {
  return (
    <div className="relative flex w-full flex-col gap-2 rounded-2xl border bg-muted/30 p-3">
      <textarea
        placeholder="ask a question..."
        rows={1}
        disabled
        className={cn(
          'w-full resize-none bg-transparent text-sm',
          'placeholder:text-muted-foreground/50',
          'focus:outline-none',
          'min-h-[24px] max-h-[200px]'
        )}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button className="h-8 w-8 flex items-center justify-center text-muted-foreground">
            <Paperclip className="h-4 w-4" />
          </button>
          <button className="h-8 w-8 flex items-center justify-center text-muted-foreground">
            <ImagePlus className="h-4 w-4" />
          </button>
        </div>
        <button className="h-8 w-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground">
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default function ChatUIPage() {
  return (
    <PageLayout toc={tocItems}>
      <div className="max-w-4xl space-y-12">
        {/* Header */}
        <header className="space-y-4">
          <h1 className="text-3xl font-bold">chat ui</h1>
          <p className="text-muted-foreground">
            visual building blocks: chat container, messages, input, and status indicators.
          </p>
        </header>

        {/* Examples */}
        <section id="examples" className="space-y-8">
          <h2 className="text-2xl font-semibold">examples</h2>

          <div id="chat-container" className="space-y-4">
            <h3 className="text-lg font-medium">chat container</h3>
            <p className="text-sm text-muted-foreground">
              grid layout wrapper with structure: header, messages (scrollable), and input.
            </p>
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 border-b">
                <span className="text-sm font-medium">preview</span>
              </div>
              <ChatContainer className="h-[300px]">
                <div className="px-4 py-2 border-b bg-muted/30">
                  <span className="text-sm font-medium">header slot</span>
                </div>
                <div className="flex-1 overflow-auto p-4 space-y-4">
                  <MessageBubblePreview role="user">
                    Hello! Can you help me?
                  </MessageBubblePreview>
                  <MessageBubblePreview role="assistant">
                    Of course! I&apos;d be happy to help. What do you need assistance with?
                  </MessageBubblePreview>
                </div>
                <div className="p-4 border-t">
                  <ChatInputPreview />
                </div>
              </ChatContainer>
            </div>
          </div>

          <div id="message-bubble" className="space-y-4">
            <h3 className="text-lg font-medium">message bubble</h3>
            <p className="text-sm text-muted-foreground">
              styled container for messages. user messages align right with background,
              assistant messages align left without background.
            </p>
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 border-b">
                <span className="text-sm font-medium">preview</span>
              </div>
              <div className="p-4 space-y-4">
                <MessageBubblePreview role="user">
                  This is a user message with a muted background.
                </MessageBubblePreview>
                <MessageBubblePreview role="assistant">
                  This is an assistant message that renders **markdown** and can include `code blocks`, lists, and other formatting.
                </MessageBubblePreview>
                <MessageBubblePreview role="user">
                  User messages are right-aligned and capped at 70% width for readability.
                </MessageBubblePreview>
              </div>
            </div>
          </div>

          <div id="chat-input" className="space-y-4">
            <h3 className="text-lg font-medium">chat input</h3>
            <p className="text-sm text-muted-foreground">
              auto-resizing textarea with file upload support, drag-and-drop,
              and @file references for uploaded files.
            </p>
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 border-b">
                <span className="text-sm font-medium">preview</span>
              </div>
              <div className="p-4">
                <ChatInputPreview />
              </div>
            </div>
          </div>

          <div id="message-status-indicator" className="space-y-4">
            <h3 className="text-lg font-medium">message status indicator</h3>
            <p className="text-sm text-muted-foreground">
              shows when the assistant is thinking or generating a response.
            </p>
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 border-b">
                <span className="text-sm font-medium">preview</span>
              </div>
              <div className="p-4">
                <MessageStatusIndicator label="thinking..." />
              </div>
            </div>
          </div>
        </section>

        {/* Installation */}
        <section id="installation" className="space-y-4">
          <h2 className="text-2xl font-semibold">installation</h2>
          <CodeBlock language="bash">{installCode}</CodeBlock>
        </section>

        {/* Usage */}
        <section id="usage" className="space-y-4">
          <h2 className="text-2xl font-semibold">usage</h2>
          <p className="text-muted-foreground">
            chat provides low-level primitives for building chat interfaces.
            these components work with the{' '}
            <a href="/blocks/agent" className="underline">
              agent
            </a>{' '}
            block which provides the context and state management.
          </p>
          <CodeBlock language="tsx">{usageCode}</CodeBlock>
        </section>
      </div>
    </PageLayout>
  )
}
