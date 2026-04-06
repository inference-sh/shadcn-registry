export type MeasureStrategy =
  | FixedStrategy
  | CappedStrategy
  | ComputedStrategy

// Height is always the same regardless of content or width.
// Examples: buttons, pills, status indicators, headers.
export type FixedStrategy = {
  kind: 'fixed'
  height: number
}

// Content scrolls inside a capped container.
// Height is min(estimatedContent, maxHeight).
// Examples: JSON preview, log viewer, reasoning block.
export type CappedStrategy = {
  kind: 'capped'
  maxHeight: number
  // If you can estimate content height cheaply (e.g. lineCount * lineHeight),
  // provide it. Otherwise the cap is used as the height.
  estimateContent?: number
}

// Height is deterministic from props — pure arithmetic, no DOM.
// Examples: list of N items × row height, grid of N columns.
export type ComputedStrategy = {
  kind: 'computed'
  measure: (width: number) => number
}

// --- Virtualisable item ---

export type VirtualItem<T = unknown> = {
  id: string | number
  strategy: MeasureStrategy
  data: T
}

// --- Resolved item (after measurement) ---

export type PositionedItem<T = unknown> = {
  id: string | number
  data: T
  height: number
  y: number
}
