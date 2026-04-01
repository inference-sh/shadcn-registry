'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useVirtualizedList, type VirtualItem, type MeasureStrategy } from '@/lib/virtualize'
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
  ToolInvocationStatusFailed,
} from '@inferencesh/sdk'

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
// Mock message builder
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

// =============================================================================
// Diverse conversation — exercises every component type
// =============================================================================

const TEMPLATES: ChatMessageDTO[] = [
  // 1. Simple user
  msg('user', 'Can you help me set up a REST API with authentication?'),

  // 2. Assistant: reasoning + code + table + list + blockquote + image + 4 tools (collapses)
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

  // 3. Short user
  msg('user', 'What about testing?'),

  // 4. Assistant: code + 1 tool (no collapse)
  msg('assistant',
    "```bash\ncurl -X POST http://localhost:3000/login \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"email\": \"test@test.com\"}'\n```\n\nFirst 100 requests return **401**, then **429** when rate limit kicks in.",
    {
      tools: [
        { function: { name: 'runCommand', arguments: { command: 'curl ...' } }, status: ToolInvocationStatusCompleted, result: '{"token":"eyJ..."}' },
      ],
    },
  ),

  // 5. User with image
  msg('user', 'Here\'s the error I see when the token expires:', {
    images: ['https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80'],
  }),

  // 6. Assistant: YouTube + blockquote + heading + code
  msg('assistant',
    "That's **token expiration**.\n\n1. Check `exp` claim before requests\n2. Implement **refresh tokens**\n3. Add client-side interceptor\n\n> JWT tokens are stateless — can't revoke without a blocklist.\n\n![JWT Flow](https://www.youtube.com/watch?v=aqz-KE-bpKQ)\n\n### Error handling\n\n```typescript\ntry {\n  req.user = jwt.verify(token, SECRET)\n} catch (err) {\n  if (err.name === 'TokenExpiredError') {\n    return res.status(401).json({ code: 'TOKEN_EXPIRED' })\n  }\n  return res.status(401).json({ error: 'Invalid token' })\n}\n```",
    { reasoning: 'Screenshot shows 401 jwt expired. Explain refresh tokens and error handling.' },
  ),

  // 7. User asking about deployment
  msg('user', 'Can you deploy this?'),

  // 8. Assistant: tool awaiting approval + completed tools (mixed states)
  msg('assistant',
    "Building and deploying:\n\n1. Build TypeScript\n2. Run tests\n3. Deploy to production",
    {
      tools: [
        { function: { name: 'runCommand', arguments: { command: 'npm run build' } }, status: ToolInvocationStatusCompleted, result: 'Build completed' },
        { function: { name: 'runCommand', arguments: { command: 'npm test' } }, status: ToolInvocationStatusCompleted, result: '12 passed' },
        { function: { name: 'deploy', arguments: { target: 'api.example.com' } }, status: ToolInvocationStatusAwaitingApproval },
      ],
    },
  ),

  // 9. Long user message
  msg('user', 'Actually wait — before deploying, can you also add WebSocket support for real-time notifications? I need the server to push events when:\n\n1. A new user signs up\n2. A payment is processed\n3. An admin action is taken\n\nThe WebSocket should authenticate using the same JWT tokens.'),

  // 10. Assistant: only reasoning + tools, no text body
  msg('assistant', '', {
    reasoning: 'Adding WebSocket with ws library. Need to handle JWT auth on upgrade, create event channels, and manage connection lifecycle.',
    tools: [
      { function: { name: 'editFile', arguments: { path: 'src/server.ts' } }, status: ToolInvocationStatusInProgress },
      { function: { name: 'createFile', arguments: { path: 'src/ws.ts' } }, status: ToolInvocationStatusInProgress },
    ],
  }),

  // 11. Short assistant, no tools
  msg('assistant', 'Done! The WebSocket server is running on the same port. Connect with `ws://localhost:3000` and pass your JWT as a query parameter.'),

  // 12. User with question mark only
  msg('user', '?'),

  // 13. Assistant: failed tool
  msg('assistant', 'Looks like the test suite is failing after the WebSocket changes:', {
    tools: [
      { function: { name: 'runCommand', arguments: { command: 'npm test' } }, status: ToolInvocationStatusFailed, result: 'FAIL src/ws.test.ts\n  TypeError: Cannot read properties of undefined' },
    ],
  }),

  // 14. Assistant: table-heavy response
  msg('assistant', "Here's the complete API reference:\n\n| Endpoint | Method | Auth | WebSocket | Description |\n|----------|--------|------|-----------|-------------|\n| `/login` | POST | No | No | Get JWT token |\n| `/me` | GET | Yes | No | User profile |\n| `/refresh` | POST | Yes | No | Refresh token |\n| `/ws` | WS | JWT | Yes | Real-time events |\n| `/ws/subscribe` | — | — | Yes | Subscribe to channel |\n| `/ws/unsubscribe` | — | — | Yes | Leave channel |\n\n```typescript\n// WebSocket client example\nconst ws = new WebSocket('ws://localhost:3000?token=eyJ...')\nws.onmessage = (event) => {\n  const { channel, data } = JSON.parse(event.data)\n  console.log(`[${channel}]`, data)\n}\n```"),
]

function generateMessages(count: number): ChatMessageDTO[] {
  _id = 0
  const msgs: ChatMessageDTO[] = []
  for (let i = 0; i < count; i++) {
    const t = TEMPLATES[i % TEMPLATES.length]!
    msgs.push({
      ...t,
      id: String(i), short_id: String(i), order: i,
      tool_invocations: t.tool_invocations?.map((inv, j) => ({
        ...inv, id: `${i}-t${j}`, tool_invocation_id: `${i}-t${j}`,
      })),
    } as ChatMessageDTO)
  }
  return msgs
}

// =============================================================================
// Page
// =============================================================================

export default function PretextMdChatDemo() {
  const [count, setCount] = useState(100)
  const [maxWidth, setMaxWidth] = useState(100)
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
    <MockProvider>
      <div className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">pretext-md chat demo</h1>
            <p className="text-sm text-muted-foreground">
              Real components, virtualized. Every message type: reasoning, code, tables, lists, images, YouTube, tools (collapsed, approval, failed, in-progress), empty body, short messages.
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-sm font-medium whitespace-nowrap">Messages: {count}</label>
            <input type="range" min={10} max={1000} step={10} value={count} onChange={e => setCount(Number(e.target.value))} className="flex-1 max-w-[120px]" />
            <label className="text-sm font-medium whitespace-nowrap">Width: {maxWidth}%</label>
            <input type="range" min={30} max={100} step={5} value={maxWidth} onChange={e => setMaxWidth(Number(e.target.value))} className="flex-1 max-w-[120px]" />
            <div className="flex gap-2 text-xs flex-wrap">
              <span className="bg-muted rounded px-2 py-1">{list.totalCount}</span>
              <span className="bg-primary/10 text-primary rounded px-2 py-1">{list.renderedCount} DOM</span>
              <span className="bg-muted rounded px-2 py-1">{Math.round(list.totalHeight).toLocaleString()}px</span>
              <span className={`rounded px-2 py-1 font-mono ${fps < 30 ? 'bg-red-500/10 text-red-500' : fps < 50 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{fps}</span>
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
        </div>
      </div>
    </MockProvider>
  )
}

// =============================================================================
// Message renderer — same as real Agent but works without SDK
// =============================================================================

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
      if (now - lastUpdate.current >= 500) {
        setFps(prev => {
          const next = Math.round(count.current * 1000 / (now - lastUpdate.current))
          return prev === next ? prev : next
        })
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
