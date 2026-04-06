'use client'

import { createContext, useContext } from 'react'
import type { FontConfig, LineHeightConfig } from '../core/types'

export type PretextMdConfig = {
  fonts: FontConfig
  lineHeights: LineHeightConfig
}

// Font strings use rem so pretext resolves them against the actual root
// font-size via getComputedStyle. Values match Tailwind default scale.
const defaultFonts: FontConfig = {
  body: '0.875rem "DM Sans", sans-serif',
  bold: 'bold 0.875rem "DM Sans", sans-serif',
  italic: 'italic 0.875rem "DM Sans", sans-serif',
  boldItalic: 'bold italic 0.875rem "DM Sans", sans-serif',
  code: '0.8125rem "DM Mono", "Fira Code", monospace',
  h1: 'bold 1.5rem "DM Sans", sans-serif',
  h2: 'bold 1.25rem "DM Sans", sans-serif',
  h3: 'bold 1rem "DM Sans", sans-serif',
  h4: 'bold 0.875rem "DM Sans", sans-serif',
  h5: 'bold 0.8125rem "DM Sans", sans-serif',
  h6: 'bold 0.75rem "DM Sans", sans-serif',
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
