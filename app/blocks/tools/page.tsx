'use client'

import { PageLayout } from '@/components/page-layout'
import { ToolInvocation } from '@/registry/blocks/tools/tool-invocation'
import type { ToolInvocationDTO } from '@inferencesh/sdk'
import {
  ToolInvocationStatusPending,
  ToolInvocationStatusInProgress,
  ToolInvocationStatusAwaitingApproval,
  ToolInvocationStatusCompleted,
  ToolInvocationStatusFailed,
} from '@/registry/blocks/agent/types'
import { ToolTypeApp } from '@inferencesh/sdk'
import { AgentProvider } from '@/registry/blocks/agent/provider'
import { Inference } from '@inferencesh/sdk'
import { useMemo } from 'react'
import { TaskOutputWrapper } from '@/registry/blocks/task/task-output-wrapper'
import type { TocItem } from '@/registry/blocks/table-of-contents/table-of-contents'
import { CodeBlock } from '@/registry/blocks/code-block/code-block'

const tocItems: TocItem[] = [
  { id: 'tool-states', title: 'tool states' },
  { id: 'app-invocation', title: 'app invocation' },
  { id: 'installation', title: 'installation' },
  { id: 'usage', title: 'usage' },
  { id: 'features', title: 'features' },
]

const usageCode = `import { ToolInvocation } from '@/components/tools/tool-invocation'
import { FinishTool } from '@/components/tools/finish-tool'

// ToolInvocation displays tool calls with collapsible details
<ToolInvocation
  invocation={{
    id: 'tool-1',
    status: 'completed',
    function: {
      name: 'search_web',
      arguments: { query: 'latest news' },
    },
    result: JSON.stringify({ results: ['...'] }),
  }}
  defaultOpen={false}
/>

// FinishTool displays the conversation completion state
<FinishTool
  invocation={{
    id: 'finish',
    status: 'completed',
    function: { name: 'finish', arguments: {} },
  }}
/>`

// Mock tool invocations for demo purposes
const mockInvocations: { id: string; label: string; invocation: Partial<ToolInvocationDTO> }[] = [
  {
    id: 'pending',
    label: 'pending',
    invocation: {
      id: 'tool-1',
      status: ToolInvocationStatusPending,
      function: {
        name: 'search_web',
        arguments: { query: 'latest news about AI' },
      },
    },
  },
  {
    id: 'in-progress',
    label: 'in progress',
    invocation: {
      id: 'tool-2',
      status: ToolInvocationStatusInProgress,
      function: {
        name: 'analyze_data',
        arguments: { dataset: 'sales_2024.csv', columns: ['revenue', 'region'] },
      },
    },
  },
  {
    id: 'completed',
    label: 'completed',
    invocation: {
      id: 'tool-3',
      status: ToolInvocationStatusCompleted,
      function: {
        name: 'get_weather',
        arguments: { location: 'San Francisco, CA' },
      },
      result: JSON.stringify({
        temperature: 68,
        condition: 'Partly Cloudy',
        humidity: 65,
      }),
    },
  },
  {
    id: 'failed',
    label: 'failed',
    invocation: {
      id: 'tool-4',
      status: ToolInvocationStatusFailed,
      function: {
        name: 'fetch_api',
        arguments: { url: 'https://api.example.com/data' },
      },
      result: 'Error: Connection timeout after 30s',
    },
  },
  {
    id: 'approval',
    label: 'awaiting approval',
    invocation: {
      id: 'tool-6',
      status: ToolInvocationStatusAwaitingApproval,
      function: {
        name: 'delete_file',
        arguments: { path: '/data/old_backup.zip' },
      },
    },
  },
  {
    id: 'widget',
    label: 'with widget',
    invocation: {
      id: 'tool-5',
      status: ToolInvocationStatusCompleted,
      function: {
        name: 'generate_chart',
        arguments: { type: 'bar', data: [10, 20, 30] },
      },
      widget: {
        type: 'ui',
        title: 'Sales Chart',
        children: [
          { type: 'text', value: 'Generated bar chart with 3 data points' },
          { type: 'badge', label: 'chart ready', variant: 'secondary' },
        ],
      },
    },
  },
]

