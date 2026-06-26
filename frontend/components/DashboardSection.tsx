'use client';

import { useState } from 'react';
import { ItemCard } from './ItemCard';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardSectionProps {
  title: string;
  icon: string;
  items: any[];
  emptyText?: string;
  defaultExpanded?: boolean;
  compact?: boolean;
  onItemUpdate?: (updated: any) => void;
  onItemDelete?: (id: string) => void;
  maxVisible?: number;
}

export function DashboardSection({
  title,
  icon,
  items,
  emptyText = 'No items here',
  defaultExpanded = true,
  compact = false,
  onItemUpdate,
  onItemDelete,
  maxVisible = 5,
}: DashboardSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? items : items.slice(0, maxVisible);
  const hasMore = items.length > maxVisible;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
      >
        <span className="text-base">{icon}</span>
        <span className="font-semibold text-sm flex-1 text-left">{title}</span>
        <span className={cn(
          'text-xs font-bold px-2 py-0.5 rounded-full',
          items.length > 0
            ? 'bg-primary/10 text-primary'
            : 'bg-muted text-muted-foreground'
        )}>
          {items.length}
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      {expanded && (
        <div className="border-t border-border/50">
          {items.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              {emptyText}
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {visible.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  compact={compact}
                  onUpdate={onItemUpdate}
                  onDelete={onItemDelete}
                />
              ))}
              {hasMore && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(v => !v)}
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                >
                  {showAll ? 'Show less' : `Show ${items.length - maxVisible} more`}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
