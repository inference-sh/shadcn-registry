/**
 * useTask Hook
 *
 * A standalone hook for fetching and streaming task updates from inference.sh.
 * Uses the SDK's StreamManager for real-time updates.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Inference, TaskDTO as Task } from '@inferencesh/sdk';
import {
  StreamManager,
  TaskStatusCompleted,
  TaskStatusFailed,
  TaskStatusCancelled
} from '@inferencesh/sdk';

export interface UseTaskOptions {
  /** The inference client instance */
  client: Inference;
  /** The task ID to fetch and stream */
  taskId: string;
  /** Called when task data updates */
  onUpdate?: (task: Task) => void;
  /** Called when task reaches terminal status */
  onComplete?: (task: Task) => void;
  /** Called when an error occurs */
  onError?: (error: Error) => void;
  /** Auto-reconnect on connection loss (default: true) */
  autoReconnect?: boolean;
  /** Maximum reconnection attempts (default: 5) */
  maxReconnects?: number;
}

export interface UseTaskResult {
  /** The current task data */
  task: Task | null;
  /** Whether the initial fetch is loading */
  isLoading: boolean;
  /** Whether streaming is active */
  isStreaming: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Refetch the task */
  refetch: () => Promise<void>;
  /** Stop streaming */
  stopStream: () => void;
}

/** Check if a task status is terminal (completed, failed, or cancelled) */
export function isTerminalStatus(status: number | undefined): boolean {
  return status !== undefined && [
    TaskStatusCompleted,
    TaskStatusFailed,
    TaskStatusCancelled
  ].includes(status);
}

/**
 * Internal SDK methods interface
 * These methods exist on the Inference class but aren't in the public type definitions yet.
 * Will be removed when SDK is updated with public getTask/streamTask methods.
 */
interface InferenceInternal {
  _request<T>(method: 'get' | 'post' | 'put' | 'delete', endpoint: string): Promise<T>;
  _createEventSource(endpoint: string): EventSource;
  // Public methods that may exist in newer SDK versions
  getTask?(taskId: string): Promise<Task>;
  streamTask?(taskId: string): EventSource;
}

/**
 * Hook for fetching and streaming task updates
 *
 * @example
 * ```tsx
 * const client = new Inference({ apiKey: 'your-key' });
 * const { task, isLoading, isStreaming } = useTask({
 *   client,
 *   taskId: 'abc123'
 * });
 * ```
 */
export function useTask({
  client,
  taskId,
  onUpdate,
  onComplete,
  onError,
  autoReconnect = true,
  maxReconnects = 5,
}: UseTaskOptions): UseTaskResult {
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const streamManagerRef = useRef<StreamManager<Task> | null>(null);
  const taskRef = useRef<Task | null>(null);

  // Cast client to access internal methods
  const internalClient = client as unknown as InferenceInternal;

  // Keep task ref in sync
  useEffect(() => {
    taskRef.current = task;
  }, [task]);

  const stopStream = useCallback(() => {
    if (streamManagerRef.current) {
      streamManagerRef.current.stop();
      streamManagerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const startStream = useCallback(() => {
    if (!taskId || !client) return;

    // Stop any existing stream
    stopStream();

    const manager = new StreamManager<Task>({
      createEventSource: async () => {
        // Use public method if available, otherwise fall back to internal
        if (internalClient.streamTask) {
          return internalClient.streamTask(taskId);
        }
        return internalClient._createEventSource(`/tasks/${taskId}/stream`);
      },
      autoReconnect,
      maxReconnects,
      reconnectDelayMs: 1000,
      onStart: () => setIsStreaming(true),
      onStop: () => setIsStreaming(false),
      onError: (err) => {
        setError(err);
        onError?.(err);
      },
      onData: (taskData: Task) => {
        setTask(taskData);
        onUpdate?.(taskData);

        if (isTerminalStatus(taskData.status)) {
          onComplete?.(taskData);
          manager.stopAfter(500);
        }
      },
      onPartialData: (partialData: Task, fields: string[]) => {
        const currentTask = taskRef.current;
        if (currentTask) {
          // Merge partial updates
          const updates = fields.reduce((acc, field) => {
            const key = field as keyof Task;
            (acc as Record<string, unknown>)[key] = partialData[key];
            return acc;
          }, {} as Partial<Task>);
          const mergedTask = { ...currentTask, ...updates };
          setTask(mergedTask);
          onUpdate?.(mergedTask);

          if (isTerminalStatus(mergedTask.status)) {
            onComplete?.(mergedTask);
            manager.stopAfter(500);
          }
        } else {
          setTask(partialData);
          onUpdate?.(partialData);
        }
      },
    });

    streamManagerRef.current = manager;
    manager.connect();
  }, [taskId, client, internalClient, autoReconnect, maxReconnects, onUpdate, onComplete, onError, stopStream]);

  const fetchTask = useCallback(async () => {
    if (!taskId || !client) return;

    setIsLoading(true);
    setError(null);

    try {
      // Use public method if available, otherwise fall back to internal
      let taskData: Task;
      if (internalClient.getTask) {
        taskData = await internalClient.getTask(taskId);
      } else {
        taskData = await internalClient._request<Task>('get', `/tasks/${taskId}`);
      }

      setTask(taskData);
      onUpdate?.(taskData);

      // Start streaming if task is not terminal
      if (!isTerminalStatus(taskData.status)) {
        startStream();
      } else {
        onComplete?.(taskData);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch task');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [taskId, client, internalClient, onUpdate, onComplete, onError, startStream]);

  // Fetch task on mount and when taskId changes
  useEffect(() => {
    fetchTask();

    return () => {
      stopStream();
    };
  }, [taskId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    task,
    isLoading,
    isStreaming,
    error,
    refetch: fetchTask,
    stopStream,
  };
}
