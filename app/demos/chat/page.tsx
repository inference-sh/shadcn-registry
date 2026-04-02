'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { PageLayout } from '@/components/page-layout'
import { useVirtualizedList, type VirtualItem, type MeasureStrategy } from '@/lib/virtualize'
import { ChatWidthContext } from '@/hooks/use-chat-width'
import { MessageBubble } from '@/components/infsh/agent/message-bubble'
import { MessageContent } from '@/components/infsh/agent/message-content'
import { MessageReasoning } from '@/components/infsh/agent/message-reasoning'
import { ToolInvocations } from '@/components/infsh/agent/tool-invocations'
import { messageStrategy } from '@/registry/blocks/chat/lib/message-strategy'
import { AgentChatContext, type AgentChatContextValue } from '@inferencesh/sdk/agent'
import type { ChatMessageDTO, ToolInvocationDTO } from '@inferencesh/sdk'
import type { TocItem } from '@/registry/blocks/table-of-contents/table-of-contents'
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
  ToolInvocationStatusFailed,
} from '@inferencesh/sdk'

// =============================================================================
// Page
// =============================================================================

const tocItems: TocItem[] = [
  { id: 'how', title: 'how it works' },
  { id: 'demo', title: 'live demo' },
]

export default function ChatDemoPage() {
  const [count, setCount] = useState(100)
  const [maxWidth, setMaxWidth] = useState(100)

  return (
    <PageLayout toc={tocItems}>
      <div className="max-w-4xl space-y-12">
        <header className="space-y-4">
          <h1 className="text-3xl font-bold">virtualized chat</h1>
          <p className="text-lg text-muted-foreground">
            1000 messages, 5 in the DOM. every block measured before it renders.
          </p>
        </header>

        <section id="how" className="space-y-6">
          <h2 className="text-2xl font-semibold">how it works</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="border rounded-lg p-4 space-y-2">
              <div className="text-sm font-medium">measure</div>
              <p className="text-xs text-muted-foreground">
                text is measured with <a href="https://github.com/chenglou/pretext" className="underline">pretext</a> — pure canvas arithmetic, zero DOM reads. code blocks, tables, images, and embeds are measured by plugins that own their dimensions.
              </p>
            </div>
            <div className="border rounded-lg p-4 space-y-2">
              <div className="text-sm font-medium">virtualize</div>
              <p className="text-xs text-muted-foreground">
                predicted heights feed into the virtualizer. only visible messages are in the DOM. scroll position is preserved across width changes. strategies are cached — streaming only recomputes 1 message per frame.
              </p>
            </div>
            <div className="border rounded-lg p-4 space-y-2">
              <div className="text-sm font-medium">correct</div>
              <p className="text-xs text-muted-foreground">
                after paint, a ResizeObserver measures the real DOM height. any drift between prediction and reality is corrected automatically. the result: accurate layout with zero layout thrashing.
              </p>
            </div>
          </div>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <span>parse + measure: <strong className="text-foreground">0.7ms</strong></span>
            <span>frame budget: <strong className="text-foreground">16ms</strong></span>
            <span>headroom: <strong className="text-foreground">22x</strong></span>
          </div>
        </section>

        <section id="demo" className="space-y-6">
          <h2 className="text-2xl font-semibold">live demo</h2>
          <p className="text-sm text-muted-foreground">
            real components — MessageBubble, MessageReasoning, ToolInvocations, pretext-md Markdown. code blocks, tables, blockquotes, lists, images, youtube, tool collapse, approval UI, failed tools, in-progress tools, reasoning blocks.
          </p>

          <MockProvider>
            <VirtualizedChatDemo count={count} setCount={setCount} maxWidth={maxWidth} setMaxWidth={setMaxWidth} />
          </MockProvider>
        </section>
      </div>
    </PageLayout>
  )
}

// =============================================================================
// Mock provider
// =============================================================================

const noop = async () => {}
const noopFile = async () => ({ uri: '', filename: '', content_type: '' })

const MOCK_CONTEXT: AgentChatContextValue = {
  state: { chatId: 'demo', messages: [], connectionStatus: 'idle', chat: null },
  actions: {
    sendMessage: noop, uploadFile: noopFile, stopGeneration: () => {},
    reset: () => {}, clearError: () => {},
    submitToolResult: noop, approveTool: noop, rejectTool: noop, alwaysAllowTool: noop,
  },
  client: {
    http: { request: noop as never, getStreamableConfig: () => ({ url: '', headers: {} }), getStreamDefault: () => true, getPollIntervalMs: () => 1000 },
    files: { upload: noopFile },
  },
}

