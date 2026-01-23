/**
 * Accessibility Tree Scanner
 *
 * Scans DOM elements and builds an accessibility tree representation
 * for AI to understand and interact with UI elements.
 */

// Types
export interface AccessibilityNode {
  role: string
  name: string
  value?: string
  selector: string
  ref: string
  children?: AccessibilityNode[]
  properties?: AccessibilityProperties
}

export interface AccessibilityProperties {
  disabled?: boolean
  required?: boolean
  checked?: boolean
  expanded?: boolean
  selected?: boolean
  readonly?: boolean
  placeholder?: string
  description?: string
  options?: { value: string; label: string }[]
}

// Role mappings
const IMPLICIT_ROLES: Record<string, string> = {
  'header': 'banner', 'nav': 'navigation', 'main': 'main', 'footer': 'contentinfo',
  'aside': 'complementary', 'section': 'region', 'article': 'article', 'form': 'form',
  'button': 'button', 'a': 'link', 'input': 'textbox', 'textarea': 'textbox',
  'select': 'combobox', 'option': 'option', 'h1': 'heading', 'h2': 'heading',
  'h3': 'heading', 'h4': 'heading', 'h5': 'heading', 'h6': 'heading',
  'label': 'label', 'fieldset': 'group', 'legend': 'legend',
}

const INPUT_TYPE_ROLES: Record<string, string> = {
  'button': 'button', 'submit': 'button', 'reset': 'button', 'checkbox': 'checkbox',
  'radio': 'radio', 'range': 'slider', 'number': 'spinbutton', 'search': 'searchbox',
  'email': 'textbox', 'tel': 'textbox', 'url': 'textbox', 'password': 'textbox',
  'text': 'textbox', 'hidden': 'none',
}

export function getAccessibleRole(element: HTMLElement): string {
  const explicitRole = element.getAttribute('role')
  if (explicitRole) return explicitRole

  const tagName = element.tagName.toLowerCase()
  if (tagName === 'input') {
    const inputType = (element as HTMLInputElement).type || 'text'
    return INPUT_TYPE_ROLES[inputType] || 'textbox'
  }
  return IMPLICIT_ROLES[tagName] || 'generic'
}

export function getAccessibleName(element: HTMLElement): string {
  // aria-label
  const ariaLabel = element.getAttribute('aria-label')
  if (ariaLabel) return ariaLabel

  // For inputs, check associated label
  if (element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement) {
    const id = element.id
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`)
      if (label) return label.textContent?.trim() || ''
    }
    const parentLabel = element.closest('label')
    if (parentLabel) {
      const clone = parentLabel.cloneNode(true) as HTMLElement
      clone.querySelectorAll('input, textarea, select').forEach(el => el.remove())
      return clone.textContent?.trim() || ''
    }
    const placeholder = element.getAttribute('placeholder')
    if (placeholder) return placeholder
    const name = element.getAttribute('name')
    if (name) return name
  }

  // For buttons and links
  const role = getAccessibleRole(element)
  if (role === 'button' || role === 'link') {
    return element.textContent?.trim() || element.getAttribute('title') || ''
  }

  return element.textContent?.trim() || ''
}

export function generateSelector(element: HTMLElement, root?: HTMLElement): string {
  if (element.id) return `#${CSS.escape(element.id)}`

  const path: string[] = []
  let current: HTMLElement | null = element
  const stopAt = root || document.body

  while (current && current !== stopAt && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase()
    if (current.className && typeof current.className === 'string') {
      const classes = current.className.trim().split(/\s+/).slice(0, 2).filter(Boolean)
      if (classes.length > 0) {
        selector += '.' + classes.map(c => CSS.escape(c)).join('.')
      }
    }
    const parent = current.parentElement
    if (parent) {
      const siblings = Array.from(parent.children).filter(child => child.tagName === current!.tagName)
      if (siblings.length > 1) {
        selector += `:nth-of-type(${siblings.indexOf(current) + 1})`
      }
    }
    path.unshift(selector)
    current = current.parentElement
  }
  return path.join(' > ')
}

function getElementValue(element: HTMLElement): string | undefined {
  if (element instanceof HTMLInputElement) {
    if (element.type === 'checkbox' || element.type === 'radio') {
      return element.checked ? 'checked' : 'unchecked'
    }
    return element.value || undefined
  }
  if (element instanceof HTMLTextAreaElement) return element.value || undefined
  if (element instanceof HTMLSelectElement) return element.value || undefined
  return undefined
}

function getAccessibilityProperties(element: HTMLElement): AccessibilityProperties | undefined {
  const props: AccessibilityProperties = {}
  let hasProps = false

  if (element.hasAttribute('disabled')) { props.disabled = true; hasProps = true }
  if (element.hasAttribute('required')) { props.required = true; hasProps = true }
  if (element instanceof HTMLInputElement && (element.type === 'checkbox' || element.type === 'radio')) {
    props.checked = element.checked; hasProps = true
  }
  if (element.hasAttribute('readonly')) { props.readonly = true; hasProps = true }

  const placeholder = element.getAttribute('placeholder')
  if (placeholder) { props.placeholder = placeholder; hasProps = true }

  if (element instanceof HTMLSelectElement) {
    const options: { value: string; label: string }[] = []
    for (const opt of element.options) {
      options.push({ value: opt.value, label: opt.textContent?.trim() || opt.value })
    }
    if (options.length > 0) { props.options = options; hasProps = true }
  }

  return hasProps ? props : undefined
}

function isInteractive(element: HTMLElement): boolean {
  const role = getAccessibleRole(element)
  const interactiveRoles = ['button', 'link', 'textbox', 'checkbox', 'radio', 'combobox', 'listbox', 'option', 'slider', 'spinbutton', 'switch', 'tab', 'menuitem', 'searchbox']
  if (interactiveRoles.includes(role)) return true
  if (element.hasAttribute('tabindex') && element.getAttribute('tabindex') !== '-1') return true
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement || element instanceof HTMLButtonElement) return true
  if (element instanceof HTMLAnchorElement && element.href) return true
  return false
}

