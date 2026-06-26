'use client';

import { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { CATEGORY_CONFIG } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sparkles, Send, X, Check, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface SmartInputProps {
  onItemsAdded?: (items: any[]) => void;
}

const PLACEHOLDER = `Type anything — tasks, reminders, meeting notes, ideas...

Example: "Need to visit Shivamogga Tuesday for OS installation, ask Salman to arrange travel, remind finance for advance payment."`;

export function SmartInput({ onItemsAdded }: SmartInputProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const handlePreview = async () => {
    if (!text.trim() || text.trim().length < 5) return;
    setPreviewing(true);
    try {
      const result = await api.previewInput(text);
      setPreview(result.items);
      setShowPreview(true);
    } catch (err: any) {
      toast({ title: 'Analysis failed', description: err.message, variant: 'destructive' });
    } finally {
      setPreviewing(false);
    }
  };

  const handleSave = async () => {
    if (!text.trim() || text.trim().length < 5) return;
    setLoading(true);
    try {
      const result = await api.analyzeInput(text);
      toast({
        title: `${result.count} items extracted`,
        description: 'Added to your workspace successfully.',
      });
      setText('');
      setPreview(null);
      onItemsAdded?.(result.items);
    } catch (err: any) {
      toast({ title: 'Failed to save', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (preview) handleSave();
      else handlePreview();
    }
  };

  const charCount = text.length;
  const isReady = text.trim().length >= 5;

  return (
    <div className="w-full space-y-3">
      {/* Input box */}
      <div className={cn(
        'relative rounded-xl border-2 transition-all duration-200',
        text.length > 0
          ? 'border-indigo-300 dark:border-indigo-700 shadow-lg shadow-indigo-500/10'
          : 'border-border hover:border-indigo-200 dark:hover:border-indigo-800'
      )}>
        {/* Gradient top bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-xl opacity-0 transition-opacity duration-200" style={{ opacity: text.length > 0 ? 1 : 0 }} />

        <div className="flex items-start gap-3 p-4">
          <div className="mt-0.5 flex-shrink-0">
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
              text.length > 0
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/30'
                : 'bg-muted'
            )}>
              <Sparkles className={cn('w-4 h-4', text.length > 0 ? 'text-white' : 'text-muted-foreground')} />
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={PLACEHOLDER}
            rows={4}
            className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none leading-relaxed"
          />

          {text.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setText(''); setPreview(null); }}
              className="h-7 w-7 flex-shrink-0 mt-0.5 opacity-50 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 pb-3">
          <span className="text-xs text-muted-foreground">
            {charCount > 0 ? `${charCount} chars · Ctrl+Enter to analyze` : 'Paste text, email, voice note or just type...'}
          </span>
          <div className="flex items-center gap-2">
            {preview && (
              <Button
                onClick={handleSave}
                disabled={loading || !isReady}
                size="sm"
                className="h-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/25"
              >
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    Save All ({preview.length})
                  </span>
                )}
              </Button>
            )}
            <Button
              onClick={handlePreview}
              disabled={previewing || !isReady}
              size="sm"
              variant={preview ? 'outline' : 'default'}
              className={cn(
                'h-8',
                !preview && 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/25'
              )}
            >
              {previewing ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  Analyzing...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {preview ? 'Re-analyze' : 'Analyze'}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Preview results */}
      {preview && preview.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden animate-fade-in">
          <button
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors"
            onClick={() => setShowPreview(v => !v)}
          >
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-indigo-100 dark:bg-indigo-950 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-indigo-600">{preview.length}</span>
              </span>
              <span className="text-sm font-semibold">AI extracted {preview.length} items</span>
              <span className="text-xs text-muted-foreground">— Review before saving</span>
            </div>
            {showPreview ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>

          {showPreview && (
            <div className="divide-y divide-border/50">
              {preview.map((item, i) => {
                const cfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.NOTES;
                return (
                  <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-accent/30 transition-colors">
                    <span className={cn('text-base flex-shrink-0 mt-0.5')}>{cfg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', cfg.bg, cfg.color)}>
                          {cfg.label}
                        </span>
                        {item.isUrgent && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400">
                            Urgent
                          </span>
                        )}
                        {item.deadline && (
                          <span className="text-xs text-amber-600 dark:text-amber-400">
                            📅 {new Date(item.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium mt-1 truncate">{item.title}</p>
                      {item.assignee && (
                        <p className="text-xs text-muted-foreground mt-0.5">→ {item.assignee}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {preview && preview.length === 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          No actionable items detected. Try adding more specific tasks or reminders.
        </div>
      )}
    </div>
  );
}
