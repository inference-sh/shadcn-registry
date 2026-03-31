'use client'

import React, { useState, useLayoutEffect, useEffect, useMemo, useRef, useCallback } from 'react'
import { useVirtualizedList, type VirtualItem } from '@/lib/virtualize'
import { parse } from '@/lib/pretext-md/core/parser'
import { measureBlocks } from '@/lib/pretext-md/core/block-layout'
import { defaultConfig } from '@/lib/pretext-md/react/context'
import { defaultPlugins } from '@/lib/pretext-md/react/plugins'
import { ChatWidthContext } from '@/hooks/use-chat-width'
import { MessageBubble } from '@/components/infsh/agent/message-bubble'
import { MessageContent } from '@/components/infsh/agent/message-content'
import { MessageReasoning } from '@/components/infsh/agent/message-reasoning'
import { ToolInvocations } from '@/components/infsh/agent/tool-invocations'
import { messageStrategy } from '@/registry/blocks/chat/lib/message-strategy'
import { AgentChatContext, type AgentChatContextValue } from '@inferencesh/sdk/agent'
import type { ChatMessageDTO, ToolInvocationDTO } from '@inferencesh/sdk'
import {
  ChatMessageRoleUser,
  ChatMessageRoleAssistant,
  ChatMessageStatusReady,
  ChatMessageContentTypeText,
  ChatMessageContentTypeReasoning,
  ChatMessageContentTypeImage,
  ToolInvocationStatusCompleted,
  ToolInvocationStatusInProgress,
  ToolInvocationStatusAwaitingApproval,
} from '@inferencesh/sdk'

// =============================================================================
// Mock provider — lets real ToolInvocations render without a real backend
// =============================================================================

const noop = async () => {}
const noopFile = async () => ({ uri: '', filename: '', content_type: '' })

const MOCK_CONTEXT: AgentChatContextValue = {
  state: {
    chatId: 'demo',
    messages: [],
    connectionStatus: 'idle',
    chat: null,
  },
  actions: {
    sendMessage: noop,
    uploadFile: noopFile,
    stopGeneration: () => {},
    reset: () => {},
    clearError: () => {},
    submitToolResult: noop,
    approveTool: noop,
    rejectTool: noop,
    alwaysAllowTool: noop,
  },
  client: {
    http: {
      request: noop as never,
      getStreamableConfig: () => ({ url: '', headers: {} }),
      getStreamDefault: () => true,
      getPollIntervalMs: () => 1000,
    },
    files: { upload: noopFile },
  },
}

function MockAgentProvider({ children }: { children: React.ReactNode }) {
  return (
    <AgentChatContext.Provider value={MOCK_CONTEXT}>
      {children}
    </AgentChatContext.Provider>
  )
}

// =============================================================================
// Mock data helpers
// =============================================================================

let idCounter = 0

function mockMsg(
  role: 'user' | 'assistant',
  text: string,
  opts?: {
    reasoning?: string
    images?: string[]
    toolInvocations?: Partial<ToolInvocationDTO>[]
  },
): ChatMessageDTO {
  const id = String(idCounter++)
  const content: any[] = []
  if (opts?.reasoning) {
    content.push({ type: ChatMessageContentTypeReasoning, text: opts.reasoning })
  }
  if (opts?.images) {
    for (const img of opts.images) {
      content.push({ type: ChatMessageContentTypeImage, image: img })
    }
  }
  content.push({ type: ChatMessageContentTypeText, text })

  const tools = opts?.toolInvocations?.map((t, i) => ({
    id: `${id}-tool-${i}`,
    short_id: `t${i}`,
    chat_message_id: id,
    tool_invocation_id: `${id}-tool-${i}`,
    type: 'tool',
    function: { name: t.function?.name ?? 'unknown', arguments: t.function?.arguments ?? {} },
    status: t.status ?? ToolInvocationStatusCompleted,
    result: t.result,
    data: t.data,
    widget: t.widget,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 'demo',
    team_id: 'demo',
    visibility: 'private',
  })) as ToolInvocationDTO[] | undefined

  return {
    id,
    short_id: id,
    chat_id: 'demo',
    order: Number(id),
    status: ChatMessageStatusReady,
    role: role === 'user' ? ChatMessageRoleUser : ChatMessageRoleAssistant,
    content,
    tool_invocations: tools,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 'demo',
    team_id: 'demo',
    visibility: 'private',
  } as ChatMessageDTO
}

// =============================================================================
// Rich conversation — every component type
// =============================================================================

