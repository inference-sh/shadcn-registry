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

// Collapsed CollapsibleSection trigger height
const TOOL_ROW_HEIGHT = 20
// Collapse toggle button: text-xs + icon + gap
const COLLAPSE_BUTTON_HEIGHT = 20
// space-y-1 gap between tool rows
const TOOL_GAP = 4
// Finish block: my-6 (48px) + divider row (~24px) + result card (~48px)
const FINISH_BLOCK_HEIGHT = 120
// Approval UI: header + arguments + buttons
const APPROVAL_HEIGHT = 100
// Widget: variable, but reasonable default (RO corrects)
const WIDGET_HEIGHT = 200

/**
 * Returns the predicted height of a single tool invocation.
 * Accounts for different render paths: finish, widget, approval, regular.
 */
function measureSingleTool(inv: ToolInvocationDTO): number {
  // Finish tool
  if (inv.function?.name === 'finish') return FINISH_BLOCK_HEIGHT

  // Widget (default open, variable height)
  if (inv.widget) return WIDGET_HEIGHT

  // Awaiting approval (expanded by default with buttons)
  if (inv.status === ToolInvocationStatusAwaitingApproval) return APPROVAL_HEIGHT

  // Regular collapsed row
  return TOOL_ROW_HEIGHT
}

/**
 * Returns the predicted height of a tool invocations section.
 * Components own their measurement — strategy just calls this.
 */
export function measureToolInvocations(invocations: ToolInvocationDTO[] | undefined): number {
  if (!invocations?.length) return 0

  const count = invocations.length
  if (count < COLLAPSE_THRESHOLD) {
    // All shown individually
    let height = 0
    for (const inv of invocations) {
      height += measureSingleTool(inv) + TOOL_GAP
    }
    return height - TOOL_GAP // no trailing gap
  }

  // Prominent (needs attention) shown individually + collapse button for rest
  let height = 0
  let collapsibleCount = 0
  for (const inv of invocations) {
    if (needsAttention(inv)) {
      height += measureSingleTool(inv) + TOOL_GAP
    } else {
      collapsibleCount++
    }
  }
  if (collapsibleCount > 0) height += COLLAPSE_BUTTON_HEIGHT
  return height
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
      <div className={cn('space-y-1', className)}>
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
