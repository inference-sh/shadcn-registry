/**
 * Agent Chat Hooks
 * 
 * Public hooks for accessing chat state and actions.
 */

import { useContext } from 'react';
import { AgentContext } from '@/components/agent/context';
import type { AgentState, AgentActions, ChatMessageDTO } from '@/components/agent/types';

/**
 * Hook to access chat state
 */
export function useAgent(): AgentState {
    const context = useContext(AgentContext);

    if (!context) {
        throw new Error(
            'useAgent must be used within an AgentProvider. ' +
            'Wrap your component tree with <AgentProvider>.'
        );
    }

    return context.state;
}

/**
 * Hook to access chat actions
 */
export function useAgentActions(): AgentActions {
    const context = useContext(AgentContext);

    if (!context) {
        throw new Error(
            'useAgentActions must be used within an AgentProvider. ' +
            'Wrap your component tree with <AgentProvider>.'
        );
    }

    return context.actions;
}

/**
 * Hook to access a specific message by ID
 */
export function useMessage(messageId: string): ChatMessageDTO | undefined {
    const { messages } = useAgent();
    return messages.find((m) => m.id === messageId);
}

/**
 * Hook to access both state and actions
 */
export function useAgentContext(): { state: AgentState; actions: AgentActions } {
    const context = useContext(AgentContext);

    if (!context) {
        throw new Error(
            'useAgentContext must be used within an AgentProvider. ' +
            'Wrap your component tree with <AgentProvider>.'
        );
    }

    return context;
}
