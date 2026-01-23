/**
 * Agent Chat Actions
 * 
 * Action creators using the Inference SDK Agent for all API operations.
 */

import type { Dispatch } from 'react';
import type { Agent, Inference, ChatDTO, ChatMessageDTO } from '@inferencesh/sdk';
import { ToolTypeClient, ToolInvocationStatusAwaitingInput } from '@inferencesh/sdk';
import type {
    AgentOptions,
    AgentUIStatus,
    AgentActions,
    ClientToolHandlerFn,
} from '@/components/agent/types';
import {
    isAdHocConfig,
    extractClientToolHandlers,
    extractToolSchemas,
} from '@/components/agent/types';
import type { ChatAction } from '@/components/agent/lib/reducer';

// =============================================================================
// Track dispatched client tool invocations to prevent duplicates
// =============================================================================

const dispatchedToolInvocations = new Set<string>();

// =============================================================================
// Actions Context Interface
// =============================================================================

export interface ActionsContext {
    dispatch: Dispatch<ChatAction>;
    getClient: () => Inference;
    getAgent: () => Agent | null;
    setAgent: (agent: Agent | null) => void;
    getConfig: () => AgentOptions | null;
    getAgentName: () => string | undefined;
    getChatId: () => string | null;
    getClientToolHandlers: () => Map<string, ClientToolHandlerFn>;
    callbacks: {
        onChatCreated?: (chatId: string) => void;
        onStatusChange?: (status: AgentUIStatus) => void;
        onError?: (error: Error) => void;
    };
}

// =============================================================================
// Action Creators
// =============================================================================

export interface InternalActions {
    setChatId: (newChatId: string | null) => void;
    stopStream: () => void;
}

export interface ActionsResult {
    publicActions: AgentActions;
    internalActions: InternalActions;
}

