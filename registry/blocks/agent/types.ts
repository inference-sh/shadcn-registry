/**
 * Agent Chat Types
 * 
 * Types for the Agent Chat component, using @inferencesh/sdk types.
 */

import type { ReactNode } from 'react';
import type {
    Inference,
    ChatMessageDTO,
    ChatDTO,
    ToolInvocationDTO,
    ChatMessageContent,
    ChatMessageRole,
    TaskStatus,
    AgentTool,
    AgentConfig,
    File as FileDTO,
    ClientTool,
    ClientToolHandler,
} from '@inferencesh/sdk';

// Re-export SDK types for consumers
export type {
    ChatMessageDTO,
    ChatDTO,
    ToolInvocationDTO,
    ChatMessageContent,
    ChatMessageRole,
    TaskStatus,
    ClientTool,
    ClientToolHandler,
};

// =============================================================================
// Agent Configuration
// =============================================================================

/**
 * Ad-hoc agent configuration - uses SDK's AgentConfig
 * Can include ClientTool for browser-executed handlers
 */
export type AdHocAgentConfig = Omit<AgentConfig, 'tools'> & {
    /** Tools with optional client-side handlers */
    tools?: (AgentTool | ClientTool)[];
};

/**
 * Template agent configuration
 */
export interface TemplateAgentConfig {
    /** Agent reference: namespace/name@shortid */
    agent: string;
}

/**
 * Union type for agent options
 */
export type AgentOptions = AdHocAgentConfig | TemplateAgentConfig;

/**
 * Type guard for ad-hoc config
 */
export function isAdHocConfig(config: AgentOptions): config is AdHocAgentConfig {
    return 'core_app' in config;
}

/**
 * Type guard for template config
 */
export function isTemplateConfig(config: AgentOptions): config is TemplateAgentConfig {
    return 'agent' in config;
}

// =============================================================================
// Chat State
// =============================================================================

export type AgentUIStatus = 'idle' | 'connecting' | 'streaming' | 'error';

export interface AgentState {
    chatId: string | null;
    messages: ChatMessageDTO[];
    status: AgentUIStatus;
    isGenerating: boolean;
    error?: string;
    chat: ChatDTO | null;
}

export interface AgentActions {
    sendMessage: (text: string, files?: (Blob | FileDTO)[]) => Promise<void>;
    stopGeneration: () => void;
    reset: () => void;
    clearError: () => void;
    submitToolResult: (toolInvocationId: string, result: string) => Promise<void>;
    approveTool: (toolInvocationId: string) => Promise<void>;
    rejectTool: (toolInvocationId: string, reason?: string) => Promise<void>;
    alwaysAllowTool: (toolInvocationId: string, toolName: string) => Promise<void>;
}

// =============================================================================
// Provider Props
// =============================================================================

export interface AgentProviderProps {
    /** Inference SDK client instance */
    client: Inference;
    /** Agent configuration (ad-hoc or template reference) */
    config: AgentOptions;
    /** Optional name for ad-hoc agents (used for deduplication and display) */
    name?: string;
    /** Optional existing chat ID to continue */
    chatId?: string;
    /** Callback when a new chat is created */
    onChatCreated?: (chatId: string) => void;
    /** Callback when chat status changes */
    onStatusChange?: (status: AgentUIStatus) => void;
    /** Callback when an error occurs */
    onError?: (error: Error) => void;
    /** Children */
    children: ReactNode;
}

// =============================================================================
// Component Props
// =============================================================================

export interface AgentProps {
    /**
     * Proxy URL for browser-safe API calls (recommended for frontend apps)
     * @example "/api/inference/proxy"
     */
    proxyUrl?: string;
    /** Direct API key (use only in secure environments, not recommended for browsers) */
    apiKey?: string;
    /** Agent configuration */
    config: AgentOptions;
    /** Optional name for ad-hoc agents (used for deduplication and display) */
    name?: string;
    /** Optional existing chat ID */
    chatId?: string;
    /** Additional CSS classes */
    className?: string;
    /** Compact mode (no header) */
    compact?: boolean;
    /** Allow file attachments (default: true) */
    allowFiles?: boolean;
    /** Allow image attachments (default: true) */
    allowImages?: boolean;
    /** Callback when chat is created */
    onChatCreated?: (chatId: string) => void;
    /** Description for empty state (used with template configs) */
    description?: string;
    /** Example prompts for empty state (used with template configs) */
    examplePrompts?: string[];
}

export interface ChatMessagesProps {
    children: (props: { messages: ChatMessageDTO[] }) => ReactNode;
    className?: string;
    scrollToTopPadding?: boolean;
}

export interface ChatInputProps {
    placeholder?: string;
    className?: string;
    /** @deprecated Use allowFiles and allowImages instead */
    allowAttachments?: boolean;
    /** Allow file attachments (default: true) */
    allowFiles?: boolean;
    /** Allow image attachments (default: true) */
    allowImages?: boolean;
    onFilesChange?: (files: File[]) => void;
}

export interface MessageBubbleProps {
    message: ChatMessageDTO;
    children?: ReactNode;
    className?: string;
}

export interface MessageContentProps {
    message: ChatMessageDTO;
    className?: string;
    truncate?: boolean;
}

export interface ToolInvocationProps {
    invocation: ToolInvocationDTO;
    className?: string;
    defaultOpen?: boolean;
}

export interface ToolInvocationsProps {
    message: ChatMessageDTO;
    className?: string;
}

export interface MessageReasoningProps {
    reasoning: string;
    isReasoning?: boolean;
    className?: string;
}

