'use client'

import { PageLayout } from '@/components/page-layout'
import { Agent } from '@/registry/blocks/agent/agent'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { TocItem } from '@/registry/blocks/table-of-contents/table-of-contents'
import { CodeBlock } from '@/registry/blocks/code-block'
import { AIAssistantDemo } from './registration-demo'

const tocItems: TocItem[] = [
  { id: 'demo', title: 'demo' },
  { id: 'client-tools-source', title: 'client tools source', level: 2 },
  { id: 'image-agent', title: 'image agent', level: 2 },
  { id: 'installation', title: 'installation' },
  { id: 'setup', title: 'setup' },
  { id: 'api-proxy', title: 'api proxy', level: 2 },
  { id: 'env-vars', title: 'environment variables', level: 2 },
  { id: 'usage', title: 'usage' },
]

// =============================================================================
// Image Agent Demo
// =============================================================================

function ImageAgentDemo() {
  return (
    <div className="border rounded-lg overflow-hidden h-[500px]">
      <Agent
        proxyUrl="/api/inference/proxy"
        name="image-agent"
        config={{ agent: 'okaris/shadcn-image@7tfd7xc2' }}
        description="I can generate images from your descriptions"
        examplePrompts={[
          'a cat wearing a top hat',
          'sunset over mountains with a lake',
          'futuristic city at night',
        ]}
        allowFiles={false}
        allowImages={false}
      />
    </div>
  )
}

// =============================================================================
// Main Page
// =============================================================================

