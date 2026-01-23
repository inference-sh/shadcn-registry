/**
 * Agent Chat Context
 * 
 * React context for agent chat state and actions.
 */

import { createContext } from 'react';
import type { Inference } from '@inferencesh/sdk';
import type { AgentState, AgentActions } from '@/components/agent/types';

export interface AgentContextValue {
    state: AgentState;
    actions: AgentActions;
    client: Inference;
}

export const AgentContext = createContext<AgentContextValue | null>(null);
