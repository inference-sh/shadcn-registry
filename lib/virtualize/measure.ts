import type { MeasureStrategy, VirtualItem, PositionedItem } from './types'

/**
 * Resolve a measurement strategy to a pixel height.
 */
export function resolveHeight(strategy: MeasureStrategy, width: number): number {
  switch (strategy.kind) {
    case 'fixed':
      return strategy.height
    case 'capped':
      return strategy.estimateContent !== undefined
        ? Math.min(strategy.estimateContent, strategy.maxHeight)
        : strategy.maxHeight
    case 'computed':
      return strategy.measure(width)
  }
}

/**
 * Resolve all items to positioned items with y offsets.
 * Pure arithmetic — no DOM, no side effects.
 */
export function positionItems<T>(
  items: VirtualItem<T>[],
  width: number,
  gap: number = 0,
  heightOverrides?: Map<string | number, number>,
  strategyFallback?: Map<string | number, number>,
): { positioned: PositionedItem<T>[]; totalHeight: number } {
  const positioned: PositionedItem<T>[] = []
  let y = 0

  for (let i = 0; i < items.length; i++) {
    const item = items[i]!
    const height = heightOverrides?.get(item.id)
      ?? strategyFallback?.get(item.id)
      ?? resolveHeight(item.strategy, width)
    positioned.push({ id: item.id, data: item.data, height, y })
    y += height
    if (i < items.length - 1) y += gap
  }

  return { positioned, totalHeight: y }
}

/**
 * Re-resolve a single item's height (e.g. after expand/collapse)
 * and recompute y offsets for all items from that index onward.
 * Returns the height delta for scroll position correction.
 */
export function updateItemHeight<T>(
  positioned: PositionedItem<T>[],
  index: number,
  newHeight: number,
  gap: number = 0,
): number {
  const old = positioned[index]!
  const delta = newHeight - old.height
  if (delta === 0) return 0

  old.height = newHeight

  // Recompute y offsets from index+1 onward
  for (let i = index + 1; i < positioned.length; i++) {
    positioned[i]!.y += delta
  }

  return delta
}
