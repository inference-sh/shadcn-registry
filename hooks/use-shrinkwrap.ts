'use client'

import { useMemo } from 'react'
import { shrinkwrap } from '@/lib/pretext-md/core/shrinkwrap'
import { usePretextMdConfig } from '@/lib/pretext-md/react/context'
import type { FontConfig, LineHeightConfig } from '@/lib/pretext-md/core/types'

/**
 * Hook that returns the tightest pixel width for a markdown string
 * that preserves the same total height.
 *
 * Reads font config from PretextMdContext — wrap your app with
 * <PretextMdContext.Provider> to configure fonts for your project.
 *
 * Returns undefined when shrinkwrap isn't needed (empty, single line).
 */
export function useShrinkwrap(
  text: string | undefined,
  maxWidth: number,
  options?: {
    font?: string
    lineHeight?: number
    paddingX?: number
  },
): number | undefined {
  const config = usePretextMdConfig()
  const font = options?.font ?? config.fonts.body
  const lineHeight = options?.lineHeight ?? config.lineHeights.body
  const paddingX = options?.paddingX ?? 12

  return useMemo(() => {
    if (!text?.trim()) return undefined
    const contentWidth = maxWidth - paddingX * 2
    if (contentWidth <= 0) return undefined

    const fonts: FontConfig = {
      ...config.fonts,
      body: font,
      bold: `bold ${font}`,
      italic: `italic ${font}`,
      boldItalic: `bold italic ${font}`,
    }
    const lineHeights: LineHeightConfig = { ...config.lineHeights, body: lineHeight }

    const result = shrinkwrap(text, { maxWidth: contentWidth, fonts, lineHeights })
    if (result.width >= contentWidth) return undefined

    // +4px safety margin: canvas measurement can differ from browser text layout
    // by a few subpixels due to font hinting, kerning, and rounding differences
    return Math.ceil(result.width) + paddingX * 2 + 4
  }, [text, maxWidth, paddingX, font, lineHeight, config])
}