const CONVERSATION_TEMPLATES: ChatMessageDTO[] = [
  // 1. Simple user message
  mockMsg('user', 'Can you help me set up a REST API with authentication? I need **JWT tokens**, rate limiting, and input validation with `zod`.'),

  // 2. Assistant with reasoning + code + rich markdown + multiple tools
  mockMsg('assistant',
    "Here's the server with **JWT auth middleware**. The `/login` endpoint returns a token, and `/me` is a *protected route* that requires `Bearer <token>` in the Authorization header.\n\n```typescript\nimport express from 'express'\nimport jwt from 'jsonwebtoken'\n\nconst app = express()\napp.use(express.json())\n\nconst SECRET = process.env.JWT_SECRET\n\nfunction authenticate(req, res, next) {\n  const token = req.headers.authorization?.split(' ')[1]\n  if (!token) return res.status(401).json({ error: 'No token' })\n  req.user = jwt.verify(token, SECRET)\n  next()\n}\n```\n\n| Endpoint | Method | Auth | Description |\n|----------|--------|------|-------------|\n| `/login` | POST | No | Returns JWT token |\n| `/me` | GET | Yes | Current user profile |\n| `/refresh` | POST | Yes | Refresh expired token |\n| `/logout` | POST | Yes | Invalidate token |\n\n- **Rate limiting**: 100 requests per 15 minutes per IP\n- **Input validation**: `zod` schemas for request bodies\n- [CORS](https://example.com) configured for production\n\n> Pretext proved that text measurement can be **pure arithmetic** — zero DOM reads, zero reflows.\n\n---\n\n![Architecture diagram](https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80)",
    {
      reasoning: 'The user wants a REST API with auth. Express + JWT is the standard approach. I should scaffold the project structure, install dependencies, create the auth middleware, and show examples of rate limiting and validation. Let me think about the best way to structure this — should I use a single file or split into modules? For a demo, a single file is clearest. I\'ll include the middleware pattern, a login endpoint, and a protected route.',
      toolInvocations: [
        { function: { name: 'createFile', arguments: { path: 'src/server.ts' } }, status: ToolInvocationStatusCompleted, result: JSON.stringify({ path: 'src/server.ts', lines: 42 }) },
        { function: { name: 'createFile', arguments: { path: 'src/auth.ts' } }, status: ToolInvocationStatusCompleted, result: JSON.stringify({ path: 'src/auth.ts', lines: 28 }) },
        { function: { name: 'createFile', arguments: { path: 'src/middleware/rate-limit.ts' } }, status: ToolInvocationStatusCompleted, result: JSON.stringify({ path: 'src/middleware/rate-limit.ts', lines: 15 }) },
        { function: { name: 'runCommand', arguments: { command: 'npm install express jsonwebtoken bcrypt zod express-rate-limit' } }, status: ToolInvocationStatusCompleted, result: '+ express@4.18.2\n+ jsonwebtoken@9.0.0\n+ bcrypt@5.1.0\n+ zod@3.22.0\n+ express-rate-limit@7.1.0\nadded 5 packages in 2.1s' },
      ],
    },
  ),

  // 3. Short user follow-up
  mockMsg('user', 'What about testing with curl?'),

  // 4. Assistant with code + single tool
  mockMsg('assistant',
    "Test with curl:\n\n```bash\n# Login\ncurl -X POST http://localhost:3000/login \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"email\": \"user@test.com\", \"password\": \"password123\"}'\n\n# Protected route\ncurl http://localhost:3000/me \\\n  -H 'Authorization: Bearer <token>'\n```\n\nThe first 100 requests return **401** (no token), then you'll see **429** when the rate limit kicks in.",
    {
      toolInvocations: [
        { function: { name: 'runCommand', arguments: { command: 'curl -X POST http://localhost:3000/login ...' } }, status: ToolInvocationStatusCompleted, result: '{"token":"eyJhbGciOiJIUzI1NiJ9..."}' },
      ],
    },
  ),

  // 5. User with image attachment
  mockMsg('user', 'Here\'s a screenshot of the error I\'m seeing when the token expires:', {
    images: ['https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80'],
  }),

  // 6. Assistant with YouTube + blockquote + lists
  mockMsg('assistant',
    "That's the classic **token expiration** error. Here's how to handle it:\n\n1. Check `exp` claim before making requests\n2. Implement **refresh tokens** with a `/refresh` endpoint\n3. Add a client-side interceptor that auto-refreshes\n\n> JWT tokens are stateless — the server never stores them. The tradeoff is you can't revoke individual tokens without a blocklist.\n\nHere's a great walkthrough of the refresh token pattern:\n\n![JWT Refresh Flow](https://www.youtube.com/watch?v=aqz-KE-bpKQ)\n\n### Error handling\n\nWrap your middleware in a try-catch to distinguish expired vs invalid tokens:\n\n```typescript\ntry {\n  req.user = jwt.verify(token, SECRET)\n} catch (err) {\n  if (err.name === 'TokenExpiredError') {\n    return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' })\n  }\n  return res.status(401).json({ error: 'Invalid token' })\n}\n```",
    {
      reasoning: 'The screenshot shows a 401 with "jwt expired" message. This is a common issue. I should explain refresh tokens and show the error handling pattern.',
    },
  ),

  // 7. User asking about deployment
  mockMsg('user', 'Perfect, thanks! Can you deploy this to production?'),

  // 8. Assistant with tool awaiting approval + in-progress
  mockMsg('assistant',
    "I'll deploy to your production server. Here's what I'm doing:\n\n1. Building the TypeScript project\n2. Running tests\n3. Deploying to `api.example.com`",
    {
      toolInvocations: [
        { function: { name: 'runCommand', arguments: { command: 'npm run build' } }, status: ToolInvocationStatusCompleted, result: 'Build completed in 2.3s' },
        { function: { name: 'runCommand', arguments: { command: 'npm test' } }, status: ToolInvocationStatusCompleted, result: 'Tests: 12 passed, 0 failed' },
        { function: { name: 'deploy', arguments: { target: 'api.example.com', env: 'production' } }, status: ToolInvocationStatusAwaitingApproval },
      ],
    },
  ),
]

