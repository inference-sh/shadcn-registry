"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, MessageSquare, FileText, Puzzle, Wrench, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageLayout } from "@/components/page-layout"
import { CodeBlock } from "@/registry/blocks/code-block/code-block"
import { Steps, Step, StepTitle, StepContent } from "@/registry/blocks/steps/steps"
import type { TocItem } from "@/registry/blocks/table-of-contents/table-of-contents"

const tocItems: TocItem[] = [
  { id: "hero", title: "overview" },
  { id: "install", title: "install" },
  { id: "featured", title: "featured" },
  { id: "components", title: "components" },
  { id: "quick-start", title: "quick start" },
]

const proxyCode = `// app/api/inference/proxy/route.ts
import { route } from '@inferencesh/sdk/proxy/nextjs';
export const { GET, POST, PUT } = route;`

const usageCode = `<Agent
  proxyUrl="/api/inference/proxy"
  agentConfig={{
    core_app_ref: 'openrouter/claude-haiku-45@0fkg6xwb',
    description: 'a helpful ai assistant',
    system_prompt: 'you are helpful.',
  }}
/>`

const components = [
  {
    name: "agent",
    title: "agent chat",
    description: "full-featured agent chat component with all primitives wired together.",
    href: "/blocks/agent",
    icon: MessageSquare,
    featured: true,
  },
  {
    name: "chat",
    title: "chat ui",
    description: "visual building blocks: chat container, messages, input, and status indicators.",
    href: "/blocks/chat",
    icon: MessageSquare,
  },
  {
    name: "markdown",
    title: "markdown",
    description: "high-fidelity markdown with code blocks, youtube embeds, and zoomable images.",
    href: "/blocks/markdown",
    icon: FileText,
  },
  {
    name: "widgets",
    title: "widgets",
    description: "renders declarative ui nodes (forms, buttons, cards) from agent tool outputs.",
    href: "/blocks/widgets",
    icon: Puzzle,
  },
  {
    name: "tools",
    title: "tool ui",
    description: "displays tool lifecycle: pending, in-progress, approval, and results.",
    href: "/blocks/tools",
    icon: Wrench,
  },
  {
    name: "task",
    title: "task",
    description: "real-time task output display with streaming support and status indicators.",
    href: "/blocks/task",
    icon: Activity,
  },
]

export default function Home() {
  return (
    <PageLayout toc={tocItems}>
      <div className="max-w-4xl space-y-12">
        {/* hero section */}
        <section id="hero" className="space-y-6">
          <Badge variant="secondary" className="rounded-full px-4">
            open source
          </Badge>
          <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-4xl lg:text-5xl">
            build ai chat interfaces
            <br className="hidden sm:inline" />
            with shadcn/ui components
          </h1>
          <p className="text-lg text-muted-foreground">
            drop-in agent chat, markdown rendering, tool ui, and more.
            beautifully designed components that you can copy and paste into your apps.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/blocks/agent">
                get started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="https://github.com/inference-sh/shadcn-registry" target="_blank" rel="noopener noreferrer">
                github
              </Link>
            </Button>
          </div>
        </section>

        {/* install command */}
        <section id="install" className="space-y-4">
          <h2 className="text-2xl font-semibold">install</h2>
          <CodeBlock language="bash">
            npx shadcn@latest add https://ui.inference.sh/r/agent.json
          </CodeBlock>
        </section>

        {/* featured component */}
        <section id="featured" className="space-y-4">
          <h2 className="text-2xl font-semibold">featured</h2>
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold">agent chat</h3>
                  <Badge>featured</Badge>
                </div>
                <p className="text-muted-foreground">
                  full-featured agent chat component with all primitives wired together.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-4 sm:flex-row">
              <Button asChild>
                <Link href="/blocks/agent">
                  try live demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* components grid */}
        <section id="components" className="space-y-4">
          <h2 className="text-2xl font-semibold">components</h2>
          <p className="text-muted-foreground">
            everything you need to build ai-powered chat interfaces.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {components.filter(c => !c.featured).map((component) => (
              <div
                key={component.name}
                className="group relative rounded-lg border p-5 hover:border-foreground/25 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-muted p-2">
                    <component.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold">{component.title}</h3>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {component.description}
                </p>
                {component.href && (
                  <div className="mt-4">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={component.href}>
                        demo
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* quick start */}
        <section id="quick-start" className="space-y-4">
          <h2 className="text-2xl font-semibold">quick start</h2>
          <p className="text-muted-foreground">
            get up and running in minutes.
          </p>
          <Steps>
            <Step>
              <StepTitle>install the agent chat component</StepTitle>
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
