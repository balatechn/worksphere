'use client';

import { cn } from '@/lib/utils';
import {
  LayoutDashboard, CheckSquare, Users, Bell, ArrowRight, Clock,
  Phone, Calendar, ShoppingCart, FileText, Share2, Search, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: null },
  { id: 'my-tasks', label: 'My Tasks', icon: CheckSquare, category: 'MY_TASKS', count: true },
  { id: 'team', label: 'Team Tasks', icon: Users, category: 'TEAM_TASKS', count: true },
  { id: 'reminders', label: 'Reminders', icon: Bell, category: 'REMINDERS', count: true },
  { id: 'follow-ups', label: 'Follow Ups', icon: ArrowRight, category: 'FOLLOW_UPS', count: true },
  { id: 'approvals', label: 'Approvals', icon: Clock, category: 'WAITING_APPROVAL', count: true },
  { id: 'calls', label: 'Calls', icon: Phone, category: 'CALLS', count: true },
  { id: 'meetings', label: 'Meetings', icon: Calendar, category: 'MEETINGS', count: true },
  { id: 'procurement', label: 'Procurement', icon: ShoppingCart, category: 'PROCUREMENT', count: true },
  { id: 'delegated', label: 'Delegated', icon: Share2, category: 'DELEGATED', count: true },
  { id: 'notes', label: 'Notes', icon: FileText, category: 'NOTES', count: false },
];

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string, category?: string) => void;
  counts?: Record<string, number>;
  onClose?: () => void;
  className?: string;
}

export function Sidebar({ activeSection, onSectionChange, counts = {}, onClose, className }: SidebarProps) {
  const [search, setSearch] = useState('');

  const filtered = navItems.filter(item =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={cn('flex flex-col h-full bg-background border-r border-border/50', className)}>
      {/* Mobile close button */}
      {onClose && (
        <div className="flex items-center justify-between p-4 lg:hidden border-b border-border/50">
          <span className="font-semibold text-sm">Navigation</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
        {filtered.map(item => {
          const Icon = item.icon;
          const count = item.category ? counts[item.category] || 0 : null;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                onSectionChange(item.id, item.category || undefined);
                onClose?.();
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-primary' : '')} />
              <span className="flex-1 text-left">{item.label}</span>
              {count !== null && count > 0 && (
                <span className={cn(
                  'text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center',
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground text-center">WorkSphere v1.0</p>
      </div>
    </div>
  );
}
