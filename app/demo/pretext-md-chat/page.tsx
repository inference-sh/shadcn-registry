'use client'

import React, { useState, useLayoutEffect, useEffect, useMemo, useRef } from 'react'
import { Markdown } from '@/lib/pretext-md/react'
import { parse } from '@/lib/pretext-md/core'
import { measureBlocks } from '@/lib/pretext-md/core/block-layout'
import { defaultConfig } from '@/lib/pretext-md/react/context'
import { defaultPlugins } from '@/lib/pretext-md/react/plugins'
import { useVirtualizedList, type VirtualItem, type MeasureStrategy } from '@/lib/virtualize'

// --- Chat message type ---

type ChatMessage = {
  id: number
  role: 'user' | 'assistant'
  content: string
  reasoning?: string
  toolInvocations?: { toolName: string; state: string; result?: any }[]
}

// --- Measurement strategies for chat components ---

const plugins = defaultPlugins()

function messageStrategy(msg: ChatMessage): MeasureStrategy {
  return {
    kind: 'computed',
    measure: (width) => {
      const contentWidth = msg.role === 'user' ? width * 0.7 - 24 : width - 24
      let height = 16 // padding

      // Reasoning (collapsed by default: 33px + 8px gap)
      if (msg.reasoning) height += 33 + 8

      // Tool invocations (collapsed by default: 33px each + 8px gap each)
      if (msg.toolInvocations?.length) {
        height += msg.toolInvocations.length * (33 + 8)
      }

      // Markdown body via pretext
      if (msg.content) {
        const blocks = parse(msg.content)
        const result = measureBlocks(blocks, {
          maxWidth: contentWidth,
          fonts: defaultConfig.fonts,
          lineHeights: defaultConfig.lineHeights,
          plugins,
        })
        height += result.height
      }

      return height
    },
  }
}

// --- Mock conversation — uses every component type ---

const MOCK_CONVERSATION: ChatMessage[] = [
  {
    id: 1,
    role: 'user',
    content: 'Can you help me set up a REST API with authentication? I need **JWT tokens**, rate limiting, and input validation with `zod`.',
  },
  {
    id: 2,
    role: 'assistant',
    content: "Here's the server with **JWT auth middleware**. The `/login` endpoint returns a token, and `/me` is a *protected route* that requires `Bearer <token>` in the Authorization header.\n\n```typescript\nimport express from 'express'\nimport jwt from 'jsonwebtoken'\n\nconst app = express()\napp.use(express.json())\n\nconst SECRET = process.env.JWT_SECRET\n\nfunction authenticate(req, res, next) {\n  const token = req.headers.authorization?.split(' ')[1]\n  if (!token) return res.status(401).json({ error: 'No token' })\n  req.user = jwt.verify(token, SECRET)\n  next()\n}\n```\n\n- **Rate limiting**: 100 requests per 15 minutes per IP\n- **Input validation**: `zod` schemas for request bodies\n- [CORS](https://example.com) configured for production\n\n> Pretext proved that text measurement can be **pure arithmetic** — zero DOM reads, zero reflows.\n\n---\n\n![Demo video](https://www.youtube.com/watch?v=aqz-KE-bpKQ)\n\n![Architecture diagram](https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80)",
    reasoning: 'The user wants a REST API with auth. Express + JWT is the standard approach. I should scaffold the project structure, install dependencies, create the auth middleware, and show examples of rate limiting and validation.',
    toolInvocations: [
      { toolName: 'createFile', state: 'result', result: { path: 'src/server.ts', lines: 42 } },
      { toolName: 'createFile', state: 'result', result: { path: 'src/auth.ts', lines: 28 } },
      { toolName: 'runCommand', state: 'result', result: { stdout: '+ express@4.18.2\n+ jsonwebtoken@9.0.0\n+ bcrypt@5.1.0\n+ zod@3.22.0\n+ express-rate-limit@7.1.0\nadded 5 packages in 2.1s' } },
    ],
  },
  {
    id: 3,
    role: 'user',
    content: 'What about testing with curl?',
  },
  {
    id: 4,
    role: 'assistant',
    content: "Test with curl:\n\n```bash\n# Login\ncurl -X POST http://localhost:3000/login \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"email\": \"user@test.com\", \"password\": \"password123\"}'\n\n# Protected route\ncurl http://localhost:3000/me \\\n  -H 'Authorization: Bearer <token>'\n```\n\nThe first 100 requests return **401** (no token), then you'll see **429** when the rate limit kicks in.",
    toolInvocations: [
      { toolName: 'runCommand', state: 'result', result: { stdout: '{"token":"eyJhbGciOiJIUzI1NiJ9..."}' } },
    ],
  },
  {
    id: 5,
    role: 'user',
    content: 'Perfect, thanks!',
  },
]