function MockProvider({ children }: { children: React.ReactNode }) {
  return <AgentChatContext.Provider value={MOCK_CONTEXT}>{children}</AgentChatContext.Provider>
}

// =============================================================================
// Mock data
// =============================================================================

let _id = 0
function msg(role: 'user' | 'assistant', text: string, opts?: {
  reasoning?: string
  images?: string[]
  tools?: Partial<ToolInvocationDTO>[]
}): ChatMessageDTO {
  const id = String(_id++)
  const content: any[] = []
  if (opts?.reasoning) content.push({ type: ChatMessageContentTypeReasoning, text: opts.reasoning })
  if (opts?.images) for (const img of opts.images) content.push({ type: ChatMessageContentTypeImage, image: img })
  content.push({ type: ChatMessageContentTypeText, text })
  const tools = opts?.tools?.map((t, i) => ({
    id: `${id}-t${i}`, short_id: `t${i}`, chat_message_id: id, tool_invocation_id: `${id}-t${i}`,
    type: 'tool', function: { name: t.function?.name ?? 'tool', arguments: t.function?.arguments ?? {} },
    status: t.status ?? ToolInvocationStatusCompleted, result: t.result, data: t.data, widget: t.widget,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    user_id: 'demo', team_id: 'demo', visibility: 'private',
  })) as ToolInvocationDTO[] | undefined
  return {
    id, short_id: id, chat_id: 'demo', order: Number(id),
    status: ChatMessageStatusReady,
    role: role === 'user' ? ChatMessageRoleUser : ChatMessageRoleAssistant,
    content, tool_invocations: tools,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    user_id: 'demo', team_id: 'demo', visibility: 'private',
  } as ChatMessageDTO
}