export default function AgentDemoPage() {
  return (
    <PageLayout toc={tocItems}>
      <div className="max-w-4xl space-y-12">
        {/* Header */}
        <header className="space-y-4">
          <h1 className="text-3xl font-bold">agent</h1>
          <p className="text-lg text-muted-foreground">
            full-featured agent component powered by{' '}
            <a href="https://inference.sh" className="underline hover:text-foreground">
              inference.sh
            </a>
          </p>
          <p className="text-sm text-muted-foreground">
            agents support 5 tool types: app, agent, webhook, client, and internal tools.{' '}
            <a
              href="https://inference.sh/docs/agents/adding-tools"
              className="underline hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              learn more about tools
            </a>
          </p>
        </header>

        {/* Demo */}
        <section id="demo" className="space-y-4">
          <h2 className="text-2xl font-semibold">demo</h2>
          <p className="text-muted-foreground">
            agents can use client-side tools to help users navigate complex forms.
            this demo shows an assistant that fills out a business registration form using client tools that manipulate React state directly.
          </p>
          <AIAssistantDemo />

          {/* Source Code Tabs */}
          <div id="client-tools-source" className="space-y-3 pt-4">
            <h3 className="text-lg font-medium">source code</h3>
            <p className="text-sm text-muted-foreground">
              client tools read and write React state directly via refs.
            </p>
            <Tabs defaultValue="agent">
              <TabsList className="justify-start flex-wrap h-auto gap-1">
                <TabsTrigger value="agent">agent.tsx</TabsTrigger>
                <TabsTrigger value="demo-tools">demo-tools.ts</TabsTrigger>
              </TabsList>
              <TabsContent value="agent" className="mt-4">
                <CodeBlock language="tsx">
                  {`import { useState, useRef, useMemo } from 'react'
import { Agent } from '@/components/agent'
import { createFormTools, FORM_SYSTEM_PROMPT, type BusinessFormActions } from './demo-tools'

function RegistrationDemo() {
  const [formState, setFormState] = useState(DEFAULT_FORM_STATE)
  const setField = (field, value) => setFormState(prev => ({ ...prev, [field]: value }))
  const addOfficer = (officer) => setFormState(prev => ({
    ...prev, officers: [...prev.officers, officer],
  }))
  // ... other actions

  // Ref always points to latest — tools never see stale closures
  const actionsRef = useRef<BusinessFormActions>(null!)
  actionsRef.current = { getState: () => formState, setField, addOfficer, removeOfficer, setSameAsAgent }

  const tools = useMemo(() => createFormTools(actionsRef), [])

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <RegistrationForm state={formState} setField={setField} ... />
      <Agent
        proxyUrl="/api/inference/proxy"
        name="registration-assistant"
        config={{
          core_app: { ref: 'openrouter/claude-haiku-45@1ps10tmc' },
          system_prompt: FORM_SYSTEM_PROMPT,
          tools,
          example_prompts: ['I want to register an LLC in Delaware'],
        }}
      />
    </div>
  )
}`}
                </CodeBlock>
              </TabsContent>
              <TabsContent value="demo-tools" className="mt-4">
                <CodeBlock language="typescript">
                  {`import type { MutableRefObject } from 'react'
import { tool, string, integer, boolean, enumOf, type ClientTool } from '@inferencesh/sdk'

export interface BusinessFormActions {
  getState: () => BusinessFormState
  setField: (field: string, value: string | boolean) => void
  addOfficer: (officer: Officer) => void
  removeOfficer: (index: number) => void
  setSameAsAgent: (same: boolean) => void
}

export function createFormTools(
  actionsRef: MutableRefObject<BusinessFormActions>,
): ClientTool[] {
  const actions = () => actionsRef.current

  const getForm = tool('get_form')
    .displayName('Get Form')
    .describe('Returns full form state and calculated fees.')
    .handler(async () => JSON.stringify(actions().getState(), null, 2))

  const setField = tool('set_field')
    .displayName('Set Field')
    .describe('Sets a field on the form.')
    .param('field', enumOf([
      'entityType', 'businessName', 'dba', 'naicsCode',
      'stateOfFormation', 'agentName', 'agentAddress', ...
    ] as const, 'The field'))
    .param('value', string('The value'))
    .handler(async ({ field, value }) => {
      actions().setField(field as string, value as string)
      return JSON.stringify({ ok: true, field, value })
    })

  const addOfficer = tool('add_officer')
    .displayName('Add Officer')
    .describe('Adds an officer/director to the registration.')
    .param('name', string('Full legal name'))
    .param('title', string('Title (CEO, President, etc.)'))
    .param('address', string('Business address'))
    .handler(async ({ name, title, address }) => {
      actions().addOfficer({ name, title, address })
      return JSON.stringify({ ok: true })
    })

  return [getForm, setField, setEntityType, setFilingOption, addOfficer, ...]
}`}
                </CodeBlock>
              </TabsContent>
            </Tabs>
          </div>

          {/* Image Agent Demo */}
          <div id="image-agent" className="space-y-3 pt-4">
            <h3 className="text-lg font-medium">image agent</h3>
            <p className="text-sm text-muted-foreground">
              agents can also be used with just a ref - no ad-hoc configuration needed.
              this demo uses a template agent for image generation.
            </p>
            <ImageAgentDemo />
            <CodeBlock language="tsx">
              {`<Agent
  proxyUrl="/api/inference/proxy"
  config={{ agent: 'okaris/shadcn-image@7tfd7xc2' }}
  description="I can generate images from your descriptions"
  examplePrompts={['a cat wearing a top hat']}
/>`}
            </CodeBlock>
          </div>
        </section>

        {/* Installation */}
        <section id="installation" className="space-y-4">
          <h2 className="text-2xl font-semibold">installation</h2>
          <CodeBlock language="bash">
            npx shadcn@latest add https://ui.inference.sh/r/agent.json
          </CodeBlock>
        </section>

        {/* Setup */}
        <section id="setup" className="space-y-6">
          <h2 className="text-2xl font-semibold">setup</h2>

          {/* API Proxy */}
          <div id="api-proxy" className="space-y-3">
            <h3 className="text-lg font-medium">api proxy</h3>
            <p className="text-sm text-muted-foreground">
              add the API proxy route to your Next.js app:
            </p>
            <CodeBlock language="typescript">
              {`// app/api/inference/proxy/route.ts
import { route } from '@inferencesh/sdk/proxy/nextjs';
export const { GET, POST, PUT } = route;`}
            </CodeBlock>
          </div>

          {/* Environment Variables */}
          <div id="env-vars" className="space-y-3">
            <h3 className="text-lg font-medium">environment variables</h3>
            <p className="text-sm text-muted-foreground">
              set your API key in .env.local:
            </p>
            <CodeBlock language="bash">
              {`INFERENCE_API_KEY=inf_...`}
            </CodeBlock>
            <p className="text-sm text-muted-foreground">
              get your API key at{' '}
              <a href="https://app.inference.sh/settings/keys" className="underline hover:text-foreground">
                inference.sh
              </a>
            </p>
          </div>
        </section>

        {/* Usage */}
        <section id="usage" className="space-y-4">
          <h2 className="text-2xl font-semibold">usage</h2>
          <p className="text-sm text-muted-foreground mb-4">
            the simplest way to use the Agent component:
          </p>
          <CodeBlock language="tsx">
            {`import { Agent } from '@/components/infsh/agent/agent'

export function ChatAssistant() {
  return (
    <Agent
      proxyUrl="/api/inference/proxy"
      name="my-assistant"
      config={{
        core_app: { ref: 'openrouter/claude-haiku-45@1ps10tmc' },
        description: 'A helpful AI assistant',
        system_prompt: 'You are helpful and concise.',
        example_prompts: [
          'What can you help me with?',
          'Tell me a joke',
        ],
      }}
    />
  )
}`}
          </CodeBlock>
          <p className="text-sm text-muted-foreground mt-6 mb-4">
            for more control, use the AgentChatProvider with custom chat components and client tools:
          </p>
          <CodeBlock language="tsx">
            {`import { useState, useRef, useMemo } from 'react'
import { Inference } from '@inferencesh/sdk'
import { AgentChatProvider } from '@inferencesh/sdk/agent'
import { ChatContainer, ChatMessages, ChatInput, MessageBubble } from '@/components/infsh/agent'
import { createFormTools, FORM_SYSTEM_PROMPT } from './demo-tools'

function MyAssistant() {
  const [formState, setFormState] = useState(DEFAULT_FORM_STATE)
  // ... build actions (setField, addOfficer, etc.)

  const actionsRef = useRef({ getState: () => formState, setField, ... })
  actionsRef.current = { getState: () => formState, setField, ... }

  const tools = useMemo(() => createFormTools(actionsRef), [])
  const client = useMemo(() => new Inference({ proxyUrl: '/api/inference/proxy' }), [])

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <RegistrationForm state={formState} setField={setField} ... />
      <AgentChatProvider client={client} agentConfig={{
        core_app: { ref: 'openrouter/claude-haiku-45@1ps10tmc' },
        system_prompt: FORM_SYSTEM_PROMPT,
        tools, // Client tools that read/write React state via ref
      }}>
        <ChatContainer>
          <ChatMessages>
            {({ messages }) => messages.map(m => <MessageBubble key={m.id} message={m} />)}
          </ChatMessages>
          <ChatInput />
        </ChatContainer>
      </AgentChatProvider>
    </div>
  )
}`}
          </CodeBlock>
        </section>
      </div>
    </PageLayout>
  )
}
