/**
 * Agent Chat Provider
 * 
 * Uses React useReducer + Context with SDK Agent for API operations.
 */

import React, { useReducer, useRef, useEffect, useMemo } from 'react';
import type { Agent, Inference } from '@inferencesh/sdk';
import { AgentContext, type AgentContextValue } from '@/components/agent/context';
import { chatReducer, initialState } from '@/components/agent/lib/reducer';
import { createActions, getClientToolHandlers, type ActionsContext, type ActionsResult } from '@/components/agent/lib/actions';
import type { AgentProviderProps, AgentOptions, AgentUIStatus, ClientToolHandlerFn } from '@/components/agent/types';

/**
 * AgentProvider - Provides chat state and actions to children
 * 
 * @example
 * ```tsx
 * const client = new Inference({ proxyUrl: '/api/inference/proxy' });
 * 
 * <AgentProvider 
 *   client={client}
 *   agentConfig={{ core_app_ref: 'openrouter/claude-sonnet-4@abc123' }}
 * >
 *   <MyChatUI />
 * </AgentProvider>
 * ```
 */
export function AgentProvider({
  client,
  config,
  name,
  chatId,
  onChatCreated,
  onStatusChange,
  onError,
  children,
}: AgentProviderProps) {
  // Core state via useReducer
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Refs for mutable values that actions need access to
  const clientRef = useRef<Inference>(client);
  const agentRef = useRef<Agent | null>(null);
  const configRef = useRef<AgentOptions | null>(config);
  const agentNameRef = useRef<string | undefined>(name);
  const chatIdRef = useRef<string | null>(chatId ?? null);
  const clientToolHandlersRef = useRef<Map<string, ClientToolHandlerFn>>(
    getClientToolHandlers(config)
  );
  const callbacksRef = useRef<{
    onChatCreated?: (chatId: string) => void;
    onStatusChange?: (status: AgentUIStatus) => void;
    onError?: (error: Error) => void;
  }>({ onChatCreated, onStatusChange, onError });

  // Keep refs in sync with props
  useEffect(() => {
    clientRef.current = client;
  }, [client]);

  useEffect(() => {
    configRef.current = config;
    agentNameRef.current = name;
    clientToolHandlersRef.current = getClientToolHandlers(config);
  }, [config, name]);

  useEffect(() => {
    callbacksRef.current = { onChatCreated, onStatusChange, onError };
  }, [onChatCreated, onStatusChange, onError]);

  // Keep chatIdRef synced with state
  useEffect(() => {
    chatIdRef.current = state.chatId;
  }, [state.chatId]);

  // Create actions once (they use refs internally)
  const actionsContext = useMemo<ActionsContext>(() => ({
    dispatch,
    getClient: () => clientRef.current,
    getAgent: () => agentRef.current,
    setAgent: (agent) => { agentRef.current = agent; },
    getConfig: () => configRef.current,
    getAgentName: () => agentNameRef.current,
    getChatId: () => chatIdRef.current,
    getClientToolHandlers: () => clientToolHandlersRef.current,
    callbacks: callbacksRef.current,
  }), []);

  // Re-bind callbacks when they change
  useEffect(() => {
    actionsContext.callbacks = callbacksRef.current;
  }, [actionsContext, onChatCreated, onStatusChange, onError]);

  const actionsResultRef = useRef<ActionsResult | null>(null);
  if (!actionsResultRef.current) {
    actionsResultRef.current = createActions(actionsContext);
  }
  const { publicActions, internalActions } = actionsResultRef.current;

  // Handle initial chatId or chatId changes
  useEffect(() => {
    if (chatId && chatId !== state.chatId) {
      internalActions.setChatId(chatId);
    }
  }, [chatId, state.chatId, internalActions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      internalActions.stopStream();
    };
  }, [internalActions]);

  const contextValue = useMemo<AgentContextValue>(() => ({
    state,
    actions: publicActions,
    client,
  }), [state, publicActions, client]);

  return (
    <AgentContext.Provider value={contextValue}>
      {children}
    </AgentContext.Provider>
  );
}

AgentProvider.displayName = 'AgentProvider';
