# ui.inference.sh — ai chat ui components for react & next.js

[![npm version](https://img.shields.io/npm/v/@inferencesh/ui.svg)](https://www.npmjs.com/package/@inferencesh/ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

a [shadcn](https://ui.shadcn.com) registry of react ui components for building ai-powered applications, chatbots, and ai agent interfaces.

built for [inference.sh](https://inference.sh) — the ai agent runtime for serverless ai inference.

## Components

Install components directly into your project:

```bash
npx shadcn@latest add https://ui.inference.sh/r/agent.json
```

### Blocks

| Component | Description |
|-----------|-------------|
| **agent** | Full-featured agent chat with all primitives wired together |
| **chat** | Visual building blocks: chat container, messages, input, status indicators |
| **tools** | Tool invocation UI: pending, in-progress, approval, and results |
| **widgets** | Renders declarative UI nodes from agent tool outputs |
| **markdown** | High-fidelity markdown with code blocks, embeds, and zoomable images |
| **code-block** | Syntax-highlighted code block with line numbers and copy button |
| **steps** | Numbered step component for sequential instructions |
| **sidebar-light** | Lightweight sidebar navigation with nested items |
| **table-of-contents** | Auto-scrolling TOC with intersection observer |
| **youtube-embed** | Responsive YouTube video embed |
| **zoomable-image** | Click-to-zoom image with lightbox |

## Development

```bash
pnpm install
pnpm dev
```

Build the registry:

```bash
pnpm registry:build
```

## links

- [documentation](https://inference.sh/docs) — getting started guides
- [registry](https://ui.inference.sh) — browse all components
- [blog](https://inference.sh/blog) — tutorials and guides
- [app store](https://app.inference.sh) — 150+ ai models
- [discord](https://discord.gg/RM77SWSbyT) — community
- [github](https://github.com/inference-sh) — source code

## license

MIT © [inference.sh](https://inference.sh)
