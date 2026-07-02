'use client';

import React, {useState} from 'react';
import {ChevronDown, ChevronRight} from 'lucide-react';

interface CollapsibleNavSectionProps {
  title: string;
  icon: React.ComponentType<{className?: string}>;
  isCollapsed: boolean;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleNavSection({
  title,
  icon: Icon,
  isCollapsed,
  children,
  defaultOpen = true,
}: CollapsibleNavSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultOpen);

  if (isCollapsed) {
    return <>{children}</>;
  }

  return (
    <div>
      <button
        onClick={() => setIsExpanded(prev => !prev)}
        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors">
        <Icon className="size-4 shrink-0" />
        <span className="flex-1 text-left">{title}</span>
        {isExpanded ? (
          <ChevronDown className="size-3 shrink-0" />
        ) : (
          <ChevronRight className="size-3 shrink-0" />
        )}
      </button>
      {isExpanded && <div className="ml-4 space-y-1">{children}</div>}
    </div>
  );
}