const TEMPLATES: ChatMessageDTO[] = [
  msg('user', 'Can you help me set up a REST API with authentication?'),
  msg('assistant',
    "Here's the server with **JWT auth middleware**.\n\n```typescript\nimport express from 'express'\nimport jwt from 'jsonwebtoken'\n\nconst app = express()\nconst SECRET = process.env.JWT_SECRET\n\nfunction authenticate(req, res, next) {\n  const token = req.headers.authorization?.split(' ')[1]\n  if (!token) return res.status(401).json({ error: 'No token' })\n  req.user = jwt.verify(token, SECRET)\n  next()\n}\n```\n\n| Endpoint | Method | Auth |\n|----------|--------|------|\n| `/login` | POST | No |\n| `/me` | GET | Yes |\n| `/refresh` | POST | Yes |\n\n- **Rate limiting**: 100 req/15min per IP\n- **Validation**: `zod` schemas\n\n> Pure arithmetic measurement — zero DOM reads.\n\n---\n\n![Diagram](https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80)",
    {
      reasoning: 'Express + JWT is standard. Scaffold project, install deps, create auth middleware, show rate limiting and validation examples.',
      tools: [
        { function: { name: 'createFile', arguments: { path: 'src/server.ts' } }, status: ToolInvocationStatusCompleted, result: '{"lines": 42}' },
        { function: { name: 'createFile', arguments: { path: 'src/auth.ts' } }, status: ToolInvocationStatusCompleted, result: '{"lines": 28}' },
        { function: { name: 'createFile', arguments: { path: 'src/rate-limit.ts' } }, status: ToolInvocationStatusCompleted, result: '{"lines": 15}' },
        { function: { name: 'runCommand', arguments: { command: 'npm install' } }, status: ToolInvocationStatusCompleted, result: 'added 5 packages in 2.1s' },
      ],
    },
  ),
  msg('user', 'What about testing?'),
  msg('assistant',
    "```bash\ncurl -X POST http://localhost:3000/login \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"email\": \"test@test.com\"}'\n```\n\nFirst 100 requests return **401**, then **429** when rate limit kicks in.",
    { tools: [{ function: { name: 'runCommand', arguments: { command: 'curl ...' } }, status: ToolInvocationStatusCompleted, result: '{"token":"eyJ..."}' }] },
  ),
  msg('user', 'Here\'s the error I see when the token expires:', {
    images: ['https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80'],
  }),
  msg('assistant',
    "That's **token expiration**.\n\n1. Check `exp` claim before requests\n2. Implement **refresh tokens**\n3. Add client-side interceptor\n\n> JWT tokens are stateless — can't revoke without a blocklist.\n\n![JWT Flow](https://www.youtube.com/watch?v=aqz-KE-bpKQ)\n\n### Error handling\n\n```typescript\ntry {\n  req.user = jwt.verify(token, SECRET)\n} catch (err) {\n  if (err.name === 'TokenExpiredError') {\n    return res.status(401).json({ code: 'TOKEN_EXPIRED' })\n  }\n  return res.status(401).json({ error: 'Invalid token' })\n}\n```",
    { reasoning: 'Screenshot shows 401 jwt expired. Explain refresh tokens and error handling.' },
  ),
  msg('user', 'Can you deploy this?'),
  msg('assistant', "Building and deploying:\n\n1. Build TypeScript\n2. Run tests\n3. Deploy to production", {
    tools: [
      { function: { name: 'runCommand', arguments: { command: 'npm run build' } }, status: ToolInvocationStatusCompleted, result: 'Build completed' },
      { function: { name: 'runCommand', arguments: { command: 'npm test' } }, status: ToolInvocationStatusCompleted, result: '12 passed' },
      { function: { name: 'deploy', arguments: { target: 'api.example.com' } }, status: ToolInvocationStatusAwaitingApproval },
    ],
  }),
  msg('user', 'Actually wait — before deploying, can you also add WebSocket support for real-time notifications? I need the server to push events when a new user signs up, a payment is processed, or an admin action is taken.'),
  msg('assistant', '', {
    reasoning: 'Adding WebSocket with ws library. Need to handle JWT auth on upgrade, create event channels, and manage connection lifecycle.',
    tools: [
      { function: { name: 'editFile', arguments: { path: 'src/server.ts' } }, status: ToolInvocationStatusInProgress },
      { function: { name: 'createFile', arguments: { path: 'src/ws.ts' } }, status: ToolInvocationStatusInProgress },
    ],
  }),
  msg('assistant', 'Done! The WebSocket server is running on the same port. Connect with `ws://localhost:3000` and pass your JWT as a query parameter.'),
  msg('user', '?'),
  msg('assistant', 'Looks like the test suite is failing after the WebSocket changes:', {
    tools: [{ function: { name: 'runCommand', arguments: { command: 'npm test' } }, status: ToolInvocationStatusFailed, result: 'FAIL src/ws.test.ts\n  TypeError: Cannot read properties of undefined' }],
  }),
  msg('assistant', "Here's the complete API reference:\n\n| Endpoint | Method | Auth | WebSocket | Description |\n|----------|--------|------|-----------|-------------|\n| `/login` | POST | No | No | Get JWT token |\n| `/me` | GET | Yes | No | User profile |\n| `/refresh` | POST | Yes | No | Refresh token |\n| `/ws` | WS | JWT | Yes | Real-time events |\n| `/ws/subscribe` | — | — | Yes | Subscribe to channel |\n| `/ws/unsubscribe` | — | — | Yes | Leave channel |\n\n```typescript\nconst ws = new WebSocket('ws://localhost:3000?token=eyJ...')\nws.onmessage = (event) => {\n  const { channel, data } = JSON.parse(event.data)\n  console.log(`[${channel}]`, data)\n}\n```"),
]

function generateMessages(count: number): ChatMessageDTO[] {
  _id = 0
  return Array.from({ length: count }, (_, i) => {
    const t = TEMPLATES[i % TEMPLATES.length]!
    return {
      ...t, id: String(i), short_id: String(i), order: i,
      tool_invocations: t.tool_invocations?.map((inv, j) => ({ ...inv, id: `${i}-t${j}`, tool_invocation_id: `${i}-t${j}` })),
    } as ChatMessageDTO
  })
}

// =============================================================================
// Demo component
// =============================================================================

