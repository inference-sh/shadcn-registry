"use client"

import * as React from "react"
import { useRef, useMemo } from "react"
import Link from "next/link"
import {
  ArrowRight,
  MessageSquare,
  FileText,
  Puzzle,
  Wrench,
  Activity,
  Copy,
  Check,
  Bot,
  Zap,
  Shield,
  Code2,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageLayout } from "@/components/page-layout"
import { CodeBlock } from "@/registry/blocks/code-block/code-block"
import { Steps, Step, StepTitle, StepContent } from "@/registry/blocks/steps/steps"
import { WidgetRenderer } from "@/registry/blocks/widgets/widget-renderer"
import type { Widget, WidgetAction, WidgetFormData } from "@/registry/blocks/widgets/types"
import type { TocItem } from "@/registry/blocks/table-of-contents/table-of-contents"
import { cn } from "@/lib/utils"
import { Agent } from "@/registry/blocks/agent/agent"
import { createScopedTools, FORM_ASSISTANT_PROMPT } from "./blocks/agent/lib/client-tools"

const tocItems: TocItem[] = [
  { id: "hero", title: "overview" },
  { id: "live-demo", title: "live demo" },
  { id: "examples", title: "examples" },
  { id: "showcase", title: "showcase" },
  { id: "components", title: "components" },
  { id: "quick-start", title: "quick start" },
]

const components = [
  {
    name: "agent",
    title: "agent",
    description: "one component. runtime included. tools, streaming, approvals, widgets.",
    href: "/blocks/agent",
    icon: Bot,
    featured: true,
  },
  {
    name: "chat",
    title: "chat ui",
    description: "building blocks: container, messages, input, and indicators.",
    href: "/blocks/chat",
    icon: MessageSquare,
  },
  {
    name: "markdown",
    title: "markdown",
    description: "rich markdown with syntax highlighting and embeds.",
    href: "/blocks/markdown",
    icon: FileText,
  },
  {
    name: "widgets",
    title: "widgets",
    description: "declarative ui from json - forms, buttons, cards.",
    href: "/blocks/widgets",
    icon: Puzzle,
  },
  {
    name: "tools",
    title: "tool ui",
    description: "tool lifecycle: pending, progress, approval, results.",
    href: "/blocks/tools",
    icon: Wrench,
  },
  {
    name: "task",
    title: "task output",
    description: "real-time task display with streaming support.",
    href: "/blocks/task",
    icon: Activity,
  },
]

const proxyCode = `// app/api/inference/proxy/route.ts
import { route } from '@inferencesh/sdk/proxy/nextjs';
export const { GET, POST, PUT } = route;`

const usageCode = `<Agent
  proxyUrl="/api/inference/proxy"
  agentConfig={{
    core_app: { ref: 'openrouter/claude-haiku-45@1ps10tmc' },
    description: 'a helpful ai assistant',
    system_prompt: 'you are helpful.',
  }}
/>`

// copy button component
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false)

  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="outline" size="sm" onClick={copy} className="h-7 px-2">
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </Button>
  )
}

// feature badges
function FeatureBadges() {
  const features = [
    { icon: Zap, label: "instant start" },
    { icon: Activity, label: "runtime included" },
    { icon: Wrench, label: "tool lifecycle" },
    { icon: Shield, label: "human-in-the-loop" },
    { icon: Puzzle, label: "widgets" },
    { icon: Code2, label: "open source" },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {features.map((feature) => (
        <div key={feature.label} className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs">
          <feature.icon className="h-3 w-3 text-muted-foreground" />
          <span>{feature.label}</span>
        </div>
      ))}
    </div>
  )
}

