import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, ExternalLink, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface RequirementError {
  type: string;
  key: string;
  message: string;
  action?: {
    type: string;
    provider: string;
    provider_name?: string;
    scopes?: string[];
  };
}

interface IntegrationRequirementCardProps {
  errors: RequirementError[];
  /** Tool names that are blocked (e.g. ["gmail_list_messages", "calendar_list_events"]) */
  toolNames?: string[];
  className?: string;
}

/**
 * Compact inline card shown in agent chat when tool invocations are blocked on
 * missing integration or scopes. The backend integration projector automatically
 * retries blocked tools when the user connects.
 */
export const IntegrationRequirementCard = React.memo(function IntegrationRequirementCard({
  errors,
  toolNames,
  className,
}: IntegrationRequirementCardProps) {
  // Group by provider, collect all scopes
  const providers = new Map<string, { name: string; isConnect: boolean; scopes: string[] }>();
  for (const err of errors) {
    const provider = err.action?.provider;
    if (!provider) continue;

    if (!providers.has(provider)) {
      providers.set(provider, {
        name: err.action?.provider_name || provider,
        isConnect: err.action?.type === 'connect',
        scopes: [],
      });
    }

    const entry = providers.get(provider)!;
    if (err.action?.scopes) {
      for (const scope of err.action.scopes) {
        if (!entry.scopes.includes(scope)) {
          entry.scopes.push(scope);
        }
      }
    }
  }

  const providerEntries = Array.from(providers.entries());
  if (providerEntries.length === 0) return null;

  const isSingleConnect = providerEntries.length === 1 && providerEntries[0][1].isConnect;

  // Format tool names for display
  const toolsLabel = toolNames && toolNames.length > 0
    ? toolNames.map(n => n.replace(/_/g, ' ')).join(', ')
    : null;

  return (
    <div className={cn('flex flex-col items-start', className)}>
      <div className="overflow-hidden rounded-lg border border-amber-500/20 bg-amber-500/5 max-w-sm w-full">
        <div className="flex items-center gap-2 px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium">
              {isSingleConnect
                ? `${providerEntries[0][1].name} not connected`
                : `${providerEntries[0][1].name} — missing permissions`}
            </span>
            {toolsLabel && (
              <span className="text-[10px] text-muted-foreground ml-1.5">
                ({toolsLabel})
              </span>
            )}
          </div>
          {providerEntries.map(([provider, entry]) => (
            <Button
              key={provider}
              size="sm"
              variant="outline"
              className="h-6 px-2 text-[11px] shrink-0"
              render={<a href={`/settings/integrations/${provider}`} target="_blank" rel="noopener noreferrer" />}
            >
                {entry.isConnect ? 'connect' : 'add permissions'}
                <ExternalLink className="ml-1 h-2.5 w-2.5" />
            </Button>
          ))}
        </div>

        {/* Show scopes if missing permissions (not connect) */}
        {!isSingleConnect && providerEntries.some(([, e]) => e.scopes.length > 0) && (
          <div className="flex flex-wrap gap-1 px-3 pb-2">
            {providerEntries.flatMap(([, entry]) =>
              entry.scopes.map((scope) => (
                <span
                  key={scope}
                  className="inline-flex items-center rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground"
                >
                  {scope}
                </span>
              ))
            )}
          </div>
        )}

        <div className="px-3 pb-1.5">
          <p className="text-[10px] text-muted-foreground/50">
            will retry automatically after connecting
          </p>
        </div>
      </div>
    </div>
  );
});
