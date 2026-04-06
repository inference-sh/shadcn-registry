'use client'

import { createContext, useContext } from 'react'
import type { FontConfig, LineHeightConfig } from '../core/types'

export type PretextMdConfig = {
  fonts: FontConfig
  lineHeights: LineHeightConfig
}

// Font strings use px for canvas measureText compatibility.
// Values match Tailwind default scale (0.875rem = 14px at 16px root).
// Canvas ctx.font silently ignores rem/em units — always use px here.
const defaultFonts: FontConfig = {
  body: '14px "DM Sans", sans-serif',
  bold: 'bold 14px "DM Sans", sans-serif',
  italic: 'italic 14px "DM Sans", sans-serif',
  boldItalic: 'bold italic 14px "DM Sans", sans-serif',
  code: '13px "DM Mono", "Fira Code", monospace',
  h1: 'bold 24px "DM Sans", sans-serif',
  h2: 'bold 20px "DM Sans", sans-serif',
  h3: 'bold 16px "DM Sans", sans-serif',
  h4: 'bold 14px "DM Sans", sans-serif',
  h5: 'bold 13px "DM Sans", sans-serif',
  h6: 'bold 12px "DM Sans", sans-serif',
}

const defaultLineHeights: LineHeightConfig = {
  body: 20,
  code: 18,
  h1: 32,
  h2: 28,
  h3: 24,
  h4: 20,
  h5: 20,
  h6: 18,
}

export const defaultConfig: PretextMdConfig = {
  fonts: defaultFonts,
  lineHeights: defaultLineHeights,
}

export const PretextMdContext = createContext<PretextMdConfig>(defaultConfig)

export function usePretextMdConfig(): PretextMdConfig {
  return useContext(PretextMdContext)
}
