# ui.inference.sh

A shadcn registry of UI components for building AI-powered applications.

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
| **chat-core** | Headless state management, hooks, and SDK orchestration |
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

## Links

- [Documentation](https://docs.inference.sh)
- [Registry](https://ui.inference.sh)
