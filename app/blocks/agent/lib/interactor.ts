/**
 * DOM Interactor
 *
 * Provides programmatic interaction with DOM elements
 * for client-side tool execution.
 */

export type InteractionAction =
  | { type: 'click' }
  | { type: 'type'; text: string; clear?: boolean }
  | { type: 'select'; value: string }
  | { type: 'focus' }
  | { type: 'blur' }
  | { type: 'clear' }
  | { type: 'check'; checked: boolean }

export interface InteractionResult {
  success: boolean
  error?: string
  value?: string
}

function findElement(selector: string, root?: HTMLElement): HTMLElement | null {
  const searchRoot = root || document
  try {
    return searchRoot.querySelector(selector) as HTMLElement | null
  } catch {
    return null
  }
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function dispatchInputEvent(element: HTMLElement): void {
  const value = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
    ? element.value
    : element instanceof HTMLSelectElement
    ? element.value
    : ''

  let nativeSetter: ((v: string) => void) | undefined
  if (element instanceof HTMLInputElement) {
    nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
  } else if (element instanceof HTMLTextAreaElement) {
    nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
  } else if (element instanceof HTMLSelectElement) {
    nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set
  }

  if (nativeSetter) nativeSetter.call(element, value)

  element.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: value }))
  element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }))
}

