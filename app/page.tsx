"use client"

import * as React from "react"
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
  Palette,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageLayout } from "@/components/page-layout"
import { CodeBlock } from "@/registry/blocks/code-block/code-block"
import { Steps, Step, StepTitle, StepContent } from "@/registry/blocks/steps/steps"
import { WidgetRenderer } from "@/registry/blocks/widgets/widget-renderer"
import type { Widget, WidgetAction, WidgetFormData } from "@/registry/blocks/widgets/types"
import type { TocItem } from "@/registry/blocks/table-of-contents/table-of-contents"
import { cn } from "@/lib/utils"

const tocItems: TocItem[] = [
  { id: "hero", title: "overview" },
  { id: "examples", title: "examples" },
  { id: "showcase", title: "showcase" },
  { id: "components", title: "components" },
  { id: "quick-start", title: "quick start" },
]

const components = [
  {
    name: "agent",
    title: "agent chat",
    description: "full-featured agent chat with streaming, tools, and widgets.",
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
    core_app: { ref: 'openrouter/claude-haiku-45@0fkg6xwb' },
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
    { icon: Zap, label: "streaming" },
    { icon: Wrench, label: "tool support" },
    { icon: Puzzle, label: "widgets" },
    { icon: Shield, label: "type safe" },
    { icon: Code2, label: "open source" },
    { icon: Palette, label: "themeable" },
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
              the foundation for
              <br />
              <span className="bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60 bg-clip-text">ai chat interfaces</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              a set of beautifully designed components for building ai-powered chat applications.
              copy and paste into your apps. open source. open code.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <Link href="/blocks/agent">
                get started
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

        {/* examples section with tabs */}
        <section id="examples" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">examples</h2>
            <p className="text-muted-foreground">
              interactive demos showcasing the widget renderer.
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
              widget examples powered by declarative json.
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
              everything you need to build ai-powered chat interfaces.
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
              get up and running in minutes.
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