function generateMessages(count: number): ChatMessage[] {
  const msgs: ChatMessage[] = []
  for (let i = 0; i < count; i++) {
    const template = MOCK_CONVERSATION[i % MOCK_CONVERSATION.length]!
    msgs.push({ ...template, id: i })
  }
  return msgs
}

// --- Page ---

export default function PretextMdChatDemo() {
  const [messageCount, setMessageCount] = useState(100)
  const [mounted, setMounted] = useState(false)
  const maxWidth = 600

  useLayoutEffect(() => { setMounted(true) }, [])

  const messages = useMemo(() => generateMessages(messageCount), [messageCount])

  // Convert messages to VirtualItems with measurement strategies
  const virtualItems: VirtualItem<ChatMessage>[] = useMemo(() => {
    if (!mounted) return []
    return messages.map(msg => ({
      id: msg.id,
      strategy: messageStrategy(msg),
      data: msg,
    }))
  }, [messages, mounted])

  const list = useVirtualizedList(virtualItems, 600, maxWidth, 16)
  const { getItemRef } = list
  const fps = useFps()

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">pretext-md chat demo</h1>
          <p className="text-muted-foreground">loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">pretext-md chat demo</h1>
          <p className="text-sm text-muted-foreground">
            Typed virtualization — every component declares a measurement strategy. TypeScript enforces it.
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

        {/* Chat */}
        <div
          ref={list.scrollRef}
          className="border border-border rounded-xl bg-muted/20 overflow-y-auto"
          style={{ height: 600 }}
        >
          {/* Top spacer */}
          <div style={{ height: list.topSpacer }} />

          {/* Visible messages — flow layout */}
          <div className="flex flex-col gap-4 px-4">
            {list.items.map(item => (
              <div key={item.id} ref={getItemRef(item.id)}>
                <ChatMessageRenderer
                  message={item.data}
                  maxWidth={maxWidth}
                />
              </div>
            ))}
          </div>

          {/* Bottom spacer */}
          <div style={{ height: list.bottomSpacer }} />
        </div>
      </div>
    </div>
  )
}

// --- Chat message renderer ---

function ChatMessageRenderer({ message, maxWidth }: {
  message: ChatMessage
  maxWidth: number
}) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`rounded-2xl px-3 py-2 text-sm ${
          isUser ? 'bg-primary text-primary-foreground' : 'w-full'
        }`}
        style={{ maxWidth: isUser ? maxWidth * 0.7 : maxWidth }}
      >
        {message.reasoning && (
          <div className="mb-2">
            <ReasoningBlock reasoning={message.reasoning} />
          </div>
        )}
        {message.toolInvocations?.map((tool, i) => (
          <div key={i} className="mb-2">
            <ToolInvocationBlock invocation={tool} />
          </div>
        ))}
        {message.content && (
          <Markdown content={message.content} maxWidth={isUser ? maxWidth * 0.7 - 24 : undefined} />
        )}
      </div>
    </div>
  )
}

// --- Interactive components — report to parent after state change ---

function ReasoningBlock({ reasoning }: { reasoning: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-muted/50"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
        </svg>
        <span>thought process</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`ml-auto transition-transform ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="px-3 py-2 text-xs text-muted-foreground max-h-[200px] overflow-y-auto border-t border-border/50">
          {reasoning}
        </div>
      )}
    </div>
  )
}

function ToolInvocationBlock({ invocation }: {
  invocation: { toolName: string; state: string; result?: any }
}) {
  const [open, setOpen] = useState(false)
  const isDone = invocation.state === 'result'
  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-muted/50"
      >
        {isDone ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin text-primary">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        )}
        <span className="font-mono">{invocation.toolName}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`ml-auto transition-transform ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && invocation.result && (
        <div className="border-t border-border/50">
          <pre className="px-3 py-2 text-xs text-muted-foreground max-h-[150px] overflow-y-auto">
            {JSON.stringify(invocation.result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

// --- FPS counter ---

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
