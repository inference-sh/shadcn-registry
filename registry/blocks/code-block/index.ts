// Main components
export {
  CodeBlock,
  CompactCodeBlock,
  type CodeBlockProps,
  type CompactCodeBlockProps,
} from '@/components/code-block/code-block'

// Types
export type { Token, TokenType, LanguageDefinition } from '@/components/code-block/types'

// Language utilities
export { getLanguage, normalizeLanguage, languages } from '@/components/code-block/languages'

// Tokenizer (for advanced usage)
export { tokenize } from '@/components/code-block/tokenizer'

// Styles (for customization)
export { tokenStyles, getTokenStyle } from '@/components/code-block/styles'
