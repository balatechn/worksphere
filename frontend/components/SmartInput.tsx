'use client';

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { CATEGORY_CONFIG } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sparkles, X, Check, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface SmartInputProps {
  onItemsAdded?: (items: any[]) => void;
}

const PLACEHOLDER = `Type anything — tasks, reminders, meeting notes, or paste a URL to save it...`;

function isUrl(text: string) {
  return /^https?:\/\/\S+$/.test(text.trim());
}

function urlPreviewItem(url: string) {
  return [{
    category: 'NOTES',
    title: url.length > 80 ? url.substring(0, 77) + '…' : url,
    description: url,
    assignee: null,
    deadline: null,
    isUrgent: false,
    priority: 'MEDIUM',
  }];
}

export function SmartInput({ onItemsAdded }: SmartInputProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (mobileExpanded && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [mobileExpanded]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  const handlePreview = async () => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 3) return;
    if (isUrl(trimmed)) {
      setPreview(urlPreviewItem(trimmed));
      setShowPreview(true);
      return;
    }
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
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 3) return;
    setLoading(true);
    try {
      const result = await api.analyzeInput(text);
      toast({ title: `${result.count} item${result.count !== 1 ? 's' : ''} saved`, description: 'Added to your workspace.' });
      setText('');
      setPreview(null);
      setMobileExpanded(false);
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
      if (preview) handleSave(); else handlePreview();
    }
  };

  const handleClear = () => { setText(''); setPreview(null); if (textareaRef.current) textareaRef.current.style.height = 'auto'; };

  const isReady = text.trim().length >= 3;

  return (
    <>
      {/* Desktop / tablet inline input */}
      <div className="hidden sm:block w-full space-y-3">
        <InputBox
          text={text}
          setText={setText}
          textareaRef={textareaRef}
          onKeyDown={handleKeyDown}
          onClear={handleClear}
          autoResize={autoResize}
          isReady={isReady}
          preview={preview}
          previewing={previewing}
          loading={loading}
          handlePreview={handlePreview}
          handleSave={handleSave}
          hintText={`${text.length > 0 ? `${text.length} chars · Ctrl+Enter to analyze` : 'Paste text, email, or type anything...'}`}
        />
        <PreviewList preview={preview} showPreview={showPreview} setShowPreview={setShowPreview} />
      </div>

      {/* Mobile: collapsed summary + FAB */}
      <div className="sm:hidden">
        {/* Collapsed bar */}
        <button
          onClick={() => setMobileExpanded(true)}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all',
            'border-border bg-card hover:border-indigo-300 hover:shadow-md'
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-500/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="flex-1 text-sm text-muted-foreground truncate">
            {text.length > 0 ? text.substring(0, 60) + (text.length > 60 ? '…' : '') : 'Tap to add tasks, notes, reminders…'}
          </span>
          {text.length > 0 && (
            <span className="text-xs bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
              Draft
            </span>
          )}
        </button>
      </div>

      {/* Mobile full-screen overlay */}
      {mobileExpanded && (
        <div className="fixed inset-0 z-50 sm:hidden flex flex-col bg-background">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-sm">Smart Input</span>
            </div>
            <button
              onClick={() => setMobileExpanded(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-accent transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Textarea */}
          <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => { setText(e.target.value); autoResize(); }}
              onKeyDown={handleKeyDown}
              placeholder={PLACEHOLDER}
              className="w-full h-full min-h-[160px] resize-none bg-transparent text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none leading-relaxed"
              autoFocus
            />

            {/* Preview */}
            {preview !== null && (
              <div className="mt-4 rounded-xl border border-border bg-card overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors"
                  onClick={() => setShowPreview(v => !v)}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-indigo-100 dark:bg-indigo-950 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-indigo-600">{preview.length}</span>
                    </span>
                    <span className="text-sm font-semibold">
                      {preview.length > 0 ? `${preview.length} items found` : 'No items found'}
                    </span>
                  </div>
                  {showPreview ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                {showPreview && preview.length > 0 && (
                  <div className="divide-y divide-border/50">
                    {preview.map((item, i) => {
                      const cfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.NOTES;
                      return (
                        <div key={i} className="flex items-start gap-3 px-4 py-3">
                          <span className="text-base flex-shrink-0 mt-0.5">{cfg.icon}</span>
                          <div className="flex-1 min-w-0">
                            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', cfg.bg, cfg.color)}>
                              {cfg.label}
                            </span>
                            <p className="text-sm font-medium mt-1">{item.title}</p>
                            {item.assignee && <p className="text-xs text-muted-foreground mt-0.5">→ {item.assignee}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile action bar */}
          <div className="px-4 py-3 border-t border-border bg-background space-y-2" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
            {preview && preview.length > 0 ? (
              <Button
                onClick={handleSave}
                disabled={loading || !isReady}
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-base font-semibold rounded-xl"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Save {preview.length} Items
                  </span>
                )}
              </Button>
            ) : null}
            <Button
              onClick={preview ? handlePreview : handlePreview}
              disabled={previewing || !isReady}
              variant={preview ? 'outline' : 'default'}
              className={cn(
                'w-full h-12 text-base font-semibold rounded-xl',
                !preview && 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
              )}
            >
              {previewing ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  Analyzing…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {preview ? 'Re-analyze' : 'Analyze with AI'}
                </span>
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function InputBox({ text, setText, textareaRef, onKeyDown, onClear, autoResize, isReady, preview, previewing, loading, handlePreview, handleSave, hintText }: any) {
  return (
    <div className={cn(
      'relative rounded-xl border-2 transition-all duration-200',
      text.length > 0
        ? 'border-indigo-300 dark:border-indigo-700 shadow-lg shadow-indigo-500/10'
        : 'border-border hover:border-indigo-200 dark:hover:border-indigo-800'
    )}>
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-xl transition-opacity duration-200" style={{ opacity: text.length > 0 ? 1 : 0 }} />

      <div className="flex items-start gap-3 p-4">
        <div className="mt-0.5 flex-shrink-0">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-all', text.length > 0 ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/30' : 'bg-muted')}>
            <Sparkles className={cn('w-4 h-4', text.length > 0 ? 'text-white' : 'text-muted-foreground')} />
          </div>
        </div>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => { setText(e.target.value); autoResize(); }}
          onKeyDown={onKeyDown}
          placeholder="Type anything — tasks, reminders, meeting notes, or paste a URL..."
          rows={3}
          className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none leading-relaxed"
        />
        {text.length > 0 && (
          <Button variant="ghost" size="icon" onClick={onClear} className="h-7 w-7 flex-shrink-0 mt-0.5 opacity-50 hover:opacity-100">
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between px-4 pb-3">
        <span className="text-xs text-muted-foreground hidden sm:block">{hintText}</span>
        <div className="flex items-center gap-2 ml-auto">
          {preview && (
            <Button onClick={handleSave} disabled={loading || !isReady} size="sm" className="h-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/25">
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
          <Button onClick={handlePreview} disabled={previewing || !isReady} size="sm" variant={preview ? 'outline' : 'default'}
            className={cn('h-8', !preview && 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/25')}>
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
  );
}

function PreviewList({ preview, showPreview, setShowPreview }: any) {
  if (!preview) return null;
  if (preview.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        No actionable items detected. Try adding more specific tasks or reminders.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors" onClick={() => setShowPreview((v: boolean) => !v)}>
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
          {preview.map((item: any, i: number) => {
            const cfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.NOTES;
            return (
              <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-accent/30 transition-colors">
                <span className="text-base flex-shrink-0 mt-0.5">{cfg.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', cfg.bg, cfg.color)}>{cfg.label}</span>
                    {item.isUrgent && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400">Urgent</span>}
                    {item.deadline && <span className="text-xs text-amber-600 dark:text-amber-400">📅 {new Date(item.deadline).toLocaleDateString()}</span>}
                  </div>
                  <p className="text-sm font-medium mt-1 truncate">{item.title}</p>
                  {item.assignee && <p className="text-xs text-muted-foreground mt-0.5">→ {item.assignee}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
