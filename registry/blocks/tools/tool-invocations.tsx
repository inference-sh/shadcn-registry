/**
 * ToolInvocations Primitive
 *
 * Displays all tool invocations for a message.
 * When there are many calls, completed ones collapse into a compact summary.
 */

import React, { memo, useState } from 'react';
import { cn } from '@/lib/utils';
import { ToolInvocation } from '@/components/infsh/agent/tool-invocation';
import {
  ToolInvocationStatusAwaitingInput,
  ToolInvocationStatusAwaitingApproval,
  ToolInvocationStatusFailed,
  ToolInvocationStatusCompleted,
  type ChatMessageDTO,
  type ToolInvocationDTO,
} from '@inferencesh/sdk';
import { ChevronRight } from 'lucide-react';

const COLLAPSE_THRESHOLD = 3;

// Single tool row height: CollapsibleSection trigger (same as reasoning)
const TOOL_ROW_HEIGHT = 20
// Collapse toggle button: text-xs + icon + gap
const COLLAPSE_BUTTON_HEIGHT = 20
// space-y-1 gap between tool rows
const TOOL_GAP = 4
// mt-2 before the tool section
const TOOL_SECTION_GAP = 8
// Finish block: my-6 (48px) + divider row (~24px) + result card (~48px)
const FINISH_BLOCK_HEIGHT = 120

/**
 * Returns the predicted height of a tool invocations section.
 * Components own their measurement — strategy just calls this.
 */
export function measureToolInvocations(invocations: ToolInvocationDTO[] | undefined): number {
  if (!invocations?.length) return 0

  // Check for finish tool — different layout
  const hasFinish = invocations.some(inv => inv.function?.name === 'finish')
  if (hasFinish) return TOOL_SECTION_GAP + FINISH_BLOCK_HEIGHT

  const count = invocations.length
  if (count < COLLAPSE_THRESHOLD) {
    // All expanded as rows
    return TOOL_SECTION_GAP + count * TOOL_ROW_HEIGHT + (count - 1) * TOOL_GAP
  }

  // Prominent (needs attention) shown + collapse button + collapsed summary
  let prominent = 0
  for (const inv of invocations) {
    if (needsAttention(inv)) prominent++
  }
  const visibleRows = prominent
  return TOOL_SECTION_GAP + visibleRows * TOOL_ROW_HEIGHT + (visibleRows > 0 ? visibleRows * TOOL_GAP : 0) + COLLAPSE_BUTTON_HEIGHT
}

function needsAttention(inv: ToolInvocationDTO): boolean {
  return inv.status === ToolInvocationStatusAwaitingInput ||
    inv.status === ToolInvocationStatusAwaitingApproval ||
    inv.status === ToolInvocationStatusFailed ||
    !!inv.widget;
}

interface ToolInvocationsProps {
  message: ChatMessageDTO;
  className?: string;
}

export const ToolInvocations = memo(function ToolInvocations({
  message,
  className,
}: ToolInvocationsProps) {
  const invocations = message.tool_invocations;
  const [expanded, setExpanded] = useState(false);

  if (!invocations || invocations.length === 0) {
    return null;
  }

  if (invocations.length < COLLAPSE_THRESHOLD) {
    return (
      <div className={cn('mt-2 space-y-1', className)}>
        {invocations.map((inv, idx) => (
          <ToolInvocation key={inv.id || idx} invocation={inv} />
        ))}
      </div>
    );
  }

  const prominent: ToolInvocationDTO[] = [];
  const collapsible: ToolInvocationDTO[] = [];
  for (const inv of invocations) {
    (needsAttention(inv) ? prominent : collapsible).push(inv);
  }

  const completedCount = collapsible.filter(inv => inv.status === ToolInvocationStatusCompleted).length;
  const runningCount = collapsible.length - completedCount;
  const summary = runningCount > 0
    ? `${completedCount} completed, ${runningCount} running`
    : `${collapsible.length} tool calls`;

  return (
    <div className={cn('mt-2 space-y-1', className)}>
      {prominent.map((inv, idx) => (
        <ToolInvocation key={inv.id || idx} invocation={inv} />
      ))}

      {collapsible.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setExpanded(prev => !prev)}
            className="flex items-center gap-1 px-0.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            <ChevronRight className={cn('h-3 w-3 transition-transform', expanded && 'rotate-90')} />
            <span>{summary}</span>
          </button>
          {expanded && (
            <div className="space-y-1">
              {collapsible.map((inv, idx) => (
                <ToolInvocation key={inv.id || idx} invocation={inv} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
});

ToolInvocations.displayName = 'ToolInvocations';
