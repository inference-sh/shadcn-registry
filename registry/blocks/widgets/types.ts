import { WidgetTypeUI, WidgetTypeHTML, type Widget } from '@/components/agent/types';

// Valid widget types - "ui" (interactive) and "html" (static)
// Also accept "card" for backwards compatibility (legacy data)
const VALID_WIDGET_TYPES = [WidgetTypeUI, "card"]

// Helper to parse widget JSON from tool result or Widget object
export function parseWidget(input: string | Widget | unknown): Widget | null {
  // If it's already a Widget object
  if (input && typeof input === "object") {
    const widget = input as Widget
    if (VALID_WIDGET_TYPES.includes(widget.type)) {
      // Normalize "card" to "ui" for consistency
      if (widget.type === "card") {
        widget.type = WidgetTypeUI
      }
      return widget
    }
    return null
  }

  // If it's a JSON string
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input)
      if (parsed?.type && VALID_WIDGET_TYPES.includes(parsed.type)) {
        // Normalize "card" to "ui" for consistency
        if (parsed.type === "card") {
          parsed.type = WidgetTypeUI
        }
        return parsed as Widget
      }
      return null
    } catch {
      return null
    }
  }

  return null
}