function isVisible(element: HTMLElement): boolean {
  if (!element.isConnected) return false
  const style = window.getComputedStyle(element)
  if (style.display === 'none' || style.visibility === 'hidden') return false
  if (element.getAttribute('aria-hidden') === 'true') return false
  return true
}

let refCounter = 0

export function scanAccessibilityTree(
  root: HTMLElement,
  options: { maxDepth?: number; interactiveOnly?: boolean } = {}
): AccessibilityNode[] {
  const { maxDepth = 10, interactiveOnly = true } = options
  refCounter = 0
  const nodes: AccessibilityNode[] = []

  function processElement(element: HTMLElement, depth: number): AccessibilityNode | null {
    if (depth > maxDepth || !isVisible(element)) return null

    const role = getAccessibleRole(element)
    if (interactiveOnly && (role === 'generic' || role === 'none')) {
      const children: AccessibilityNode[] = []
      for (const child of element.children) {
        if (child instanceof HTMLElement) {
          const childNode = processElement(child, depth + 1)
          if (childNode) children.push(childNode)
        }
      }
      return children.length > 0 ? { role: 'container', name: '', selector: '', ref: '', children } : null
    }

    const name = getAccessibleName(element)
    const value = getElementValue(element)
    const properties = getAccessibilityProperties(element)
    const selector = generateSelector(element, root)
    const ref = `e${++refCounter}`

    if (interactiveOnly && !isInteractive(element) && !name) {
      const children: AccessibilityNode[] = []
      for (const child of element.children) {
        if (child instanceof HTMLElement) {
          const childNode = processElement(child, depth + 1)
          if (childNode) children.push(childNode)
        }
      }
      return children.length > 0 ? { role: 'container', name: '', selector: '', ref: '', children } : null
    }

    const node: AccessibilityNode = { role, name, selector, ref }
    if (value !== undefined) node.value = value
    if (properties) node.properties = properties

    const containerRoles = ['form', 'group', 'list', 'listbox', 'menu', 'region', 'dialog']
    if (containerRoles.includes(role) || !interactiveOnly) {
      const children: AccessibilityNode[] = []
      for (const child of element.children) {
        if (child instanceof HTMLElement) {
          const childNode = processElement(child, depth + 1)
          if (childNode) {
            if (childNode.role === 'container' && childNode.children) {
              children.push(...childNode.children)
            } else {
              children.push(childNode)
            }
          }
        }
      }
      if (children.length > 0) node.children = children
    }

    return node
  }

  for (const child of root.children) {
    if (child instanceof HTMLElement) {
      const node = processElement(child, 0)
      if (node) {
        if (node.role === 'container' && node.children) {
          nodes.push(...node.children)
        } else {
          nodes.push(node)
        }
      }
    }
  }

  return nodes
}

export function formatAccessibilityTree(nodes: AccessibilityNode[], indent = 0): string {
  const lines: string[] = []
  const prefix = '  '.repeat(indent)

  for (const node of nodes) {
    let line = `${prefix}[${node.ref}] ${node.role}`
    if (node.name) line += `: "${node.name}"`
    if (node.value !== undefined) line += ` = "${node.value}"`
    if (node.properties) {
      const props: string[] = []
      if (node.properties.disabled) props.push('disabled')
      if (node.properties.required) props.push('required')
      if (node.properties.checked) props.push('checked')
      if (node.properties.readonly) props.push('readonly')
      if (props.length > 0) line += ` (${props.join(', ')})`
      if (node.properties.options && node.properties.options.length > 0) {
        const optionsList = node.properties.options.map(o => `"${o.value}"`).join(', ')
        line += ` [options: ${optionsList}]`
      }
    }
    lines.push(line)
    if (node.children) lines.push(formatAccessibilityTree(node.children, indent + 1))
  }

  return lines.join('\n')
}