function VirtualizedChatDemo({ count, setCount, maxWidth, setMaxWidth }: {
  count: number; setCount: (n: number) => void
  maxWidth: number; setMaxWidth: (n: number) => void
}) {
  const messages = useMemo(() => generateMessages(count), [count])

  const containerElRef = useRef<HTMLDivElement | null>(null)
  const roRef = useRef<ResizeObserver | null>(null)
  const [chatWidth, setChatWidth] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)

  const containerRef = useCallback((el: HTMLDivElement | null) => {
    if (roRef.current) { roRef.current.disconnect(); roRef.current = null }
    containerElRef.current = el
    if (!el) return
    setChatWidth(el.clientWidth)
    setViewportHeight(el.clientHeight)
    roRef.current = new ResizeObserver(() => {
      if (!containerElRef.current) return
      setChatWidth(containerElRef.current.clientWidth)
      setViewportHeight(containerElRef.current.clientHeight)
    })
    roRef.current.observe(el)
  }, [])

  const innerWidth = chatWidth > 32 ? chatWidth - 32 : 0

  const strategyMap = useRef(new Map<string, MeasureStrategy>())
  const virtualItems: VirtualItem<ChatMessageDTO>[] = useMemo(() => {
    if (innerWidth <= 0) return []
    return messages.map(m => {
      let s = strategyMap.current.get(m.id)
      if (!s) { s = messageStrategy(m); strategyMap.current.set(m.id, s) }
      return { id: m.id, strategy: s, data: m }
    })
  }, [messages, innerWidth])

  const list = useVirtualizedList(virtualItems, viewportHeight, innerWidth, 8)
  const fps = useFps()

  return (
    <>
      <div className="flex items-center gap-4 flex-wrap">
        <label className="text-sm font-medium whitespace-nowrap">Messages: {count}</label>
        <input type="range" min={10} max={1000} step={10} value={count} onChange={e => setCount(Number(e.target.value))} className="flex-1 max-w-[120px]" />
        <label className="text-sm font-medium whitespace-nowrap">Width: {maxWidth}%</label>
        <input type="range" min={30} max={100} step={5} value={maxWidth} onChange={e => setMaxWidth(Number(e.target.value))} className="flex-1 max-w-[120px]" />
        <div className="flex gap-2 text-xs flex-wrap">
          <span className="bg-muted rounded px-2 py-1">{list.totalCount} total</span>
          <span className="bg-primary/10 text-primary rounded px-2 py-1">{list.renderedCount} DOM</span>
          <span className="bg-muted rounded px-2 py-1">{Math.round(list.totalHeight).toLocaleString()}px</span>
          <span className={`rounded px-2 py-1 font-mono ${fps < 30 ? 'bg-red-500/10 text-red-500' : fps < 50 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{fps} fps</span>
        </div>
      </div>

      <ChatWidthContext.Provider value={chatWidth}>
        <div
          ref={(el) => { containerRef(el); list.scrollRef(el) }}
          className="border border-border rounded-xl bg-muted/20 overflow-y-auto transition-[width] duration-150"
          style={{ height: 600, width: `${maxWidth}%` }}
        >
          <div style={{ height: list.topSpacer }} />
          <div className="flex flex-col gap-2 px-4 py-3">
            {list.items.map(item => (
              <div key={item.id} ref={list.getItemRef(item.id)}>
                <DemoMessage message={item.data} />
              </div>
            ))}
          </div>
          <div style={{ height: list.bottomSpacer }} />
        </div>
      </ChatWidthContext.Provider>
    </>
  )
}

function DemoMessage({ message }: { message: ChatMessageDTO }) {
  const isAssistant = message.role === ChatMessageRoleAssistant
  const reasoning = message.content?.find(c => c.type === ChatMessageContentTypeReasoning)?.text
  const hasText = message.content?.some(c => c.type === ChatMessageContentTypeText && c.text?.trim())
  return (
    <MessageBubble message={message}>
      {isAssistant && reasoning && <MessageReasoning reasoning={reasoning} />}
      {hasText && <MessageContent message={message} />}
      {isAssistant && <ToolInvocations message={message} />}
    </MessageBubble>
  )
}

// =============================================================================
// FPS counter (guards against NaN)
// =============================================================================

function useFps(): number {
  const [fps, setFps] = useState(60)
  const count = useRef(0)
  const lastUpdate = useRef(0)
  useEffect(() => {
    lastUpdate.current = performance.now()
    let raf: number
    function tick() {
      count.current++
      const now = performance.now()
      const elapsed = now - lastUpdate.current
      if (elapsed >= 500) {
        const next = elapsed > 0 ? Math.round(count.current * 1000 / elapsed) : 60
        setFps(prev => prev === next ? prev : next)
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
