'use client'

import { PageLayout } from '@/components/page-layout'
import { Steps, Step, StepTitle, StepContent } from '@/registry/blocks/steps/steps'
import { CodeBlock } from '@/registry/blocks/code-block/code-block'
import type { TocItem } from '@/registry/blocks/table-of-contents/table-of-contents'

const tocItems: TocItem[] = [
  { id: 'example', title: 'example' },
  { id: 'installation', title: 'installation' },
  { id: 'usage', title: 'usage' },
]

const usageCode = `import { Steps, Step, StepTitle, StepContent } from "@/components/steps"

export function GettingStarted() {
  return (
    <Steps>
      <Step>
        <StepTitle>install the component</StepTitle>
        <StepContent>
          <p>run the shadcn cli to add the component.</p>
        </StepContent>
      </Step>

      <Step>
        <StepTitle>add your api key</StepTitle>
        <StepContent>
          <p>set your environment variables.</p>
        </StepContent>
      </Step>

      <Step>
        <StepTitle>use in your app</StepTitle>
        <StepContent>
          <p>import and render the component.</p>
        </StepContent>
      </Step>
    </Steps>
  )
}`

export default function StepsPage() {
  return (
    <PageLayout toc={tocItems}>
      <div className="max-w-4xl space-y-12">
        {/* Header */}
        <header className="space-y-4">
          <h1 className="text-3xl font-bold">steps</h1>
          <p className="text-muted-foreground">
            numbered step component with connecting line for sequential instructions.
          </p>
        </header>

        {/* Example */}
        <section id="example" className="space-y-4">
          <h2 className="text-2xl font-semibold">example</h2>
          <div className="rounded-lg border p-6">
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
                  <CodeBlock language="typescript">{`// app/api/inference/proxy/route.ts
import { route } from '@inferencesh/sdk/proxy/nextjs';
export const { GET, POST, PUT } = route;`}</CodeBlock>
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
                  <CodeBlock language="tsx">{`<Agent
  proxyUrl="/api/inference/proxy"
  agentConfig={{
    core_app_ref: 'openrouter/claude-haiku-45@0fkg6xwb',
    description: 'a helpful ai assistant',
    system_prompt: 'you are helpful.',
  }}
/>`}</CodeBlock>
                </StepContent>
              </Step>
            </Steps>
          </div>
        </section>

        {/* Installation */}
        <section id="installation" className="space-y-4">
          <h2 className="text-2xl font-semibold">installation</h2>
          <CodeBlock language="bash">
            npx shadcn@latest add https://ui.inference.sh/r/steps.json
          </CodeBlock>
        </section>

        {/* Usage */}
        <section id="usage" className="space-y-4">
          <h2 className="text-2xl font-semibold">usage</h2>
          <CodeBlock language="tsx">{usageCode}</CodeBlock>
        </section>
      </div>
    </PageLayout>
  )
}