// Wrapper that provides mock context
function ToolInvocationDemo({ invocation, defaultOpen = false }: { invocation: Partial<ToolInvocationDTO>; defaultOpen?: boolean }) {
  const mockClient = useMemo(() => {
    return new Inference({ proxyUrl: '/api/inference/proxy' })
  }, [])

  return (
    <AgentProvider
      client={mockClient}
      config={{
        core_app: { ref: 'demo/mock@demo' },
        description: 'Demo agent',
      }}
    >
      <ToolInvocation invocation={invocation as ToolInvocationDTO} defaultOpen={defaultOpen} />
    </AgentProvider>
  )
}

// Wrapper for standalone TaskOutputWrapper demo
function TaskOutputWrapperDemo({ taskId, compact = false }: { taskId: string; compact?: boolean }) {
  const client = useMemo(() => {
    return new Inference({ proxyUrl: '/api/inference/proxy' })
  }, [])

  return (
    <AgentProvider
      client={client}
      config={{
        core_app: { ref: 'demo/mock@demo' },
        description: 'Demo agent',
      }}
    >
      <TaskOutputWrapper taskId={taskId} compact={compact} />
    </AgentProvider>
  )
}



export default function ToolUIDemoPage() {
  return (
    <PageLayout toc={tocItems}>
      <div className="max-w-4xl space-y-12">
        {/* Header */}
        <header className="space-y-4">
          <h1 className="text-3xl font-bold">tool invocation ui</h1>
          <p className="text-lg text-muted-foreground">
            displays tool lifecycle: pending, in-progress, approval, and results.
          </p>
        </header>

        {/* Tool States - Collapsible */}
        <section id="tool-states" className="space-y-6">
          <h2 className="text-2xl font-semibold">tool states</h2>
          <p className="text-muted-foreground">
            click to expand/collapse. first example is open by default.
          </p>

          <div className="space-y-4">
            {mockInvocations.map(({ id, label, invocation }, index) => (
              <div key={id} className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 border-b">
                  <h3 className="text-sm font-medium">{label}</h3>
                  <p className="text-xs text-muted-foreground">
                    status: <code>{invocation.status}</code>
                  </p>
                </div>
                <div className="p-4">
                  <ToolInvocationDemo invocation={invocation} defaultOpen={index === 0} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* App Invocation Demo */}
        <section id="app-invocation" className="space-y-6">
          <h2 className="text-2xl font-semibold">app invocation</h2>
          <p className="text-muted-foreground">
            tools can invoke inference apps, displaying real-time task output with streaming support.
          </p>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 border-b">
              <h3 className="text-sm font-medium">live app invocation</h3>
              <p className="text-xs text-muted-foreground">
                compact task output with streaming status
              </p>
            </div>
            <div className="p-4">
              <ToolInvocationDemo
                invocation={{
                  id: 'tool-app-1',
                  type: ToolTypeApp,
                  status: ToolInvocationStatusCompleted,
                  function: {
                    name: 'run_app',
                    arguments: { app: 'inference-sh/hello-world', input: { prompt: 'hello' } },
                  },
                  execution_id: '5rczn5xbw36dk9rr4h37n9sajz',
                }}
                defaultOpen={true}
              />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 border-b">
              <h3 className="text-sm font-medium">standalone task output (compact)</h3>
              <p className="text-xs text-muted-foreground">
                can also be used directly without tool wrapper
              </p>
            </div>
            <div className="p-4">
              <TaskOutputWrapperDemo taskId="5rczn5xbw36dk9rr4h37n9sajz" compact />
            </div>
          </div>
        </section>

        {/* Installation */}
        <section id="installation" className="space-y-4">
          <h2 className="text-2xl font-semibold">installation</h2>
          <CodeBlock language="bash">
            npx shadcn@latest add https://ui.inference.sh/r/tools.json
          </CodeBlock>
        </section>

        {/* Usage */}
        <section id="usage" className="space-y-4">
          <h2 className="text-2xl font-semibold">usage</h2>
          <CodeBlock language="tsx">{usageCode}</CodeBlock>
        </section>

        {/* Features */}
        <section id="features" className="space-y-4">
          <h2 className="text-2xl font-semibold">features</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>collapsible tool details with arguments and results</li>
            <li>status indicators: pending, running, completed, failed</li>
            <li>human-in-the-loop approval ui for sensitive operations</li>
            <li>widget rendering for structured tool outputs</li>
            <li>finish tool display for conversation completion</li>
          </ul>
        </section>
      </div>
    </PageLayout>
  )
}