export function createActions(ctx: ActionsContext): ActionsResult {
    const { dispatch, getClient, getAgent, setAgent, getConfig, getAgentName, getChatId, getClientToolHandlers, callbacks } = ctx;

    // =========================================================================
    // Internal helpers
    // =========================================================================

    const setChat = (chat: ChatDTO | null) => {
        dispatch({ type: 'SET_CHAT', payload: chat });
        if (chat) {
            // CRITICAL: Set chatId from the chat so streaming updates aren't filtered
            // The updateMessage function filters messages where chat_id !== getChatId()
            // Without this, all streaming updates are discarded because chatId is null
            const currentChatId = getChatId();
            if (!currentChatId && chat.id) {
                dispatch({ type: 'SET_CHAT_ID', payload: chat.id });
                callbacks.onChatCreated?.(chat.id);
            }

            const status = chat.status === 'busy' ? 'streaming' : 'idle';
            callbacks.onStatusChange?.(status);
        }
    };

    const updateMessage = (message: ChatMessageDTO) => {
        const chatId = getChatId();
        if (message.chat_id !== chatId) return;

        dispatch({ type: 'UPDATE_MESSAGE', payload: message });

        // Check for client tool invocations that need execution
        const clientToolHandlers = getClientToolHandlers();
        if (message.tool_invocations && chatId && clientToolHandlers.size > 0) {
            for (const invocation of message.tool_invocations) {
                if (
                    invocation.type === ToolTypeClient &&
                    invocation.status === ToolInvocationStatusAwaitingInput
                ) {
                    // Skip if already dispatched
                    if (dispatchedToolInvocations.has(invocation.id)) {
                        continue;
                    }
                    dispatchedToolInvocations.add(invocation.id);

                    const functionName = invocation.function?.name || '';
                    const handler = clientToolHandlers.get(functionName);

                    if (!handler) {
                        console.warn(`[Agent] No handler for client tool: ${functionName}`);
                        const agent = getAgent();
                        agent?.submitToolResult(invocation.id, JSON.stringify({
                            error: `No handler registered for tool: ${functionName}`
                        }));
                        continue;
                    }

                    // Execute the handler
                    const args = invocation.function?.arguments || {};
                    handler(args)
                        .then((result) => {
                            const agent = getAgent();
                            agent?.submitToolResult(invocation.id, result);
                        })
                        .catch((error) => {
                            console.error(`[Agent] Client tool ${functionName} error:`, error);
                            const agent = getAgent();
                            agent?.submitToolResult(invocation.id, JSON.stringify({
                                error: String(error)
                            }));
                        });
                }
            }
        }
    };

    const createAgent = (): Agent | null => {
        const config = getConfig();
        const agentName = getAgentName();
        const client = getClient();
        if (!config) return null;

        if (isAdHocConfig(config)) {
            // Extract just schemas (strip handlers)
            const toolSchemas = config.tools ? extractToolSchemas(config.tools) : undefined;
            return client.agent({
                ...config,
                tools: toolSchemas,
            }, { name: agentName });
        } else {
            return client.agent(config.agent);
        }
    };

    const stopStream = () => {
        const agent = getAgent();
        agent?.disconnect();
        dispatch({ type: 'SET_STATUS', payload: 'idle' });
        dispatch({ type: 'SET_IS_GENERATING', payload: false });
        callbacks.onStatusChange?.('idle');
    };

    // =========================================================================
    // Public Actions
    // =========================================================================

    const publicActions: AgentActions = {
        sendMessage: async (text: string, files?: (Blob | import('@inferencesh/sdk').File)[]) => {
            const config = getConfig();
            if (!config) {
                console.error('[Agent] No agent config provided');
                return;
            }

            const trimmedText = text.trim();
            if (!trimmedText) return;

            // Get or create agent
            let agent = getAgent();
            if (!agent) {
                agent = createAgent();
                if (!agent) {
                    console.error('[Agent] Failed to create agent');
                    return;
                }
                setAgent(agent);
            }

            // Update status
            dispatch({ type: 'SET_STATUS', payload: 'streaming' });
            dispatch({ type: 'SET_ERROR', payload: undefined });
            callbacks.onStatusChange?.('streaming');

            try {
                // Pass files directly - SDK detects FileDTO by uri property, uploads Blobs
                const { assistantMessage } = await agent.sendMessage(trimmedText, {
                    files: files,
                });

                // Get the chatId
                const newChatId = assistantMessage.chat_id;
                if (newChatId && newChatId !== getChatId()) {
                    dispatch({ type: 'SET_CHAT_ID', payload: newChatId });
                    callbacks.onChatCreated?.(newChatId);
                }

                // Start streaming (like frontend/app's streamChat pattern)
                agent.startStreaming({
                    onMessage: (message: ChatMessageDTO) => {
                        updateMessage(message);
                    },
                    onChat: (chat: ChatDTO) => {
                        setChat(chat);
                    },
                });

                // Fetch the full chat to get complete messages
                // This is the key step that frontend/app does in streamChat
                const currentChatId = getChatId() || newChatId;
                if (currentChatId) {
                    const fullChat = await agent.getChat(currentChatId);
                    if (fullChat) {
                        setChat(fullChat);
                    }
                }

            } catch (error) {
                console.error('[Agent] Failed to send message:', error);
                const err = error instanceof Error ? error : new Error('Failed to send message');
                dispatch({ type: 'SET_STATUS', payload: 'error' });
                dispatch({ type: 'SET_ERROR', payload: err.message });
                callbacks.onError?.(err);
            }
        },

        stopGeneration: () => {
            const agent = getAgent();
            stopStream();
            agent?.stopChat();
        },

        reset: () => {
            const agent = getAgent();
            agent?.reset();
            setAgent(null);
            dispatchedToolInvocations.clear();
            dispatch({ type: 'RESET' });
        },

        clearError: () => {
            dispatch({ type: 'SET_ERROR', payload: undefined });
            dispatch({ type: 'SET_STATUS', payload: 'idle' });
        },

        submitToolResult: async (toolInvocationId: string, result: string) => {
            try {
                const agent = getAgent();
                if (!agent) throw new Error('No active agent');
                await agent.submitToolResult(toolInvocationId, result);
            } catch (error) {
                console.error('[Agent] Failed to submit tool result:', error);
                const err = error instanceof Error ? error : new Error('Failed to submit tool result');
                dispatch({ type: 'SET_STATUS', payload: 'error' });
                dispatch({ type: 'SET_ERROR', payload: err.message });
                callbacks.onError?.(err);
                throw error;
            }
        },

        approveTool: async (toolInvocationId: string) => {
            try {
                const client = getClient();
                await client._request('post', `/tools/${toolInvocationId}/invoke`);
            } catch (error) {
                console.error('[Agent] Failed to approve tool:', error);
                const err = error instanceof Error ? error : new Error('Failed to approve tool');
                dispatch({ type: 'SET_STATUS', payload: 'error' });
                dispatch({ type: 'SET_ERROR', payload: err.message });
                callbacks.onError?.(err);
                throw error;
            }
        },

        rejectTool: async (toolInvocationId: string, reason?: string) => {
            try {
                const client = getClient();
                await client._request('post', `/tools/${toolInvocationId}/reject`, { data: { reason } });
            } catch (error) {
                console.error('[Agent] Failed to reject tool:', error);
                const err = error instanceof Error ? error : new Error('Failed to reject tool');
                dispatch({ type: 'SET_STATUS', payload: 'error' });
                dispatch({ type: 'SET_ERROR', payload: err.message });
                callbacks.onError?.(err);
                throw error;
            }
        },

        alwaysAllowTool: async (toolInvocationId: string, toolName: string) => {
            const chatId = getChatId();
            if (!chatId) {
                console.error('[Agent] Cannot always-allow tool without a chatId');
                return;
            }

            try {
                const client = getClient();
                await client._request('post', `/chats/${chatId}/tools/${toolInvocationId}/always-allow`, {
                    data: { tool_name: toolName }
                });
            } catch (error) {
                console.error('[Agent] Failed to always-allow tool:', error);
                const err = error instanceof Error ? error : new Error('Failed to always-allow tool');
                dispatch({ type: 'SET_STATUS', payload: 'error' });
                dispatch({ type: 'SET_ERROR', payload: err.message });
                callbacks.onError?.(err);
                throw error;
            }
        },
    };

    const internalActions: InternalActions = {
        stopStream,
        setChatId: (newChatId: string | null) => {
            const currentChatId = getChatId();
            if (newChatId === currentChatId) return;

            if (!newChatId) {
                stopStream();
                dispatchedToolInvocations.clear();
                dispatch({ type: 'RESET' });
                return;
            }

            dispatch({ type: 'SET_CHAT_ID', payload: newChatId });
        },
    };

    return { publicActions, internalActions };
}

// =============================================================================
// Helper: Extract client tool handlers from config
// =============================================================================

export function getClientToolHandlers(config: AgentOptions | null): Map<string, ClientToolHandlerFn> {
    if (!config || !isAdHocConfig(config) || !config.tools) {
        return new Map();
    }
    return extractClientToolHandlers(config.tools);
}
