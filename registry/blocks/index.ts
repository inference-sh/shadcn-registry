/**
 * @inference/ui Registry Components
 *
 * shadcn-style registry for AI-powered UI components.
 *
 * Install components via shadcn CLI:
 *   npx shadcn@latest add https://ui.inference.sh/r/agent.json
 *
 * Or import directly via workspace:
 *   import { Agent } from '@inference/ui/agent';
 *   import { ChatContainer, ChatInput } from '@inference/ui/chat';
 */

// Re-export all component groups
export * from './agent';
export * from './chat';
export * from './tools';
export * from './widgets';
export * from './task';
