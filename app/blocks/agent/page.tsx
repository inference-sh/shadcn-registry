'use client'

import { useState, useRef, useMemo } from 'react'
import { PageLayout } from '@/components/page-layout'
import { Agent } from '@/registry/blocks/agent/agent'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { TocItem } from '@/registry/blocks/table-of-contents/table-of-contents'
import { CodeBlock } from '@/registry/blocks/code-block'
import { createScopedTools, FORM_ASSISTANT_PROMPT } from './lib/client-tools'
import { Sparkles } from 'lucide-react'

const tocItems: TocItem[] = [
  { id: 'demo', title: 'demo' },
  { id: 'client-tools-source', title: 'client tools source', level: 2 },
  { id: 'installation', title: 'installation' },
  { id: 'setup', title: 'setup' },
  { id: 'api-proxy', title: 'api proxy', level: 2 },
  { id: 'env-vars', title: 'environment variables', level: 2 },
  { id: 'usage', title: 'usage' },
]

// =============================================================================
// AI Assistant Demo Components
// =============================================================================

function PricingForm({ formRef }: { formRef: React.RefObject<HTMLFormElement | null> }) {
  const [plan, setPlan] = useState('pro')
  const [seats, setSeats] = useState('5')
  const [billing, setBilling] = useState('monthly')
  const [addons, setAddons] = useState({ support: false, analytics: true, api: false })

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
            aria-describedby="plan-help"
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="w-full h-10 px-3 rounded-md border bg-background"
          >
            <option value="starter">Starter ($9/seat/mo)</option>
            <option value="pro">Pro ($29/seat/mo)</option>
            <option value="enterprise">Enterprise ($99/seat/mo)</option>
          </select>
          <span id="plan-help" className="sr-only">Choose your pricing tier: Starter at $9, Pro at $29, or Enterprise at $99 per seat per month</span>
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
            aria-describedby="seats-help"
            value={seats}
            onChange={(e) => setSeats(e.target.value)}
          />
          <span id="seats-help" className="sr-only">Enter the number of user seats (1-100)</span>
        </div>
      </div>

      <fieldset className="space-y-2" role="radiogroup" aria-label="Billing cycle selection">
        <legend className="text-sm font-medium">Billing Cycle</legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="billing"
              id="billing-monthly"
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
              id="billing-yearly"
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
              id="addon-support"
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
              id="addon-analytics"
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
              id="addon-api"
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

function AIAssistantDemo() {
  const formRef = useRef<HTMLFormElement>(null)
  const [isStarted, setIsStarted] = useState(true)
  const [useProxy, setUseProxy] = useState(true)
  const [apiKey, setApiKey] = useState('')

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

  const handleStart = () => {
    if (useProxy || apiKey.trim()) {
      setIsStarted(true)
    }
  }

  return (
    <div className="space-y-4">
      {!isStarted ? (
        <div className="border rounded-lg p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            this demo shows an AI assistant that can read and manipulate a form.
            the agent uses client-side tools (scan_ui, fill_field) to interact with the pricing configurator.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="use-proxy-assistant"
              checked={useProxy}
              onChange={(e) => setUseProxy(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="use-proxy-assistant" className="text-sm">
              Use server proxy (requires INFERENCE_API_KEY in .env.local)
            </Label>
          </div>
          {!useProxy && (
            <div className="space-y-2">
              <Label htmlFor="api-key-assistant">API Key</Label>
              <Input
                id="api-key-assistant"
                type="password"
                placeholder="inf_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          )}
          <Button onClick={handleStart} className="w-full" disabled={!useProxy && !apiKey.trim()}>
            Start AI Assistant Demo
          </Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          <PricingForm formRef={formRef} />
          <div className="border rounded-lg overflow-hidden h-[500px]">
            <Agent
              {...(useProxy ? { proxyUrl: '/api/inference/proxy' } : { apiKey })}
              name="pricing-assistant"
              allowFiles={false}
              allowImages={false}
              config={{
                core_app_ref: 'openrouter/claude-haiku-45@0fkg6xwb',
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
      )}
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
            agents can use client-side tools to interact with DOM elements.
            this demo shows an assistant that can read and manipulate a pricing form.
          </p>
          <AIAssistantDemo />

          {/* Source Code Tabs */}
          <div id="client-tools-source" className="space-y-3 pt-4">
            <h3 className="text-lg font-medium">source code</h3>
            <p className="text-sm text-muted-foreground">
              the agent component uses client-side tools with an accessibility tree scanner to understand and interact with DOM elements.
            </p>
            <Tabs defaultValue="agent">
              <TabsList className="justify-start flex-wrap h-auto gap-1">
                <TabsTrigger value="agent">agent.tsx</TabsTrigger>
                <TabsTrigger value="client-tools">client-tools.ts</TabsTrigger>
                <TabsTrigger value="scanner">scanner.ts</TabsTrigger>
                <TabsTrigger value="interactor">interactor.ts</TabsTrigger>
              </TabsList>
              <TabsContent value="agent" className="mt-4">
                <CodeBlock language="tsx">
                  {`import { useRef, useMemo, useState } from 'react'
import { Agent } from '@/components/agent'
import { createScopedTools, FORM_ASSISTANT_PROMPT } from './lib/client-tools'

function PricingAssistantDemo() {
  const formRef = useRef<HTMLFormElement>(null)
  const scopedTools = useMemo(() => createScopedTools(formRef), [])

  const systemPrompt = FORM_ASSISTANT_PROMPT + \`
    ## Form Context
    - Plan: starter ($9), pro ($29), enterprise ($99) per seat/month
    - Seats: 1-100
    - Billing: monthly or yearly (2 months free)
    - Add-ons: addon_support ($19), addon_analytics ($9), addon_api ($49)

    ## Instructions
    1. Use scan_ui to see current form state
    2. Use fill_field("plan", "starter") to change fields
    3. Be concise and confirm changes\`

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <form ref={formRef}>{/* Your form fields */}</form>
      <Agent
        proxyUrl="/api/inference/proxy"
        name="pricing-assistant"
        config={{
          core_app_ref: 'openrouter/claude-haiku-45@0fkg6xwb',
          description: 'I can help configure your pricing plan',
          system_prompt: systemPrompt,
          tools: scopedTools,
          example_prompts: [
            'set me up with the cheapest option',
            'i need 10 seats with API access',
          ],
        }}
      />
    </div>
  )
}`}
                </CodeBlock>
              </TabsContent>
              <TabsContent value="client-tools" className="mt-4">
                <CodeBlock language="typescript">
                  {`import type { RefObject } from 'react'
import { scanAccessibilityTree, formatAccessibilityTree } from './scanner'
import { interact, getFormState, fillField, type InteractionAction } from './interactor'
import { tool, string, boolean, enumOf, optional } from '@/registry/blocks/agent/lib/tool-builder'
import type { ClientTool } from '@/registry/blocks/agent/types'

/** Wraps a handler to inject scopeRef from closure */
const withScope = (
  scopeRef: RefObject<HTMLElement | null>,
  fn: (args: Record<string, unknown>, root: HTMLElement) => Promise<string> | string
) => async (args: Record<string, unknown>) => {
  const root = scopeRef.current
  if (!root) return JSON.stringify({ error: 'No UI scope available' })
  return fn(args, root)
}

const createScanUI = (scopeRef: RefObject<HTMLElement | null>): ClientTool =>
  tool('scan_ui')
    .displayName('Scan UI')
    .describe('Scans the UI and returns an accessibility tree of interactive elements.')
    .handler(withScope(scopeRef, async (_args, root) => {
      const tree = scanAccessibilityTree(root, { interactiveOnly: true })
      return formatAccessibilityTree(tree) || 'No interactive elements found'
    }))

const createFillField = (scopeRef: RefObject<HTMLElement | null>): ClientTool =>
  tool('fill_field')
    .displayName('Fill Field')
    .describe('Fills a form field by name, label, placeholder, or ID.')
    .param('field', string('The field identifier'))
    .param('value', string('The value to fill'))
    .handler(withScope(scopeRef, async (args, root) => {
      const result = await fillField(root, args.field as string, String(args.value))
      return JSON.stringify(result)
    }))

const createInteract = (scopeRef: RefObject<HTMLElement | null>): ClientTool =>
  tool('interact')
    .displayName('Interact')
    .describe('Low-level interaction with a UI element by CSS selector.')
    .param('selector', string('CSS selector for the element'))
    .param('action', enumOf(['click', 'type', 'select', 'clear', 'focus', 'blur', 'check'] as const, 'Action to perform'))
    .param('text', optional(string('Text to type')))
    .param('value', optional(string('Value to select')))
    .param('checked', optional(boolean('Checked state')))
    .handler(withScope(scopeRef, async (args, root) => {
      const selector = args.selector as string
      const actionType = args.action as string
      let action: InteractionAction

      switch (actionType) {
        case 'click': action = { type: 'click' }; break
        case 'type': action = { type: 'type', text: String(args.text), clear: true }; break
        case 'select': action = { type: 'select', value: String(args.value) }; break
        case 'check': action = { type: 'check', checked: Boolean(args.checked ?? true) }; break
        default: action = { type: actionType as 'focus' | 'blur' | 'clear' }
      }

      return JSON.stringify(await interact(selector, action, root))
    }))

/** Creates all client tools bound to a scope ref */
export function createScopedTools(scopeRef: RefObject<HTMLElement | null>): ClientTool[] {
  return [createScanUI(scopeRef), createFillField(scopeRef), createInteract(scopeRef)]
}`}
                </CodeBlock>
              </TabsContent>
              <TabsContent value="scanner" className="mt-4">
                <CodeBlock language="typescript">
                  {`export interface AccessibilityNode {
  role: string
  name: string
  value?: string
  selector: string
  ref: string
  children?: AccessibilityNode[]
  properties?: { disabled?: boolean; required?: boolean; checked?: boolean; options?: { value: string; label: string }[] }
}

const IMPLICIT_ROLES: Record<string, string> = {
  button: 'button', a: 'link', input: 'textbox', textarea: 'textbox',
  select: 'combobox', option: 'option', form: 'form', fieldset: 'group',
}

const INPUT_TYPE_ROLES: Record<string, string> = {
  button: 'button', submit: 'button', checkbox: 'checkbox', radio: 'radio',
  range: 'slider', number: 'spinbutton', search: 'searchbox',
}

export function getAccessibleRole(el: HTMLElement): string {
  const explicit = el.getAttribute('role')
  if (explicit) return explicit
  const tag = el.tagName.toLowerCase()
  if (tag === 'input') return INPUT_TYPE_ROLES[(el as HTMLInputElement).type] || 'textbox'
  return IMPLICIT_ROLES[tag] || 'generic'
}

export function getAccessibleName(el: HTMLElement): string {
  const ariaLabel = el.getAttribute('aria-label')
  if (ariaLabel) return ariaLabel

  if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) {
    const id = el.id
    if (id) {
      const label = document.querySelector(\`label[for="\${id}"]\`)
      if (label) return label.textContent?.trim() || ''
    }
    return el.getAttribute('placeholder') || el.getAttribute('name') || ''
  }
  return el.textContent?.trim() || ''
}

export function scanAccessibilityTree(root: HTMLElement, opts = { interactiveOnly: true }): AccessibilityNode[] {
  let refCounter = 0
  const nodes: AccessibilityNode[] = []

  function process(el: HTMLElement, depth: number): AccessibilityNode | null {
    if (depth > 10 || !isVisible(el)) return null
    const role = getAccessibleRole(el)
    const name = getAccessibleName(el)
    const isInteractive = ['button', 'textbox', 'checkbox', 'radio', 'combobox'].includes(role)

    if (opts.interactiveOnly && !isInteractive && role === 'generic') {
      const children = [...el.children].map(c => c instanceof HTMLElement ? process(c, depth + 1) : null).filter(Boolean) as AccessibilityNode[]
      return children.length ? { role: 'container', name: '', selector: '', ref: '', children } : null
    }

    return { role, name, selector: generateSelector(el, root), ref: \`e\${++refCounter}\`, value: getValue(el) }
  }

  for (const child of root.children) {
    if (child instanceof HTMLElement) {
      const node = process(child, 0)
      if (node) nodes.push(...(node.role === 'container' ? node.children || [] : [node]))
    }
  }
  return nodes
}

export function formatAccessibilityTree(nodes: AccessibilityNode[], indent = 0): string {
  return nodes.map(n => {
    let line = \`\${'  '.repeat(indent)}[\${n.ref}] \${n.role}\`
    if (n.name) line += \`: "\${n.name}"\`
    if (n.value) line += \` = "\${n.value}"\`
    if (n.children) line += '\\n' + formatAccessibilityTree(n.children, indent + 1)
    return line
  }).join('\\n')
}

function isVisible(el: HTMLElement) {
  const s = getComputedStyle(el)
  return s.display !== 'none' && s.visibility !== 'hidden'
}
function getValue(el: HTMLElement) {
  if (el instanceof HTMLInputElement) return el.type === 'checkbox' ? (el.checked ? 'checked' : 'unchecked') : el.value
  if (el instanceof HTMLSelectElement) return el.value
  return undefined
}
function generateSelector(el: HTMLElement, root: HTMLElement) {
  if (el.id) return \`#\${CSS.escape(el.id)}\`
  const name = el.getAttribute('name')
  if (name) return \`[name="\${name}"]\`
  return el.tagName.toLowerCase()
}`}
                </CodeBlock>
              </TabsContent>
              <TabsContent value="interactor" className="mt-4">
                <CodeBlock language="typescript">
                  {`export type InteractionAction =
  | { type: 'click' }
  | { type: 'type'; text: string; clear?: boolean }
  | { type: 'select'; value: string }
  | { type: 'focus' } | { type: 'blur' } | { type: 'clear' }
  | { type: 'check'; checked: boolean }

export interface InteractionResult {
  success: boolean
  error?: string
  value?: string
}

export async function interact(selector: string, action: InteractionAction, root?: HTMLElement): Promise<InteractionResult> {
  const el = (root || document).querySelector(selector) as HTMLElement | null
  if (!el) return { success: false, error: \`Element not found: \${selector}\` }

  const style = getComputedStyle(el)
  if (style.display === 'none') return { success: false, error: 'Element not visible' }
  if (el.hasAttribute('disabled')) return { success: false, error: 'Element disabled' }

  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  await new Promise(r => setTimeout(r, 100))

  switch (action.type) {
    case 'click': el.focus(); el.click(); return { success: true }
    case 'type': return typeInto(el, action.text, action.clear)
    case 'select': return selectOption(el as HTMLSelectElement, action.value)
    case 'check': return checkElement(el as HTMLInputElement, action.checked)
    case 'focus': el.focus(); return { success: true }
    case 'blur': el.blur(); return { success: true }
    case 'clear': return typeInto(el, '', true)
  }
}

function typeInto(el: HTMLElement, text: string, clear = false): InteractionResult {
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) {
    return { success: false, error: 'Not a text input' }
  }
  el.focus()
  const newValue = clear ? text : el.value + text
  const setter = Object.getOwnPropertyDescriptor(
    el instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype, 'value'
  )?.set
  setter?.call(el, newValue)
  el.dispatchEvent(new InputEvent('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
  return { success: true, value: el.value }
}

function selectOption(el: HTMLSelectElement, value: string): InteractionResult {
  const opt = [...el.options].find(o => o.value === value || o.textContent?.trim().toLowerCase() === value.toLowerCase())
  if (!opt) return { success: false, error: \`Option not found: \${value}\` }
  el.value = opt.value
  el.dispatchEvent(new Event('change', { bubbles: true }))
  return { success: true, value: el.value }
}

function checkElement(el: HTMLInputElement, checked: boolean): InteractionResult {
  if (el.checked !== checked) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked')?.set
    setter?.call(el, checked)
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }
  return { success: true, value: el.checked ? 'checked' : 'unchecked' }
}

export function fillField(root: HTMLElement, field: string, value: string): Promise<InteractionResult> {
  // Try name, id, label, placeholder
  let el = root.querySelector(\`[name="\${field}"]\`) as HTMLElement
    || root.querySelector(\`#\${CSS.escape(field)}\`)
    || [...root.querySelectorAll('label')].find(l => l.textContent?.toLowerCase().includes(field.toLowerCase()))?.querySelector('input, select')
    || root.querySelector(\`[placeholder*="\${field}" i]\`)

  if (!el) return Promise.resolve({ success: false, error: \`Field not found: \${field}\` })

  if (el instanceof HTMLSelectElement) return interact(\`[name="\${el.name}"]\`, { type: 'select', value }, root)
  if (el instanceof HTMLInputElement && ['checkbox', 'radio'].includes(el.type)) {
    return interact(\`[name="\${el.name}"]\`, { type: 'check', checked: ['true', 'checked', 'on'].includes(value) }, root)
  }
  return interact(\`[name="\${(el as HTMLInputElement).name}"]\`, { type: 'type', text: value, clear: true }, root)
}`}
                </CodeBlock>
              </TabsContent>
            </Tabs>
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
            {`import { Agent } from '@/components/agent'

export function ChatAssistant() {
  return (
    <Agent
      proxyUrl="/api/inference/proxy"
      agentConfig={{
        core_app_ref: 'openrouter/claude-haiku-45@0fkg6xwb',
        description: 'A helpful AI assistant',
        system_prompt: 'You are helpful and concise.',
        example_prompts: [
          'What can you help me with?',
          'Tell me a joke',
        ],
      }}
      agentName="my-assistant"
    />
  )
}`}
          </CodeBlock>
          <p className="text-sm text-muted-foreground mt-6 mb-4">
            For more control, use the AgentProvider with custom chat components and client-side tools:
          </p>
          <CodeBlock language="tsx">
            {`import { useRef, useMemo } from 'react'
import { AgentProvider } from '@/registry/blocks/agent/provider'
import { useAgent, useAgentActions } from '@/registry/blocks/agent/hooks/use-agent'
import { ChatContainer } from '@/components/chat/components/chat-container'
import { ChatMessages } from '@/components/chat/components/chat-messages'
import { ChatInput } from '@/components/chat/components/chat-input'
import { MessageBubble } from '@/components/chat/components/message-bubble'
import { Inference } from '@inferencesh/sdk'
import { createScopedTools, FORM_ASSISTANT_PROMPT } from './lib/client-tools'

function MyAssistant() {
  const formRef = useRef<HTMLFormElement>(null)
  const scopedTools = useMemo(() => createScopedTools(formRef), [])
  const client = useMemo(() => new Inference({ proxyUrl: '/api/inference/proxy' }), [])

  const agentConfig = {
    core_app_ref: 'openrouter/claude-haiku-45@0fkg6xwb',
    system_prompt: FORM_ASSISTANT_PROMPT,
    tools: scopedTools, // Client-side tools that can interact with the DOM
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <form ref={formRef}>{/* Your form fields here */}</form>
      <AgentProvider client={client} agentConfig={agentConfig} agentName="form-assistant">
        <ChatContainer>
          <ChatMessages>
            {({ messages }) => messages.map(m => <MessageBubble key={m.id} message={m} />)}
          </ChatMessages>
          <ChatInput />
        </ChatContainer>
      </AgentProvider>
    </div>
  )
}`}
          </CodeBlock>
        </section>
      </div>
    </PageLayout>
  )
}
