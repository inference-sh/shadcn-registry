/**
 * Agent Chat Internal Reducer
 * 
 * Pure reducer for chat state management.
 */

import type { ChatDTO, ChatMessageDTO, AgentState, AgentUIStatus } from '@/components/agent/types';

// =============================================================================
// Action Types
// =============================================================================

export type ChatAction =
    | { type: 'SET_CHAT_ID'; payload: string | null }
    | { type: 'SET_CHAT'; payload: ChatDTO | null }
    | { type: 'SET_MESSAGES'; payload: ChatMessageDTO[] }
    | { type: 'UPDATE_MESSAGE'; payload: ChatMessageDTO }
    | { type: 'ADD_MESSAGE'; payload: ChatMessageDTO }
    | { type: 'SET_STATUS'; payload: AgentUIStatus }
    | { type: 'SET_IS_GENERATING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | undefined }
    | { type: 'RESET' };

// =============================================================================
// Initial State
// =============================================================================

export const initialState: AgentState = {
    chatId: null,
    messages: [],
    status: 'idle',
    isGenerating: false,
    error: undefined,
    chat: null,
};

// =============================================================================
// Reducer
// =============================================================================

export function chatReducer(state: AgentState, action: ChatAction): AgentState {
    switch (action.type) {
        case 'SET_CHAT_ID':
            return { ...state, chatId: action.payload };

        case 'SET_CHAT': {
            const chat = action.payload;
            if (!chat) {
                return { ...state, chat: null, messages: [], isGenerating: false, status: 'idle' };
            }
            // Populate messages from chat.chat_messages (initial load and refreshes)
            const messages = [...(chat.chat_messages || [])].sort((a, b) => a.order - b.order);
            const isGenerating = chat.status === 'busy';
            const status = isGenerating ? 'streaming' : 'idle';
            return { ...state, chat, messages, isGenerating, status };
        }

        case 'SET_MESSAGES':
            return { ...state, messages: action.payload };

        case 'UPDATE_MESSAGE': {
            const message = action.payload;
            const existingIndex = state.messages.findIndex((m) => m.id === message.id);
            let newMessages: ChatMessageDTO[];
            if (existingIndex !== -1) {
                newMessages = [...state.messages];
                newMessages[existingIndex] = message;
            } else {
                newMessages = [...state.messages, message].sort((a, b) => a.order - b.order);
            }
            return { ...state, messages: newMessages };
        }

        case 'ADD_MESSAGE':
            return {
                ...state,
                messages: [...state.messages, action.payload].sort((a, b) => a.order - b.order),
            };

        case 'SET_STATUS':
            return {
                ...state,
                status: action.payload,
                isGenerating: action.payload === 'streaming' || action.payload === 'connecting',
            };

        case 'SET_IS_GENERATING':
            return { ...state, isGenerating: action.payload };

        case 'SET_ERROR':
            return { ...state, error: action.payload };

        case 'RESET':
            return initialState;

        default:
            return state;
    }
}