function generateMessages(count: number): ChatMessageDTO[] {
  // Reset id counter for deterministic IDs
  idCounter = 0
  const templates = CONVERSATION_TEMPLATES
  // Regenerate templates with fresh IDs
  const freshTemplates: ChatMessageDTO[] = []
  for (let i = 0; i < count; i++) {
    const t = templates[i % templates.length]!
    freshTemplates.push({
      ...t,
      id: String(i),
      short_id: String(i),
      order: i,
      // Deep clone tool_invocations to get unique IDs
      tool_invocations: t.tool_invocations?.map((inv, j) => ({
        ...inv,
        id: `${i}-tool-${j}`,
        tool_invocation_id: `${i}-tool-${j}`,
      })),
    } as ChatMessageDTO)
  }
  return freshTemplates
}

// =============================================================================
// Page
// =============================================================================

// Content for the streaming message
const STREAMING_TEXT = `Let me explain how **streaming** works with pretext-md virtualization.

Each token triggers a re-parse and re-measure of the message. The virtualizer picks up the new height via the \`ComputedStrategy\` and updates spacers accordingly.

\`\`\`typescript
// On each token:
const blocks = parse(content)
const result = measureBlocks(blocks, config)
// Height feeds into virtualizer strategy
\`\`\`

| Step | Operation | Cost |
|------|-----------|------|
| 1 | Parse markdown | ~0.2ms |
| 2 | Measure blocks | ~0.6ms |
| 3 | React re-render | ~1ms |
| 4 | RO height correction | async |

The key insight: **parse + measure is under 1ms** even for complex messages. That's well within the 16ms frame budget at 60fps.

> The virtualizer only re-renders visible items. A 1000-message chat with streaming costs the same as a 5-message chat.

- No DOM measurement needed for height prediction
- RO corrects any drift after paint
- Scroll position stays anchored automatically`

