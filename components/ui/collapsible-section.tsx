import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleSectionProps {
  icon: React.ReactNode;
  label: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isActive?: boolean;
  preview?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export const CollapsibleSection = memo(function CollapsibleSection({
  icon,
  label,
  open,
  onOpenChange,
  isActive,
  preview,
  className,
  children,
}: CollapsibleSectionProps) {
  return (
    <div className={cn('flex flex-col items-start w-fit', className)}>
      <Collapsible
        open={open}
        onOpenChange={onOpenChange}
        className="group w-full text-muted-foreground"
      >
        <div className="flex items-center px-0 py-0.5">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground cursor-pointer">
              {icon}
              <span className={cn('lowercase', isActive && 'animate-pulse')}>
                {label}
              </span>
              {!open && preview}
              {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent
          className={cn(
            open && 'border border-border bg-muted/10 rounded-xl mt-1'
          )}
        >
          {children}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
});

CollapsibleSection.displayName = 'CollapsibleSection';