export interface ChatContainerProps {
    children: ReactNode;
    className?: string;
}

// =============================================================================
// Client Tools (types imported from SDK, helpers defined here)
// =============================================================================

export function isClientTool(tool: AgentTool | ClientTool): tool is ClientTool {
    return 'handler' in tool && 'schema' in tool;
}

export function extractToolSchemas(tools: (AgentTool | ClientTool)[]): AgentTool[] {
    return tools.map(t => isClientTool(t) ? t.schema : t);
}

export function extractClientToolHandlers(
    tools: (AgentTool | ClientTool)[]
): Map<string, ClientToolHandler> {
    const handlers = new Map<string, ClientToolHandler>();
    for (const tool of tools) {
        if (isClientTool(tool)) {
            handlers.set(tool.schema.name, tool.handler);
        }
    }
    return handlers;
}

// =============================================================================
// Constants (re-exported from SDK)
// =============================================================================

export {
    ChatMessageRoleUser,
    ChatMessageRoleAssistant,
    ChatMessageRoleTool,
    ChatMessageRoleSystem,
    ChatMessageContentTypeText,
    ChatMessageContentTypeReasoning,
    ChatMessageContentTypeImage,
    ChatMessageContentTypeFile,
    ChatMessageStatusReady,
    ChatMessageStatusFailed,
    ChatMessageStatusCancelled,
    ToolTypeClient,
    ToolTypeApp,
    ToolInvocationStatusPending,
    ToolInvocationStatusInProgress,
    ToolInvocationStatusAwaitingInput,
    ToolInvocationStatusAwaitingApproval,
    ToolInvocationStatusCompleted,
    ToolInvocationStatusFailed,
    ToolInvocationStatusCancelled,
} from '@inferencesh/sdk';

// =============================================================================
// Widget Types (for tool output rendering)
// =============================================================================

export const WidgetTypeUI = 'ui';
export const WidgetTypeHTML = 'html';

export interface WidgetNode {
    type: string;
    // Text/title/caption nodes
    value?: string;
    variant?: string;
    size?: string;
    weight?: string;
    color?: string;
    // Label
    fieldName?: string;
    // Image
    src?: string;
    alt?: string;
    height?: number | string;
    width?: number | string;
    // Badge/Icon
    label?: string;
    iconName?: string;
    // Button - actions attached directly
    /** @deprecated Use onClickAction instead */
    action?: WidgetAction;
    /** Action triggered when element is clicked */
    onClickAction?: WidgetAction;
    disabled?: boolean;
    // Input/Textarea
    name?: string;
    placeholder?: string;
    defaultValue?: string;
    required?: boolean;
    rows?: number;
    /** Action triggered when input value changes */
    onChangeAction?: WidgetAction;
    // Select/Radio
    options?: { value: string; label: string }[];
    // Checkbox
    defaultChecked?: boolean;
    /** Action triggered when checkbox is toggled */
    onCheckedChangeAction?: WidgetAction;
    // Layout
    children?: WidgetNode[];
    gap?: number;
    align?: string;
    justify?: string;
    direction?: string;
    padding?: number;
    background?: string | { light?: string; dark?: string };
    radius?: string;
    /** Minimum height in pixels or CSS value */
    minHeight?: number | string;
    /** Maximum height in pixels or CSS value */
    maxHeight?: number | string;
    /** Minimum width in pixels or CSS value */
    minWidth?: number | string;
    /** Maximum width in pixels or CSS value */
    maxWidth?: number | string;
    /** Aspect ratio (e.g., "16/9", "4/3", "1/1") */
    aspectRatio?: string;
    // Spacer/Divider
    minSize?: number;
    spacing?: number;
    // Form
    onSubmitAction?: WidgetAction;
    // Card
    /** Treat Card as Form, collecting child inputs on confirm */
    asForm?: boolean;
    /** Card confirm action (used when asForm=true) */
    confirmAction?: WidgetAction;
}

/**
 * Widget action configuration - attached directly to interactive elements
 * @example
 * { type: "submit", payload: { id: 123 }, handler: "server", loadingBehavior: "self" }
 */
export interface WidgetAction {
    /** Action type identifier */
    type: string;
    /** Optional payload data */
    payload?: Record<string, unknown>;
    /** Handler location: 'server' (default) sends to backend, 'client' calls local callback */
    handler?: 'server' | 'client';
    /** Loading behavior when action is triggered */
    loadingBehavior?: 'auto' | 'self' | 'container' | 'none';
}

export interface WidgetFormData {
    [key: string]: string | boolean | undefined;
}

/**
 * Widget structure
 * Note: `actions` array (card footer buttons) is deprecated.
 * Use `onClickAction` on buttons/elements instead.
 */
export interface Widget {
    type: string;
    title?: string;
    html?: string;
    content?: string;
    children?: WidgetNode[];
    /** @deprecated - Use onClickAction on individual elements instead */
    actions?: { label: string; variant?: string; action: WidgetAction }[];
    [key: string]: unknown;
}

// =============================================================================
// Tool Finish Types
// =============================================================================

export interface ToolFinish {
    status: string;
    result?: unknown;
    error?: string;
}

export const ToolFinishStatusSucceeded = 'succeeded';
export const ToolFinishStatusFailed = 'failed';
export const ToolFinishStatusCancelled = 'cancelled';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if a chat message status is terminal (generation complete)
 */
export function isTerminalChatMessageStatus(status: string | undefined): boolean {
    return status === 'ready' || status === 'failed' || status === 'cancelled';
}