export default function PretextMdChatDemo() {
  const [messageCount, setMessageCount] = useState(100)
  const [streamingMsg, setStreamingMsg] = useState<ChatMessageDTO | null>(null)
  const streamingRef = useRef<number | null>(null)

  const baseMessages = useMemo(() => generateMessages(messageCount), [messageCount])
  const messages = useMemo(() => {
    if (!streamingMsg) return baseMessages
    return [...baseMessages, streamingMsg]
  }, [baseMessages, streamingMsg])

  // Container dimensions — set via ref callback + RO
  const containerElRef = useRef<HTMLDivElement | null>(null)
  const roRef = useRef<ResizeObserver | null>(null)
  const [chatWidth, setChatWidth] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)

  const containerRef = React.useCallback((el: HTMLDivElement | null) => {
    // Cleanup previous
    if (roRef.current) { roRef.current.disconnect(); roRef.current = null }
    containerElRef.current = el
    if (!el) return
    // Sync read
    setChatWidth(el.clientWidth)
    setViewportHeight(el.clientHeight)
    // RO for resizes
    roRef.current = new ResizeObserver(() => {
      if (!containerElRef.current) return
      setChatWidth(containerElRef.current.clientWidth)
      setViewportHeight(containerElRef.current.clientHeight)
    })
    roRef.current.observe(el)
  }, [])

  const innerWidth = chatWidth > 32 ? chatWidth - 32 : 0

  // Base items: pre-resolve to fixed heights (no re-measure on streaming ticks)
  const baseVirtualItems: VirtualItem<ChatMessageDTO>[] = useMemo(() => {
    if (innerWidth <= 0) return []
    return baseMessages.map(msg => {
      const strategy = messageStrategy(msg)
      const height = strategy.kind === 'computed' ? strategy.measure(innerWidth) : 0
      return { id: msg.id, strategy: { kind: 'fixed' as const, height }, data: msg }
    })
  }, [baseMessages, innerWidth])

  // Streaming item: live computed strategy (re-measured each frame)
  const virtualItems: VirtualItem<ChatMessageDTO>[] = useMemo(() => {
    if (!streamingMsg) return baseVirtualItems
    return [...baseVirtualItems, {
      id: streamingMsg.id,
      strategy: messageStrategy(streamingMsg),
      data: streamingMsg,
    }]
  }, [baseVirtualItems, streamingMsg])
  const list = useVirtualizedList(virtualItems, viewportHeight, innerWidth, 16)
  const { getItemRef } = list
  const fps = useFps()
  const [benchResult, setBenchResult] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  const startStreaming = useCallback(() => {
    // Stop any previous stream
    if (streamingRef.current) cancelAnimationFrame(streamingRef.current)

    const tokens = STREAMING_TEXT.split(/(\s+)/)
    let idx = 0
    let content = ''
    const streamId = String(Date.now())

    setIsStreaming(true)

    function tick() {
      // Emit 2-3 tokens per frame (~60 tokens/sec, realistic LLM speed)
      const tokensPerFrame = 2 + Math.floor(Math.random() * 2)
      for (let i = 0; i < tokensPerFrame && idx < tokens.length; i++) {
        content += tokens[idx++]
      }

      const msg = mockMsg('assistant', content)
      msg.id = streamId
      msg.short_id = streamId
      msg.status = idx < tokens.length ? ('generating' as any) : ChatMessageStatusReady
      setStreamingMsg({ ...msg })

      // Auto-scroll
      if (containerElRef.current) {
        containerElRef.current.scrollTop = containerElRef.current.scrollHeight
      }

      if (idx < tokens.length) {
        streamingRef.current = requestAnimationFrame(tick)
      } else {
        streamingRef.current = null
        setIsStreaming(false)
      }
    }

    streamingRef.current = requestAnimationFrame(tick)
  }, [])

  const stopStreaming = useCallback(() => {
    if (streamingRef.current) {
      cancelAnimationFrame(streamingRef.current)
      streamingRef.current = null
    }
    setIsStreaming(false)
  }, [])

  const runBench = useCallback(() => {
    const benchPlugins = defaultPlugins()
    const config = { maxWidth: innerWidth || 600, fonts: defaultConfig.fonts, lineHeights: defaultConfig.lineHeights, plugins: benchPlugins }

    // Use STREAMING_TEXT — it has code, table, blockquote, list (harder than simple messages)
    const text = STREAMING_TEXT

    // Warm up
    for (let i = 0; i < 10; i++) measureBlocks(parse(text), config)

    // 1. Single message parse+measure (worst case per-token)
    const N = 500
    const t0 = performance.now()
    for (let i = 0; i < N; i++) measureBlocks(parse(text), config)
    const perCall = (performance.now() - t0) / N

    // 2. Streaming: incremental token-by-token
    const tokens = text.split(/(\s+)/)
    let content = ''
    const streamTimes: number[] = []
    for (const tok of tokens) {
      content += tok
      const s = performance.now()
      measureBlocks(parse(content), config)
      streamTimes.push(performance.now() - s)
    }
    const avgStream = streamTimes.reduce((a, b) => a + b, 0) / streamTimes.length
    const maxStream = Math.max(...streamTimes)
    const sorted = [...streamTimes].sort((a, b) => a - b)
    const p99 = sorted[Math.floor(sorted.length * 0.99)]!

    // 3. Batch: measure 100 different messages (simulates full list re-strategy)
    const batchMsgs = baseMessages.slice(0, 100)
    const bt0 = performance.now()
    for (const msg of batchMsgs) {
      const t = msg.content.find(c => c.type === ChatMessageContentTypeText)?.text
      if (t) measureBlocks(parse(t), config)
    }
    const batchTotal = performance.now() - bt0

    const lines = [
      `Single: ${perCall.toFixed(2)}ms (${(1000/perCall).toFixed(0)}/s)`,
      `Stream: avg ${avgStream.toFixed(2)}ms, p99 ${p99.toFixed(2)}ms, max ${maxStream.toFixed(2)}ms`,
      `Batch 100 msgs: ${batchTotal.toFixed(1)}ms total (${(batchTotal/100).toFixed(2)}ms/msg)`,
      perCall < 1 ? 'safe at 60fps' : perCall < 5 ? 'throttle recommended' : 'must throttle',
    ]
    setBenchResult(lines.join(' | '))
    console.log('[bench]', lines.join('\n'))
  }, [innerWidth, baseMessages])

  return (
    <MockAgentProvider>
      <div className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">pretext-md chat demo</h1>
            <p className="text-sm text-muted-foreground">
              Real chat components + virtualization. Measurement via pretext-md, rendering with MessageBubble, MessageContent, MessageReasoning, ToolInvocations.
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-sm font-medium whitespace-nowrap">
              Messages: {messageCount}
            </label>
            <input
              type="range"
              min={10}
              max={1000}
              step={10}
              value={messageCount}
              onChange={(e) => setMessageCount(Number(e.target.value))}
              className="flex-1 max-w-xs"
            />
            <div className="flex gap-3 text-xs flex-wrap">
              <span className="bg-muted rounded px-2 py-1">{list.totalCount} total</span>
              <span className="bg-primary/10 text-primary rounded px-2 py-1">{list.renderedCount} in DOM</span>
              <span className="bg-muted rounded px-2 py-1">{Math.round(list.totalHeight).toLocaleString()}px</span>
              <span className={`rounded px-2 py-1 font-mono ${fps < 30 ? 'bg-red-500/10 text-red-500' : fps < 50 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{fps} fps</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={isStreaming ? stopStreaming : startStreaming}
              className={`text-xs rounded px-3 py-1.5 transition-colors ${isStreaming ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
            >
              {isStreaming ? 'stop streaming' : 'simulate streaming'}
            </button>
            <button onClick={runBench} className="text-xs bg-muted hover:bg-muted/80 rounded px-3 py-1.5 transition-colors">
              run benchmark
            </button>
            {benchResult && <span className="text-xs text-muted-foreground font-mono">{benchResult}</span>}
          </div>

          {/* Chat */}
          <ChatWidthContext.Provider value={chatWidth}>
            <div
              ref={(el) => {
                containerRef(el)
                list.scrollRef(el)
              }}
              className="border border-border rounded-xl bg-muted/20 overflow-y-auto"
              style={{ height: 600 }}
            >
              {/* Top spacer */}
              <div style={{ height: list.topSpacer }} />

              {/* Visible messages */}
              <div className="flex flex-col gap-4 px-4">
                {list.items.map(item => (
                  <div key={item.id} ref={getItemRef(item.id)}>
                    <DemoMessage message={item.data} />
                  </div>
                ))}
              </div>

              {/* Bottom spacer */}
              <div style={{ height: list.bottomSpacer }} />
            </div>
          </ChatWidthContext.Provider>
        </div>
      </div>
    </MockAgentProvider>
  )
}

// =============================================================================
// Demo message — uses real components (same composition as Message component)
// =============================================================================

function DemoMessage({ message }: { message: ChatMessageDTO }) {
  const isAssistant = message.role === ChatMessageRoleAssistant

  const reasoningContent = message.content?.find(
    c => c.type === ChatMessageContentTypeReasoning
  )?.text

  return (
    <MessageBubble message={message}>
      {isAssistant && reasoningContent && (
        <MessageReasoning reasoning={reasoningContent} />
      )}
      <MessageContent message={message} />
      {isAssistant && <ToolInvocations message={message} />}
    </MessageBubble>
  )
}

// =============================================================================
// FPS counter
// =============================================================================

function useFps(): number {
  const [fps, setFps] = useState(60)
  const count = useRef(0)
  const lastUpdate = useRef(performance.now())

  useEffect(() => {
    let raf: number
    function tick() {
      count.current++
      const now = performance.now()
      const elapsed = now - lastUpdate.current
      if (elapsed >= 500) {
        const newFps = Math.round(count.current * 1000 / elapsed)
        setFps(prev => prev === newFps ? prev : newFps)
        count.current = 0
        lastUpdate.current = now
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return fps
}