// pricing form for live demo
function PricingForm({ formRef }: { formRef: React.RefObject<HTMLFormElement | null> }) {
  const [plan, setPlan] = React.useState('pro')
  const [seats, setSeats] = React.useState('5')
  const [billing, setBilling] = React.useState('monthly')
  const [addons, setAddons] = React.useState({ support: false, analytics: true, api: false })

  const basePrice = plan === 'starter' ? 9 : plan === 'pro' ? 29 : 99
  const seatCount = parseInt(seats) || 1
  const billingMultiplier = billing === 'yearly' ? 10 : 1
  const addonPrice = (addons.support ? 19 : 0) + (addons.analytics ? 9 : 0) + (addons.api ? 49 : 0)
  const total = (basePrice * seatCount + addonPrice) * billingMultiplier

  return (
    <form
      ref={formRef}
      role="form"
      aria-label="Pricing Configuration Form"
      className="space-y-6 p-6 border rounded-lg bg-card"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
        <h3 className="font-semibold" id="form-title">Pricing Configurator</h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="plan">Plan</Label>
          <select
            id="plan"
            name="plan"
            aria-label="Select pricing plan"
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="w-full h-10 px-3 rounded-md border bg-background"
          >
            <option value="starter">Starter ($9/seat/mo)</option>
            <option value="pro">Pro ($29/seat/mo)</option>
            <option value="enterprise">Enterprise ($99/seat/mo)</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="seats">Number of Seats</Label>
          <Input
            id="seats"
            name="seats"
            type="number"
            min="1"
            max="100"
            aria-label="Number of user seats"
            value={seats}
            onChange={(e) => setSeats(e.target.value)}
          />
        </div>
      </div>

      <fieldset className="space-y-2" role="radiogroup" aria-label="Billing cycle selection">
        <legend className="text-sm font-medium">Billing Cycle</legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="billing"
              value="monthly"
              aria-label="Monthly billing"
              checked={billing === 'monthly'}
              onChange={(e) => setBilling(e.target.value)}
              className="rounded"
            />
            <span className="text-sm">Monthly</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="billing"
              value="yearly"
              aria-label="Yearly billing with 2 months free discount"
              checked={billing === 'yearly'}
              onChange={(e) => setBilling(e.target.value)}
              className="rounded"
            />
            <span className="text-sm">Yearly (2 months free)</span>
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-2" role="group" aria-label="Optional add-ons">
        <legend className="text-sm font-medium">Add-ons</legend>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="addon_support"
              aria-label="Priority Support add-on for $19 per month"
              checked={addons.support}
              onChange={(e) => setAddons({ ...addons, support: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Priority Support (+$19/mo)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="addon_analytics"
              aria-label="Advanced Analytics add-on for $9 per month"
              checked={addons.analytics}
              onChange={(e) => setAddons({ ...addons, analytics: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Advanced Analytics (+$9/mo)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="addon_api"
              aria-label="API Access add-on for $49 per month"
              checked={addons.api}
              onChange={(e) => setAddons({ ...addons, api: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">API Access (+$49/mo)</span>
          </label>
        </div>
      </fieldset>

      <div className="pt-4 border-t" role="status" aria-live="polite" aria-label="Price summary">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Estimated Total</span>
          <span className="text-2xl font-bold" aria-label={`Total price: $${total.toLocaleString()} per ${billing === 'yearly' ? 'year' : 'month'}`}>
            ${total.toLocaleString()}/{billing === 'yearly' ? 'yr' : 'mo'}
          </span>
        </div>
      </div>
    </form>
  )
}

// live demo component
function LiveDemo() {
  const formRef = useRef<HTMLFormElement>(null)

  const scopedTools = useMemo(
    () => createScopedTools(formRef),
    []
  )

  const systemPrompt = FORM_ASSISTANT_PROMPT + `\n\n## Current Form Context

You are helping users configure a SaaS pricing plan. The form contains:

### Plan Selection (dropdown: "plan")
- **starter**: $9/seat/month - Basic tier
- **pro**: $29/seat/month - Most popular
- **enterprise**: $99/seat/month - Full features

### Number of Seats (input: "seats")
- Numeric input from 1-100
- Multiplies the per-seat price

### Billing Cycle (radio: "billing")
- **monthly**: Pay monthly
- **yearly**: Pay annually (saves 2 months - 10 months price for 12 months)

### Add-ons (checkboxes)
- **addon_support**: Priority Support (+$19/mo)
- **addon_analytics**: Advanced Analytics (+$9/mo)
- **addon_api**: API Access (+$49/mo)

## Instructions

1. When asked to configure the form, ALWAYS start with \`scan_ui\` to see current state
2. Use \`fill_field\` with the field name (e.g., "plan", "seats", "billing", "addon_support")
3. For the cheapest option: starter plan, 1 seat, yearly billing, no add-ons
4. For radio buttons, use the value (e.g., fill_field("billing", "yearly"))
5. For checkboxes, use "true"/"false" or "checked"/"unchecked"
6. After making changes, briefly confirm what you did
7. Be concise - users want quick help, not lengthy explanations`

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <PricingForm formRef={formRef} />
      <div className="border rounded-lg overflow-hidden h-[500px]">
        <Agent
          proxyUrl="/api/inference/proxy"
          name="pricing-assistant"
          allowFiles={false}
          allowImages={false}
          config={{
            core_app: { ref: 'openrouter/claude-haiku-45@1ps10tmc' },
            description: 'I can help configure your pricing plan',
            system_prompt: systemPrompt,
            tools: scopedTools,
            example_prompts: [
              'set me up with the cheapest option',
              'i need 10 seats with API access',
              'switch to yearly billing',
            ],
          }}
        />
      </div>
    </div>
  )
}

// actual widget examples from the codebase
const flightTrackerWidget: Widget = {
  type: 'ui',
  children: [
    {
      type: 'box', background: 'gradient-ocean', padding: 4, radius: 'lg', children: [
        {
          type: 'row', justify: 'between', align: 'start', children: [
            {
              type: 'col', gap: 1, children: [
                { type: 'caption', value: 'departure' },
                { type: 'title', value: 'SFO', size: '2xl', weight: 'bold' },
                { type: 'text', value: 'san francisco' },
              ]
            },
            {
              type: 'col', gap: 1, align: 'center', children: [
                { type: 'icon', iconName: '✈️', size: 'lg' },
                { type: 'caption', value: '5h 45m' },
                { type: 'badge', label: 'on time', variant: 'secondary' },
              ]
            },
            {
              type: 'col', gap: 1, align: 'end', children: [
                { type: 'caption', value: 'arrival' },
                { type: 'title', value: 'JFK', size: '2xl', weight: 'bold' },
                { type: 'text', value: 'new york' },
              ]
            },
          ]
        },
      ]
    },
  ],
}

const weatherWidget: Widget = {
  type: 'ui',
  children: [
    {
      type: 'box', background: 'gradient-cool', padding: 4, radius: 'lg', children: [
        {
          type: 'row', justify: 'between', align: 'start', children: [
            {
              type: 'col', gap: 1, children: [
                { type: 'title', value: 'san francisco', size: 'lg' },
                { type: 'caption', value: 'partly cloudy' },
                { type: 'title', value: '68°', size: '3xl', weight: 'bold' },
              ]
            },
            {
              type: 'col', align: 'end', gap: 1, children: [
                { type: 'icon', iconName: '⛅', size: 'lg' },
                { type: 'caption', value: 'H: 72° L: 58°' },
              ]
            },
          ]
        },
      ]
    },
  ],
}

const taskChecklistWidget: Widget = {
  type: 'ui',
  title: 'today\'s tasks',
  children: [
    {
      type: 'col', gap: 2, children: [
        { type: 'checkbox', name: 'task1', label: 'review pull requests', defaultChecked: true },
        { type: 'checkbox', name: 'task2', label: 'deploy to staging', defaultChecked: true },
        { type: 'checkbox', name: 'task3', label: 'write documentation' },
        { type: 'checkbox', name: 'task4', label: 'team standup at 10am' },
        { type: 'divider' },
        {
          type: 'row', gap: 2, justify: 'end', children: [
            { type: 'button', label: 'add task', variant: 'outline', onClickAction: { type: 'add-task' } },
            { type: 'button', label: 'mark all done', variant: 'default', onClickAction: { type: 'complete-all' } },
          ]
        },
      ]
    },
  ],
}

const shoppingCartWidget: Widget = {
  type: 'ui',
  title: 'your order',
  children: [
    {
      type: 'col', gap: 3, children: [
        {
          type: 'row', gap: 3, align: 'center', children: [
            { type: 'image', src: 'https://picsum.photos/seed/boba1/60/60', alt: 'item', width: 48, height: 48 },
            {
              type: 'col', gap: 0, children: [
                { type: 'text', value: 'brown sugar latte', variant: 'bold' },
                { type: 'caption', value: 'large • oat milk • less ice' },
              ]
            },
            { type: 'text', value: '$6.50' },
          ]
        },
        {
          type: 'row', gap: 3, align: 'center', children: [
            { type: 'image', src: 'https://picsum.photos/seed/boba2/60/60', alt: 'item', width: 48, height: 48 },
            {
              type: 'col', gap: 0, children: [
                { type: 'text', value: 'taro milk tea', variant: 'bold' },
                { type: 'caption', value: 'medium • regular sugar' },
              ]
            },
            { type: 'text', value: '$5.75' },
          ]
        },
        { type: 'divider' },
        {
          type: 'row', justify: 'between', children: [
            { type: 'caption', value: 'subtotal' },
            { type: 'text', value: '$12.25' },
          ]
        },
        {
          type: 'row', justify: 'between', children: [
            { type: 'caption', value: 'tax' },
            { type: 'text', value: '$1.07' },
          ]
        },
        {
          type: 'row', justify: 'between', children: [
            { type: 'text', value: 'total', variant: 'bold' },
            { type: 'title', value: '$13.32', size: 'lg', weight: 'bold' },
          ]
        },
        { type: 'button', label: 'place order', variant: 'default', onClickAction: { type: 'place-order' } },
      ]
    },
  ],
}

const feedbackFormWidget: Widget = {
  type: 'ui',
  title: 'quick feedback',
  asForm: true,
  children: [
    {
      type: 'col', gap: 3, children: [
        {
          type: 'col', gap: 2, children: [
            { type: 'label', value: 'how was your experience?', fieldName: 'rating' },
            {
              type: 'select', name: 'rating', placeholder: 'select rating', options: [
                { value: '5', label: '⭐⭐⭐⭐⭐ excellent' },
                { value: '4', label: '⭐⭐⭐⭐ good' },
                { value: '3', label: '⭐⭐⭐ average' },
                { value: '2', label: '⭐⭐ poor' },
                { value: '1', label: '⭐ very poor' },
              ],
            },
          ]
        },
        {
          type: 'col', gap: 2, children: [
            { type: 'label', value: 'comments', fieldName: 'comments' },
            { type: 'textarea', name: 'comments', placeholder: 'share your thoughts...' },
          ]
        },
        {
          type: 'row', gap: 2, justify: 'end', children: [
            { type: 'button', label: 'skip', variant: 'ghost', onClickAction: { type: 'skip' } },
            { type: 'button', label: 'submit', variant: 'default', onClickAction: { type: 'submit-feedback' } },
          ]
        },
      ]
    },
  ],
}

// gallery widgets
const galleryWidgets: Widget[] = [
  // stock ticker
  {
    type: 'ui',
    children: [
      {
        type: 'box', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', padding: 4, radius: 'lg', children: [
          {
            type: 'row', justify: 'between', align: 'center', children: [
              {
                type: 'col', gap: 0, children: [
                  { type: 'caption', value: 'AAPL' },
                  { type: 'title', value: '$178.72', size: 'xl', weight: 'bold' },
                ]
              },
              { type: 'badge', label: '+2.4%', variant: 'secondary' },
            ]
          },
          { type: 'caption', value: 'apple inc. • nasdaq' },
        ]
      },
    ],
  },
  // music player
  {
    type: 'ui',
    children: [
      {
        type: 'box', background: 'gradient-purple', padding: 4, radius: 'lg', children: [
          {
            type: 'row', gap: 3, align: 'center', children: [
              { type: 'image', src: 'https://picsum.photos/seed/album/60/60', alt: 'album', width: 48, height: 48 },
              {
                type: 'col', gap: 0, children: [
                  { type: 'text', value: 'blinding lights', variant: 'bold' },
                  { type: 'caption', value: 'the weeknd' },
                ]
              },
            ]
          },
          {
            type: 'row', justify: 'center', gap: 3, children: [
              { type: 'button', label: '⏮', variant: 'ghost', onClickAction: { type: 'prev' } },
              { type: 'button', label: '▶', variant: 'secondary', onClickAction: { type: 'play' } },
              { type: 'button', label: '⏭', variant: 'ghost', onClickAction: { type: 'next' } },
            ]
          },
        ]
      },
    ],
  },
  // timer
  {
    type: 'ui',
    children: [
      {
        type: 'box', background: 'gradient-midnight', padding: 4, radius: 'lg', children: [
          {
            type: 'col', align: 'center', gap: 2, children: [
              { type: 'caption', value: 'focus time' },
              { type: 'title', value: '24:59', size: '3xl', weight: 'bold' },
              {
                type: 'row', gap: 2, children: [
                  { type: 'button', label: 'pause', variant: 'outline', onClickAction: { type: 'pause' } },
                  { type: 'button', label: 'reset', variant: 'ghost', onClickAction: { type: 'reset' } },
                ]
              },
            ]
          },
        ]
      },
    ],
  },
  // payment success
  {
    type: 'ui',
    children: [
      {
        type: 'box', background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', padding: 4, radius: 'lg', children: [
          {
            type: 'col', align: 'center', gap: 2, children: [
              { type: 'icon', iconName: '✓', size: 'lg' },
              { type: 'title', value: 'payment sent', size: 'lg', weight: 'bold' },
              { type: 'title', value: '$250.00', size: '2xl', weight: 'bold' },
            ]
          },
        ]
      },
    ],
  },
]

export default function Home() {
  const installCmd = "npx shadcn@latest add https://ui.inference.sh/r/agent.json"

  const handleAction = (action: WidgetAction, formData?: WidgetFormData) => {
    console.log('action:', action, formData)
  }

  return (
    <PageLayout toc={tocItems}>
      <div className="max-w-5xl space-y-16">
        {/* hero section */}
        <section id="hero" className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-0.5 text-xs">
                open source
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-0.5 text-xs">
                shadcn/ui compatible
              </Badge>
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl">
              drop in an agent.
              <br />
              <span className="bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60 bg-clip-text">ship it.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              the only batteries-included agent component. tools, streaming, approvals, widgets —
              all wired to a runtime that handles the hard parts. not a chat template. a complete solution.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <Link href="/blocks/agent">
                try it
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="https://github.com/inference-sh/shadcn-registry" target="_blank" rel="noopener noreferrer">
                github
              </Link>
            </Button>
          </div>

          {/* install command */}
          <div className="flex items-center gap-2 bg-muted/50 border rounded-lg p-2 max-w-xl">
            <code className="flex-1 text-sm font-mono px-2 truncate">
              {installCmd}
            </code>
            <CopyButton text={installCmd} />
          </div>

          {/* feature badges */}
          <FeatureBadges />
        </section>

        {/* live demo section */}
        <section id="live-demo" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">try it</h2>
            <p className="text-muted-foreground">
              an agent with client-side tools. it can read and fill the form. no backend required for the tools.
            </p>
          </div>
          <LiveDemo />
        </section>

        {/* examples section with tabs */}
        <section id="examples" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">examples</h2>
            <p className="text-muted-foreground">
              agents return structured output. the widget renderer turns it into interactive ui.
            </p>
          </div>

          <Tabs defaultValue="widgets" className="w-full">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <TabsList className="grid w-full grid-cols-3 max-w-sm">
                <TabsTrigger value="widgets">widgets</TabsTrigger>
                <TabsTrigger value="forms">forms</TabsTrigger>
                <TabsTrigger value="data">data</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="widgets" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <WidgetRenderer widget={flightTrackerWidget} onAction={handleAction} />
                <WidgetRenderer widget={weatherWidget} onAction={handleAction} />
              </div>
            </TabsContent>

            <TabsContent value="forms" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <WidgetRenderer widget={taskChecklistWidget} onAction={handleAction} />
                <WidgetRenderer widget={feedbackFormWidget} onAction={handleAction} />
              </div>
            </TabsContent>

            <TabsContent value="data" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <WidgetRenderer widget={shoppingCartWidget} onAction={handleAction} />
                <WidgetRenderer widget={taskChecklistWidget} onAction={handleAction} />
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* showcase section */}
        <section id="showcase" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">showcase</h2>
            <p className="text-muted-foreground">
              rich interfaces from json. no custom components needed.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {galleryWidgets.map((widget, idx) => (
              <WidgetRenderer key={idx} widget={widget} onAction={handleAction} />
            ))}
          </div>
        </section>

        {/* components grid */}
        <section id="components" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">components</h2>
            <p className="text-muted-foreground">
              agent-native ui. tools, approvals, widgets — built in, not bolted on.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {components.map((component) => (
              <Link
                key={component.name}
                href={component.href}
                className="group relative rounded-xl border bg-card p-5 hover:border-foreground/25 hover:shadow-md transition-all"
              >
                {component.featured && (
                  <Badge className="absolute -top-2 -right-2 text-xs">featured</Badge>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn(
                    "rounded-lg p-2",
                    component.featured ? "bg-primary/10" : "bg-muted"
                  )}>
                    <component.icon className={cn(
                      "h-5 w-5",
                      component.featured ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <h3 className="font-semibold">{component.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {component.description}
                </p>
                <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  view component
                  <ArrowRight className="ml-1 h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* quick start */}
        <section id="quick-start" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">quick start</h2>
            <p className="text-muted-foreground">
              one component. four steps. production-ready agent ui.
            </p>
          </div>

          <Steps>
            <Step>
              <StepTitle>install the agent component</StepTitle>
              <StepContent>
                <CodeBlock language="bash">
                  npx shadcn@latest add https://ui.inference.sh/r/agent.json
                </CodeBlock>
              </StepContent>
            </Step>

            <Step>
              <StepTitle>add the api proxy route</StepTitle>
              <StepContent>
                <CodeBlock language="typescript">{proxyCode}</CodeBlock>
              </StepContent>
            </Step>

            <Step>
              <StepTitle>set your api key</StepTitle>
              <StepContent>
                <CodeBlock language="bash">INFERENCE_API_KEY=inf_...</CodeBlock>
              </StepContent>
            </Step>

            <Step>
              <StepTitle>use the component</StepTitle>
              <StepContent>
                <CodeBlock language="tsx">{usageCode}</CodeBlock>
              </StepContent>
            </Step>
          </Steps>
        </section>

        {/* footer */}
        <footer className="border-t pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-center text-sm text-muted-foreground">
              built with{" "}
              <a href="https://ui.shadcn.com" className="font-medium underline underline-offset-4 hover:text-foreground">
                shadcn/ui
              </a>
            </p>
            <p className="text-center text-sm text-muted-foreground">
              powered by{" "}
              <a href="https://inference.sh" className="font-medium underline underline-offset-4 hover:text-foreground logo">
                inference.sh
              </a>
            </p>
          </div>
        </footer>
      </div>
    </PageLayout>
  )
}
