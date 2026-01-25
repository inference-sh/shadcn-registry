'use client'

import { PageLayout } from '@/components/page-layout'
import { TaskOutputWrapper } from '@/registry/blocks/task/task-output-wrapper'
import { TaskOutput } from '@/registry/blocks/task/task-output'
import { StatusPillSimple } from '@/registry/blocks/task/task-status'
import { TimeSince } from '@/registry/blocks/task/time-since'
import { Inference, TaskStatusCompleted, TaskStatusRunning, TaskStatusFailed, TaskStatusQueued } from '@inferencesh/sdk'
import type { TaskDTO as Task } from '@inferencesh/sdk'
import { useMemo, useState } from 'react'
import type { TocItem } from '@/registry/blocks/table-of-contents/table-of-contents'
import { CodeBlock } from '@/registry/blocks/code-block/code-block'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const tocItems: TocItem[] = [
  { id: 'live-demo', title: 'live demo' },
  { id: 'components', title: 'components' },
  { id: 'installation', title: 'installation' },
  { id: 'usage', title: 'usage' },
  { id: 'features', title: 'features' },
]

const usageCode = `import { TaskOutputWrapper } from '@/components/infsh/task/task-output-wrapper'
import { Inference } from '@inferencesh/sdk'

// Create a client
const client = new Inference({ apiKey: 'your-key' })
// Or use proxy for frontend apps
const client = new Inference({ proxyUrl: '/api/inference/proxy' })

// Display task output with automatic streaming
<TaskOutputWrapper
  client={client}
  taskId="your-task-id"
  onComplete={(task) => console.log('Task done:', task)}
/>`

const hookUsageCode = `import { useTask } from '@/hooks/use-task'
import { TaskOutput } from '@/components/infsh/task/task-output'

function MyComponent({ taskId }: { taskId: string }) {
  const { task, isLoading, isStreaming } = useTask({
    client,
    taskId,
    onUpdate: (task) => console.log('Update:', task),
    onComplete: (task) => console.log('Done:', task),
  })

  return (
    <TaskOutput
      task={task}
      isLoading={isLoading}
      isStreaming={isStreaming}
    />
  )
}`

// Mock task for static demo
const mockCompletedTask: Partial<Task> = {
  id: 'demo-task-completed',
  status: TaskStatusCompleted,
  created_at: new Date(Date.now() - 30000).toISOString(),
  updated_at: new Date().toISOString(),
  output: {
    text: 'This is the generated output from the task.',
    score: 0.95,
    tags: ['demo', 'example', 'test'],
  },
  events: [
    { id: '1', task_id: 'demo', status: 1, event_time: new Date(Date.now() - 30000).toISOString(), created_at: new Date(Date.now() - 30000).toISOString() },
    { id: '2', task_id: 'demo', status: 4, event_time: new Date(Date.now() - 25000).toISOString(), created_at: new Date(Date.now() - 25000).toISOString() },
    { id: '3', task_id: 'demo', status: 7, event_time: new Date(Date.now() - 20000).toISOString(), created_at: new Date(Date.now() - 20000).toISOString() },
    { id: '4', task_id: 'demo', status: TaskStatusCompleted, event_time: new Date().toISOString(), created_at: new Date().toISOString() },
  ],
  logs: [],
}

const mockRunningTask: Partial<Task> = {
  id: 'demo-task-running',
  status: TaskStatusRunning,
  created_at: new Date(Date.now() - 10000).toISOString(),
  updated_at: new Date().toISOString(),
  events: [
    { id: '1', task_id: 'demo', status: 1, event_time: new Date(Date.now() - 10000).toISOString(), created_at: new Date(Date.now() - 10000).toISOString() },
    { id: '2', task_id: 'demo', status: 4, event_time: new Date(Date.now() - 8000).toISOString(), created_at: new Date(Date.now() - 8000).toISOString() },
    { id: '3', task_id: 'demo', status: TaskStatusRunning, event_time: new Date(Date.now() - 5000).toISOString(), created_at: new Date(Date.now() - 5000).toISOString() },
  ],
  logs: [],
}

const mockFailedTask: Partial<Task> = {
  id: 'demo-task-failed',
  status: TaskStatusFailed,
  created_at: new Date(Date.now() - 60000).toISOString(),
  updated_at: new Date().toISOString(),
  error: 'Error: CUDA out of memory. Tried to allocate 2.00 GiB.',
  events: [
    { id: '1', task_id: 'demo', status: 1, event_time: new Date(Date.now() - 60000).toISOString(), created_at: new Date(Date.now() - 60000).toISOString() },
    { id: '2', task_id: 'demo', status: 4, event_time: new Date(Date.now() - 55000).toISOString(), created_at: new Date(Date.now() - 55000).toISOString() },
    { id: '3', task_id: 'demo', status: TaskStatusFailed, event_time: new Date(Date.now() - 50000).toISOString(), created_at: new Date(Date.now() - 50000).toISOString() },
  ],
  logs: [],
}

