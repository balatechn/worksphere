'use client';

import { useState } from 'react';
import { cn, CATEGORY_CONFIG, PRIORITY_CONFIG, formatRelativeDate } from '@/lib/utils';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Check, Calendar, User, Bell, Mail, Clock, Trash2, MoreHorizontal,
  AlertTriangle, Edit2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ItemCardProps {
  item: any;
  onUpdate?: (updated: any) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export function ItemCard({ item, onUpdate, onDelete, compact = false }: ItemCardProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [deadlineDialog, setDeadlineDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState(false);
  const [deadline, setDeadline] = useState(item.deadline ? item.deadline.split('T')[0] : '');
  const [assignee, setAssignee] = useState(item.assignee || '');
  const { toast } = useToast();

  const cfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.NOTES;
  const priorityCfg = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.MEDIUM;
  const isCompleted = item.status === 'COMPLETED';

  const withLoading = async (key: string, fn: () => Promise<any>) => {
    setLoading(key);
    try {
      const result = await fn();
      onUpdate?.(result);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  const handleComplete = () =>
    withLoading('complete', () => api.completeItem(item.id));

  const handleSnooze = (hours: number) =>
    withLoading('snooze', () => api.snoozeItem(item.id, hours));

  const handleSendReminder = () => {
    withLoading('remind', async () => {
      await api.sendReminder(item.id);
      toast({ title: 'Reminder sent', description: 'Email reminder sent successfully.' });
      return item;
    });
  };

  const handleDelete = async () => {
    setLoading('delete');
    try {
      await api.deleteItem(item.id);
      onDelete?.(item.id);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  const handleSetDeadline = () =>
    withLoading('deadline', async () => {
      const result = await api.updateItem(item.id, { deadline: deadline || null });
      setDeadlineDialog(false);
      return result;
    });

  const handleSetAssignee = () =>
    withLoading('assign', async () => {
      const result = await api.updateItem(item.id, { assignee: assignee || null });
      setAssignDialog(false);
      return result;
    });

  const isOverdue = item.deadline && new Date(item.deadline) < new Date() && !isCompleted;

  return (
    <>
      <div className={cn(
        'group relative flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 hover:shadow-md',
        isCompleted
          ? 'bg-muted/30 border-border/30 opacity-60'
          : 'bg-card border-border hover:border-primary/20 hover:bg-accent/20',
        item.isUrgent && !isCompleted && 'border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-950/20'
      )}>
        {/* Complete checkbox */}
        <button
          onClick={handleComplete}
          disabled={isCompleted || loading === 'complete'}
          className={cn(
            'flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
            isCompleted
              ? 'bg-green-500 border-green-500'
              : 'border-border hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-950'
          )}
        >
          {(isCompleted || loading === 'complete') && (
            <Check className="w-3 h-3 text-white" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Category + urgent badges */}
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <span className={cn('text-xs font-semibold px-1.5 py-0.5 rounded-md', cfg.bg, cfg.color)}>
                  {cfg.icon} {cfg.label}
                </span>
                {item.isUrgent && (
                  <span className="text-xs font-bold text-red-500 flex items-center gap-0.5">
                    <AlertTriangle className="w-3 h-3" />
                    Urgent
                  </span>
                )}
                <span className={cn('text-xs', priorityCfg.color)}>
                  {priorityCfg.label}
                </span>
              </div>

              {/* Title */}
              <p className={cn('text-sm font-medium leading-snug', isCompleted && 'line-through text-muted-foreground')}>
                {item.title}
              </p>

              {/* Description */}
              {!compact && item.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
              )}

              {/* Meta row */}
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {item.assignee && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {item.assignee}
                  </span>
                )}
                {item.deadline && (
                  <span className={cn(
                    'text-xs flex items-center gap-1',
                    isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'
                  )}>
                    <Calendar className="w-3 h-3" />
                    {formatRelativeDate(item.deadline)}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {!isCompleted && (
                    <DropdownMenuItem onClick={handleComplete} className="cursor-pointer">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      Mark complete
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setDeadlineDialog(true)} className="cursor-pointer">
                    <Calendar className="mr-2 h-4 w-4 text-blue-500" />
                    Set deadline
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAssignDialog(true)} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4 text-violet-500" />
                    Assign to
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSendReminder} className="cursor-pointer">
                    <Mail className="mr-2 h-4 w-4 text-indigo-500" />
                    Send email reminder
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleSnooze(24)} className="cursor-pointer">
                    <Clock className="mr-2 h-4 w-4 text-amber-500" />
                    Snooze 24 hours
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSnooze(48)} className="cursor-pointer">
                    <Clock className="mr-2 h-4 w-4 text-amber-500" />
                    Snooze 2 days
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Deadline dialog */}
      <Dialog open={deadlineDialog} onOpenChange={setDeadlineDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Set Deadline</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Deadline date</Label>
              <Input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setDeadlineDialog(false)} variant="outline" className="flex-1">Cancel</Button>
              <Button onClick={handleSetDeadline} disabled={loading === 'deadline'} className="flex-1">
                {loading === 'deadline' ? 'Saving...' : 'Set Deadline'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign dialog */}
      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign To</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Person or team name</Label>
              <Input
                value={assignee}
                onChange={e => setAssignee(e.target.value)}
                placeholder="e.g. Salman, Finance Team..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setAssignDialog(false)} variant="outline" className="flex-1">Cancel</Button>
              <Button onClick={handleSetAssignee} disabled={loading === 'assign'} className="flex-1">
                {loading === 'assign' ? 'Saving...' : 'Assign'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
