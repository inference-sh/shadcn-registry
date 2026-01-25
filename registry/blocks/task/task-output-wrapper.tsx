'use client';

/**
 * TaskOutputWrapper
 *
 * A self-contained component that fetches and streams a task by ID.
 * Combines useTask hook with TaskOutput for easy drop-in usage.
 *
 * Can be used with an explicit client prop, or will try to get the client
 * from AgentContext when used within an AgentProvider.
 *
 * @example
 * ```tsx
 * // With explicit client
 * const client = new Inference({ apiKey: 'your-key' });
 * <TaskOutputWrapper client={client} taskId="abc123" />
 *
 * // Within AgentProvider (client comes from context)
 * <AgentProvider client={client} config={...}>
 *   <TaskOutputWrapper taskId="abc123" />
 * </AgentProvider>
 * ```
 */

import React, { memo, useCallback, useContext } from 'react';
import type { Inference, TaskDTO as Task } from '@inferencesh/sdk';
import { cn } from '@/lib/utils';
import { useTask } from '@/hooks/use-task';
import { TaskOutput } from '@/components/task/task-output';

// Import AgentContext for optional client retrieval
// This makes the component work within AgentProvider without explicit client
let AgentContext: React.Context<{ client: Inference } | null> | null = null;
try {
  // Dynamic import to avoid circular dependencies
  AgentContext = require('@/components/agent/context').AgentContext;
} catch {
  // AgentContext not available, client prop will be required
}

export interface TaskOutputWrapperProps {
  /** The inference client instance (optional if used within AgentProvider) */
  client?: Inference;
  /** The task ID to display */
  taskId: string;
  /** Additional CSS classes */
  className?: string;
  /** Compact mode (no card wrapper) */
  compact?: boolean;
  /** Show error details */
  showError?: boolean;
  /** Called when task data updates */
  onUpdate?: (task: Task) => void;
  /** Called when task reaches terminal status */
  onComplete?: (task: Task) => void;
  /** Called when an error occurs */
  onError?: (error: Error) => void;
  /** Called when cancel button is clicked */
  onCancel?: (taskId: string) => void;
}

export const TaskOutputWrapper = memo(function TaskOutputWrapper({
  client: clientProp,
  taskId,
  className,
  compact = false,
  showError = true,
  onUpdate,
  onComplete,
  onError,
  onCancel,
}: TaskOutputWrapperProps) {
  // Try to get client from context if not provided
  const contextValue = AgentContext ? useContext(AgentContext) : null;
  const client = clientProp ?? contextValue?.client;

  // If no client available, show error
  if (!client) {
    return (
      <div className={cn('p-4 text-sm text-red-500', className)}>
        Error: No client provided. Pass a client prop or use within AgentProvider.
      </div>
    );
  }

  const { task, isLoading, isStreaming } = useTask({
    client,
    taskId,
    onUpdate,
    onComplete,
    onError,
  });

  const handleCancel = useCallback(async () => {
    if (onCancel) {
      onCancel(taskId);
    } else {
      // Default cancel behavior using client
      try {
        await client.tasks.cancel(taskId);
      } catch (err) {
        onError?.(err instanceof Error ? err : new Error('Failed to cancel task'));
      }
    }
  }, [client, taskId, onCancel, onError]);

  return (
    <TaskOutput
      task={task}
      isLoading={isLoading}
      isStreaming={isStreaming}
      className={cn(className)}
      compact={compact}
      showError={showError}
      onCancel={handleCancel}
    />
  );
});