async function clickElement(element: HTMLElement): Promise<InteractionResult> {
  try {
    element.focus()
    await wait(10)
    element.click()
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

async function typeIntoElement(element: HTMLElement, text: string, clear = false): Promise<InteractionResult> {
  try {
    if (!(element instanceof HTMLInputElement) && !(element instanceof HTMLTextAreaElement)) {
      if (element.contentEditable !== 'true') {
        return { success: false, error: 'Element is not a text input' }
      }
      element.focus()
      await wait(10)
      if (clear) element.textContent = ''
      element.textContent = (element.textContent || '') + text
      element.dispatchEvent(new Event('input', { bubbles: true }))
      return { success: true, value: element.textContent }
    }

    element.focus()
    await wait(10)
    const newValue = clear ? text : element.value + text
    const nativeSetter = element instanceof HTMLInputElement
      ? Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
      : Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set

    if (nativeSetter) nativeSetter.call(element, newValue)
    else element.value = newValue

    dispatchInputEvent(element)
    return { success: true, value: element.value }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

async function selectOption(element: HTMLElement, value: string): Promise<InteractionResult> {
  try {
    if (!(element instanceof HTMLSelectElement)) {
      return { success: false, error: 'Element is not a select' }
    }

    const option = Array.from(element.options).find(
      opt => opt.value === value ||
             opt.value.toLowerCase() === value.toLowerCase() ||
             opt.textContent?.trim().toLowerCase() === value.toLowerCase()
    )

    if (!option) {
      const available = Array.from(element.options).map(o => o.value || o.textContent?.trim()).filter(Boolean)
      return { success: false, error: `Option "${value}" not found. Available: ${available.join(', ')}` }
    }

    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set
    if (nativeSetter) nativeSetter.call(element, option.value)
    else element.value = option.value

    element.selectedIndex = option.index
    dispatchInputEvent(element)
    return { success: true, value: element.value }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

async function clearElement(element: HTMLElement): Promise<InteractionResult> {
  try {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      const nativeSetter = element instanceof HTMLInputElement
        ? Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
        : Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set

      if (nativeSetter) nativeSetter.call(element, '')
      else element.value = ''

      dispatchInputEvent(element)
      return { success: true, value: '' }
    }
    return { success: false, error: 'Element cannot be cleared' }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

async function checkElement(element: HTMLElement, checked: boolean): Promise<InteractionResult> {
  try {
    if (!(element instanceof HTMLInputElement)) {
      return { success: false, error: 'Element is not an input' }
    }
    if (element.type !== 'checkbox' && element.type !== 'radio') {
      return { success: false, error: 'Element is not a checkbox or radio' }
    }
    if (element.checked !== checked) {
      // For React controlled components, we need to click to toggle
      // This triggers the onChange handler properly
      element.focus()
      await wait(10)
      element.click()
      await wait(10)

      // If the click didn't work (uncontrolled), force the state
      if (element.checked !== checked) {
        const nativeCheckedSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'checked')?.set
        if (nativeCheckedSetter) nativeCheckedSetter.call(element, checked)
        else element.checked = checked
        element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }))
      }
    }
    return { success: true, value: element.checked ? 'checked' : 'unchecked' }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function interact(selector: string, action: InteractionAction, root?: HTMLElement): Promise<InteractionResult> {
  const element = findElement(selector, root)
  if (!element) return { success: false, error: `Element not found: ${selector}` }

  const style = window.getComputedStyle(element)
  if (style.display === 'none' || style.visibility === 'hidden') {
    return { success: false, error: 'Element is not visible' }
  }
  if (element.hasAttribute('disabled')) {
    return { success: false, error: 'Element is disabled' }
  }

  element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  await wait(100)

  switch (action.type) {
    case 'click': return clickElement(element)
    case 'type': return typeIntoElement(element, action.text, action.clear)
    case 'select': return selectOption(element, action.value)
    case 'focus': element.focus(); return { success: true }
    case 'blur': element.blur(); return { success: true }
    case 'clear': return clearElement(element)
    case 'check': return checkElement(element, action.checked)
    default: return { success: false, error: 'Unknown action type' }
  }
}

export function getFormState(root: HTMLElement): Record<string, string> {
  const state: Record<string, string> = {}
  const inputs = root.querySelectorAll('input, textarea, select')

  inputs.forEach((input) => {
    if (!(input instanceof HTMLElement)) return
    const name = input.getAttribute('name') || input.id || ''
    if (!name) return

    if (input instanceof HTMLInputElement) {
      if (input.type === 'checkbox' || input.type === 'radio') {
        if (input.checked) state[name] = input.value || 'on'
      } else {
        state[name] = input.value
      }
    } else if (input instanceof HTMLTextAreaElement) {
      state[name] = input.value
    } else if (input instanceof HTMLSelectElement) {
      state[name] = input.value
    }
  })

  return state
}

function generateQuickSelector(element: HTMLElement): string {
  if (element.id) return `#${CSS.escape(element.id)}`
  const name = element.getAttribute('name')
  if (name) return `[name="${name}"]`
  let selector = element.tagName.toLowerCase()
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.trim().split(/\s+/).slice(0, 2).filter(Boolean)
    if (classes.length > 0) selector += '.' + classes.map(c => CSS.escape(c)).join('.')
  }
  return selector
}

export async function fillField(root: HTMLElement, fieldIdentifier: string, value: string): Promise<InteractionResult> {
  // Try to find by name
  let element = root.querySelector(`[name="${fieldIdentifier}"]`) as HTMLElement | null

  // Try to find by id
  if (!element) {
    element = root.querySelector(`#${CSS.escape(fieldIdentifier)}`) as HTMLElement | null
  }

  // Try to find by label text
  if (!element) {
    const labels = root.querySelectorAll('label')
    for (const label of labels) {
      if (label.textContent?.toLowerCase().includes(fieldIdentifier.toLowerCase())) {
        const forId = label.getAttribute('for')
        if (forId) {
          element = root.querySelector(`#${CSS.escape(forId)}`) as HTMLElement | null
        } else {
          element = label.querySelector('input, textarea, select') as HTMLElement | null
        }
        if (element) break
      }
    }
  }

  // Try to find by placeholder
  if (!element) {
    element = root.querySelector(`[placeholder*="${fieldIdentifier}" i]`) as HTMLElement | null
  }

  if (!element) {
    return { success: false, error: `Field "${fieldIdentifier}" not found` }
  }

  if (element instanceof HTMLSelectElement) {
    return interact(generateQuickSelector(element), { type: 'select', value }, root)
  }

  if (element instanceof HTMLInputElement && (element.type === 'checkbox' || element.type === 'radio')) {
    const shouldCheck = value === 'true' || value === 'checked' || value === 'on' || value === '1'
    return interact(generateQuickSelector(element), { type: 'check', checked: shouldCheck }, root)
  }

  return interact(generateQuickSelector(element), { type: 'type', text: value, clear: true }, root)
}
