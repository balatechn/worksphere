'use client';

import { cn } from '@/lib/utils';
import {
  LayoutDashboard, CheckSquare, Calendar, Bell, Grid3X3, X,
  Users, ArrowRight, Clock, Phone, ShoppingCart, Share2, FileText
} from 'lucide-react';
import { useState } from 'react';

const mainTabs = [
  { id: 'dashboard',  label: 'Home',      icon: LayoutDashboard, category: null },
  { id: 'my-tasks',   label: 'Tasks',     icon: CheckSquare,     category: 'MY_TASKS' },
  { id: 'meetings',   label: 'Meetings',  icon: Calendar,        category: 'MEETINGS' },
  { id: 'reminders',  label: 'Reminders', icon: Bell,            category: 'REMINDERS' },
];

const moreItems = [
  { id: 'team',        label: 'Team Tasks',   icon: Users,        category: 'TEAM_TASKS' },
  { id: 'follow-ups',  label: 'Follow Ups',   icon: ArrowRight,   category: 'FOLLOW_UPS' },
  { id: 'approvals',   label: 'Approvals',    icon: Clock,        category: 'WAITING_APPROVAL' },
  { id: 'calls',       label: 'Calls',        icon: Phone,        category: 'CALLS' },
  { id: 'procurement', label: 'Procurement',  icon: ShoppingCart, category: 'PROCUREMENT' },
  { id: 'delegated',   label: 'Delegated',    icon: Share2,       category: 'DELEGATED' },
  { id: 'notes',       label: 'Notes',        icon: FileText,     category: 'NOTES' },
];

interface BottomNavProps {
  activeSection: string;
  onSectionChange: (section: string, category?: string) => void;
  counts?: Record<string, number>;
}

export function BottomNav({ activeSection, onSectionChange, counts = {} }: BottomNavProps) {
  const [showMore, setShowMore] = useState(false);

  const handleTab = (id: string, category: string | null) => {
    onSectionChange(id, category || undefined);
    setShowMore(false);
  };

  return (
    <>
      {/* "More" bottom sheet */}
      {showMore && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setShowMore(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl border-t border-border"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
              <span className="font-semibold text-sm">All Categories</span>
              <button
                onClick={() => setShowMore(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-4">
              {moreItems.map(item => {
                const Icon = item.icon;
                const count = counts[item.category] || 0;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTab(item.id, item.category)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all text-left',
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-muted/50 text-foreground hover:bg-accent border border-transparent'
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {count > 0 && (
                      <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold leading-none">
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-background/95 backdrop-blur-xl border-t border-border"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around px-1 h-16">
          {mainTabs.map(tab => {
            const Icon = tab.icon;
            const count = tab.category ? counts[tab.category] || 0 : 0;
            const isActive = activeSection === tab.id && !showMore;
            return (
              <button
                key={tab.id}
                onClick={() => handleTab(tab.id, tab.category)}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 h-14 px-4 rounded-xl transition-all',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <div className="relative">
                  <Icon className={cn('h-5 w-5 transition-transform', isActive && 'scale-110')} />
                  {count > 0 && (
                    <span className="absolute -top-1.5 -right-2 text-[9px] bg-red-500 text-white min-w-[14px] h-3.5 px-0.5 rounded-full font-bold flex items-center justify-center">
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </div>
                <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* More */}
          <button
            onClick={() => setShowMore(v => !v)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 h-14 px-4 rounded-xl transition-all',
              showMore ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Grid3X3 className={cn('h-5 w-5 transition-transform', showMore && 'scale-110')} />
            <span className={cn('text-[10px] font-medium', showMore && 'font-semibold text-primary')}>
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
