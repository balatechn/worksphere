import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatRelativeDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days <= 7) return `In ${days} days`;
  return formatDate(date);
}

export const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  MY_TASKS:         { label: 'My Tasks',          color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-950',    icon: '✓' },
  TEAM_TASKS:       { label: 'Team Tasks',         color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950', icon: '👥' },
  REMINDERS:        { label: 'Reminder',           color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-950',  icon: '🔔' },
  FOLLOW_UPS:       { label: 'Follow Up',          color: 'text-cyan-600 dark:text-cyan-400',    bg: 'bg-cyan-50 dark:bg-cyan-950',    icon: '↩' },
  WAITING_APPROVAL: { label: 'Awaiting Approval',  color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950', icon: '⏳' },
  CALLS:            { label: 'Call',               color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-950',  icon: '📞' },
  MEETINGS:         { label: 'Meeting',            color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950', icon: '📅' },
  PROCUREMENT:      { label: 'Procurement',        color: 'text-pink-600 dark:text-pink-400',    bg: 'bg-pink-50 dark:bg-pink-950',    icon: '🛒' },
  NOTES:            { label: 'Note',               color: 'text-slate-600 dark:text-slate-400',  bg: 'bg-slate-50 dark:bg-slate-900',  icon: '📝' },
  DELEGATED:        { label: 'Delegated',          color: 'text-rose-600 dark:text-rose-400',    bg: 'bg-rose-50 dark:bg-rose-950',    icon: '→' },
};

export const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  LOW:    { label: 'Low',    color: 'text-slate-500' },
  MEDIUM: { label: 'Medium', color: 'text-blue-500' },
  HIGH:   { label: 'High',   color: 'text-amber-500' },
  URGENT: { label: 'Urgent', color: 'text-red-500' },
};