// Live task demo component
function LiveTaskDemo() {
  const [taskId, setTaskId] = useState('5rczn5xbw36dk9rr4h37n9sajz')
  const [activeTaskId, setActiveTaskId] = useState('5rczn5xbw36dk9rr4h37n9sajz')
  const client = useMemo(() => new Inference({ proxyUrl: '/api/inference/proxy' }), [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setActiveTaskId(taskId)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="taskId" className="sr-only">Task ID</Label>
          <Input
            id="taskId"
            placeholder="Enter task ID"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
          />
        </div>
        <Button type="submit">load task</Button>
      </form>

      {activeTaskId && (
        <TaskOutputWrapper
          client={client}
          taskId={activeTaskId}
          onComplete={(task) => console.log('Task completed:', task)}
          onError={(err) => console.error('Task error:', err)}
        />
      )}



      {/* Compact Mode */}

      {activeTaskId && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b">
            <h4 className="text-sm font-medium">compact mode</h4>
            <p className="text-xs text-muted-foreground">use <code className="bg-muted px-1 rounded">compact</code> prop for embedding in tight spaces</p>
          </div>
          <div className="p-4 space-y-4">
            <TaskOutputWrapper
              client={client}
              taskId={activeTaskId}
              onComplete={(task) => console.log('Task completed:', task)}
              onError={(err) => console.error('Task error:', err)}
              compact
            />
          </div>
        </div>

      )}
    </div>
  )
}

export default function TaskOutputDemoPage() {
  return (
    <PageLayout toc={tocItems}>
      <div className="max-w-4xl space-y-12">
        {/* Header */}
        <header className="space-y-4">
          <h1 className="text-3xl font-bold">task</h1>
          <p className="text-lg text-muted-foreground">
            real-time task status and output display with streaming support, status indicators, and logs viewer.
          </p>
        </header>

        {/* Live Demo */}
        <section id="live-demo" className="space-y-4">
          <h2 className="text-2xl font-semibold">live demo</h2>
          <p className="text-muted-foreground">
            enter a task id to see real-time streaming output.
          </p>
          <div className="border rounded-lg p-4">
            <LiveTaskDemo />
          </div>
        </section>

        {/* Static Examples */}
        <section id="components" className="space-y-6">
          <h2 className="text-2xl font-semibold">components</h2>

          {/* Status Pills */}
          <div className="space-y-4">
            <h3 className="text-xl font-medium">status pills</h3>
            <p className="text-muted-foreground">
              display task status with optional elapsed time.
            </p>
            <div className="flex flex-wrap gap-2">
              <StatusPillSimple status={TaskStatusQueued} />
              <StatusPillSimple status={TaskStatusRunning} />
              <StatusPillSimple status={TaskStatusCompleted} />
              <StatusPillSimple status={TaskStatusFailed} />
            </div>
          </div>

          {/* Time Since */}
          <div className="space-y-4">
            <h3 className="text-xl font-medium">time since</h3>
            <p className="text-muted-foreground">
              displays elapsed time, updating in real-time for live tasks.
            </p>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="text-sm">
                <span className="text-muted-foreground">live: </span>
                <TimeSince start={new Date(Date.now() - 5000).toISOString()} />
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">completed: </span>
                <TimeSince
                  start={new Date(Date.now() - 30000).toISOString()}
                  end={new Date().toISOString()}
                />
              </div>
            </div>
          </div>

          {/* Task Output States */}
          <div className="space-y-4">
            <h3 className="text-xl font-medium">task states</h3>

            {/* Completed */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 border-b">
                <h4 className="text-sm font-medium">completed task</h4>
              </div>
              <div className="p-4">
                <TaskOutput task={mockCompletedTask as Task} />
              </div>
            </div>

            {/* Running */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 border-b">
                <h4 className="text-sm font-medium">running task</h4>
              </div>
              <div className="p-4">
                <TaskOutput task={mockRunningTask as Task} isStreaming />
              </div>
            </div>

            {/* Failed */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 border-b">
                <h4 className="text-sm font-medium">failed task</h4>
              </div>
              <div className="p-4">
                <TaskOutput task={mockFailedTask as Task} />
              </div>
            </div>
          </div>
        </section>

        {/* Installation */}
        <section id="installation" className="space-y-4">
          <h2 className="text-2xl font-semibold">installation</h2>
          <CodeBlock language="bash">
            npx shadcn@latest add https://ui.inference.sh/r/task.json
          </CodeBlock>
        </section>

        {/* Usage */}
        <section id="usage" className="space-y-4">
          <h2 className="text-2xl font-semibold">usage</h2>
          <p className="text-muted-foreground">
            the easiest way to display task output is with the <code className="text-sm bg-muted px-1 rounded">TaskOutputWrapper</code> component.
          </p>
          <CodeBlock language="tsx">{usageCode}</CodeBlock>

          <p className="text-muted-foreground mt-6">
            for more control, use the <code className="text-sm bg-muted px-1 rounded">useTask</code> hook with the <code className="text-sm bg-muted px-1 rounded">TaskOutput</code> component.
          </p>
          <CodeBlock language="tsx">{hookUsageCode}</CodeBlock>
        </section>

        {/* Features */}
        <section id="features" className="space-y-4">
          <h2 className="text-2xl font-semibold">features</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>real-time streaming with automatic reconnection</li>
            <li>status indicators with elapsed time</li>
            <li>automatic output field rendering (text, images, video, audio, files)</li>
            <li>tabbed view: output, logs, json</li>
            <li>copy-to-clipboard for output and logs</li>
            <li>auto-scrolling log viewer</li>
            <li>compact mode for embedding</li>
          </ul>
        </section>
      </div>
    </PageLayout>
  )
}
