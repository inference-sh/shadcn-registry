/**
 * Client Tools - Scoped DOM Interaction Tools
 *
 * Creates client-side tools that run in the browser and interact with DOM elements
 * within a scoped area.
 */

import type { RefObject } from 'react'
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
  if (!root) {
    return JSON.stringify({ error: 'No UI scope available' })
  }
  return fn(args, root)
}

const createScanUI = (scopeRef: RefObject<HTMLElement | null>): ClientTool =>
  tool('scan_ui')
    .displayName('Scan UI')
    .describe('Scans the user interface and returns an accessibility tree showing all interactive elements with their current values and states.')
    .handler(withScope(scopeRef, async (_args, root) => {
      const tree = scanAccessibilityTree(root, { interactiveOnly: true })
      const formatted = formatAccessibilityTree(tree)
      return formatted || 'No interactive elements found in scope'
    }))

const createFillField = (scopeRef: RefObject<HTMLElement | null>): ClientTool =>
  tool('fill_field')
    .displayName('Fill Field')
    .describe('Fills a form field by its name, label, placeholder, or ID.')
    .param('field', string('The field name, label text, placeholder, or ID to fill'))
    .param('value', string('The value to fill in the field'))
    .handler(withScope(scopeRef, async (args, root) => {
      const result = await fillField(root, args.field as string, String(args.value))
      return JSON.stringify(result)
    }))

const createGetFormState = (scopeRef: RefObject<HTMLElement | null>): ClientTool =>
  tool('get_form_state')
    .displayName('Get Form State')
    .describe('Returns the current values of all form fields in the scoped area.')
    .handler(withScope(scopeRef, async (_args, root) => {
      const state = getFormState(root)
      return JSON.stringify(state, null, 2)
    }))

const createInteract = (scopeRef: RefObject<HTMLElement | null>): ClientTool =>
  tool('interact')
    .displayName('Interact')
    .describe('Performs a low-level interaction with a UI element by CSS selector.')
    .param('selector', string('CSS selector for the target element'))
    .param('action', enumOf(['click', 'type', 'select', 'clear', 'focus', 'blur', 'check'] as const, 'The action to perform'))
    .param('text', optional(string('Text to type (for type action)')))
    .param('value', optional(string('Value to select (for select action)')))
    .param('clear', optional(boolean('Whether to clear before typing (for type action)')))
    .param('checked', optional(boolean('Checked state (for check action)')))
    .handler(withScope(scopeRef, async (args, root) => {
      const selector = args.selector as string
      const actionType = args.action as string

      let action: InteractionAction
      switch (actionType) {
        case 'click':
          action = { type: 'click' }
          break
        case 'type':
          if (!args.text) return JSON.stringify({ error: 'Missing text argument for type action' })
          action = { type: 'type', text: String(args.text), clear: Boolean(args.clear) }
          break
        case 'select':
          if (!args.value) return JSON.stringify({ error: 'Missing value argument for select action' })
          action = { type: 'select', value: String(args.value) }
          break
        case 'focus':
          action = { type: 'focus' }
          break
        case 'blur':
          action = { type: 'blur' }
          break
        case 'clear':
          action = { type: 'clear' }
          break
        case 'check':
          action = { type: 'check', checked: Boolean(args.checked ?? true) }
          break
        default:
          return JSON.stringify({ error: `Unknown action: ${actionType}` })
      }

      const result = await interact(selector, action, root)
      return JSON.stringify(result)
    }))

/** Creates all client tools bound to a scope ref */
export function createScopedTools(scopeRef: RefObject<HTMLElement | null>): ClientTool[] {
  return [
    createScanUI(scopeRef),
    createFillField(scopeRef),
    createGetFormState(scopeRef),
    createInteract(scopeRef),
  ]
}

/** System prompt for form assistants */
export const FORM_ASSISTANT_PROMPT = `You are a helpful AI assistant that can interact with web forms.

You have access to the following client-side tools:

1. **scan_ui** - Scans the user interface and returns an accessibility tree showing all interactive elements (buttons, inputs, selects, etc.) with their current values and states.

2. **fill_field** - Fills a form field by its name, label, or ID.
   - Arguments: field (string), value (string)

3. **get_form_state** - Returns the current values of all form fields.

4. **interact** - Performs low-level interactions with UI elements.
   - Arguments: selector (CSS selector), action (click|type|select|clear|focus|blur|check), and action-specific args

## Workflow

When the user asks you to help with a form:
1. First use \`scan_ui\` to understand what fields are available
2. Use \`fill_field\` to fill individual fields based on user requests
3. Use \`get_form_state\` to verify the form state
4. Provide helpful guidance about what you did

Always be helpful and explain what you're doing. If you encounter errors, explain them clearly.`
