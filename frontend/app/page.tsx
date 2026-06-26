'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { SmartInput } from '@/components/SmartInput';
import { DashboardSection } from '@/components/DashboardSection';
import { ItemCard } from '@/components/ItemCard';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckSquare, TrendingUp, AlertTriangle, Clock, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [categoryItems, setCategoryItems] = useState<any[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const loadDashboard = useCallback(async () => {
    try {
      const data = await api.getDashboard();
      setDashboard(data);
      // Build counts
      const c: Record<string, number> = {};
      if (data.sections) {
        Object.entries(data.sections).forEach(([, items]: [string, any]) => {
          (items as any[]).forEach(item => {
            c[item.category] = (c[item.category] || 0) + 1;
          });
        });
      }
      setCounts(c);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') loadDashboard();
  }, [status, loadDashboard]);

  const loadCategory = useCallback(async (category: string) => {
    setCategoryLoading(true);
    try {
      const items = await api.getItems({ category });
      setCategoryItems(items);
    } catch (err) {
      console.error('Category load error:', err);
    } finally {
      setCategoryLoading(false);
    }
  }, []);

  const handleSectionChange = (section: string, category?: string) => {
    setActiveSection(section);
    if (category) {
      setActiveCategory(category);
      loadCategory(category);
    } else {
      setActiveCategory(null);
    }
    setSidebarOpen(false);
  };

  const handleItemUpdate = (updated: any) => {
    setCategoryItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    // Refresh dashboard counts
    loadDashboard();
  };

  const handleItemDelete = (id: string) => {
    setCategoryItems(prev => prev.filter(i => i.id !== id));
    loadDashboard();
  };

  const handleDashboardItemUpdate = (updated: any) => {
    setDashboard((prev: any) => {
      if (!prev?.sections) return prev;
      const sections = { ...prev.sections };
      Object.keys(sections).forEach(key => {
        sections[key] = sections[key].map((i: any) => i.id === updated.id ? updated : i);
      });
      return { ...prev, sections };
    });
  };

  const handleDashboardItemDelete = (id: string) => {
    setDashboard((prev: any) => {
      if (!prev?.sections) return prev;
      const sections = { ...prev.sections };
      Object.keys(sections).forEach(key => {
        sections[key] = sections[key].filter((i: any) => i.id !== id);
      });
      return { ...prev, sections };
    });
  };

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const stats = dashboard?.stats;
  const sections = dashboard?.sections;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onMenuClick={() => setSidebarOpen(v => !v)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — desktop */}
        <aside className="hidden lg:flex w-56 flex-col border-r border-border/50 overflow-y-auto">
          <Sidebar
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            counts={counts}
          />
        </aside>

        {/* Sidebar — mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-64 flex flex-col shadow-xl">
              <Sidebar
                activeSection={activeSection}
                onSectionChange={handleSectionChange}
                counts={counts}
                onClose={() => setSidebarOpen(false)}
              />
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {/* Smart Input — always visible */}
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Smart Input
              </h2>
              <SmartInput onItemsAdded={() => loadDashboard()} />
            </div>

            {/* Category view */}
            {activeSection !== 'dashboard' && activeCategory && (
              <div className="space-y-3">
                <h2 className="text-lg font-bold">
                  {activeSection.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </h2>
                {categoryLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
                  </div>
                ) : categoryItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-4xl mb-3">✨</p>
                    <p className="text-sm">No items in this category yet.</p>
                    <p className="text-xs mt-1">Use the Smart Input above to add items.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categoryItems.map(item => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        onUpdate={handleItemUpdate}
                        onDelete={handleItemDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Dashboard view */}
            {activeSection === 'dashboard' && (
              <>
                {/* Stats */}
                {loading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
                  </div>
                ) : stats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="Pending" value={stats.pending} icon={CheckSquare} color="bg-blue-500" />
                    <StatCard label="Completed Today" value={stats.completedToday} icon={TrendingUp} color="bg-green-500" />
                    <StatCard label="Urgent" value={stats.urgent} icon={AlertTriangle} color="bg-red-500" />
                    <StatCard label="Snoozed" value={stats.snoozed} icon={Clock} color="bg-amber-500" />
                  </div>
                )}

                {/* Sections */}
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
                  </div>
                ) : sections ? (
                  <div className="space-y-4">
                    {sections.urgent?.length > 0 && (
                      <DashboardSection
                        title="Urgent Items"
                        icon="🔴"
                        items={sections.urgent}
                        onItemUpdate={handleDashboardItemUpdate}
                        onItemDelete={handleDashboardItemDelete}
                        compact
                      />
                    )}
                    <DashboardSection
                      title="Today's Tasks"
                      icon="✅"
                      items={sections.todayItems || []}
                      emptyText="No tasks for today. Add one using the input above."
                      onItemUpdate={handleDashboardItemUpdate}
                      onItemDelete={handleDashboardItemDelete}
                    />
                    <DashboardSection
                      title="Pending Follow-ups"
                      icon="↩"
                      items={sections.followUps || []}
                      emptyText="No follow-ups pending."
                      defaultExpanded={false}
                      onItemUpdate={handleDashboardItemUpdate}
                      onItemDelete={handleDashboardItemDelete}
                      compact
                    />
                    <DashboardSection
                      title="Delegated Tasks"
                      icon="→"
                      items={sections.delegated || []}
                      emptyText="No delegated tasks."
                      defaultExpanded={false}
                      onItemUpdate={handleDashboardItemUpdate}
                      onItemDelete={handleDashboardItemDelete}
                      compact
                    />
                    <DashboardSection
                      title="Team Pending"
                      icon="👥"
                      items={sections.teamPending || []}
                      emptyText="No team tasks pending."
                      defaultExpanded={false}
                      onItemUpdate={handleDashboardItemUpdate}
                      onItemDelete={handleDashboardItemDelete}
                      compact
                    />
                    <DashboardSection
                      title="Upcoming Meetings"
                      icon="📅"
                      items={sections.meetings || []}
                      emptyText="No upcoming meetings."
                      defaultExpanded={false}
                      onItemUpdate={handleDashboardItemUpdate}
                      onItemDelete={handleDashboardItemDelete}
                      compact
                    />
                    <DashboardSection
                      title="Awaiting Approval"
                      icon="⏳"
                      items={sections.waitingApproval || []}
                      emptyText="Nothing awaiting approval."
                      defaultExpanded={false}
                      onItemUpdate={handleDashboardItemUpdate}
                      onItemDelete={handleDashboardItemDelete}
                      compact
                    />
                    <DashboardSection
                      title="Calls to Make"
                      icon="📞"
                      items={sections.calls || []}
                      emptyText="No calls to make."
                      defaultExpanded={false}
                      onItemUpdate={handleDashboardItemUpdate}
                      onItemDelete={handleDashboardItemDelete}
                      compact
                    />
                    <DashboardSection
                      title="Procurement"
                      icon="🛒"
                      items={sections.procurement || []}
                      emptyText="No procurement items."
                      defaultExpanded={false}
                      onItemUpdate={handleDashboardItemUpdate}
                      onItemDelete={handleDashboardItemDelete}
                      compact
                    />
                    <DashboardSection
                      title="Notes"
                      icon="📝"
                      items={sections.notes || []}
                      emptyText="No notes saved."
                      defaultExpanded={false}
                      onItemUpdate={handleDashboardItemUpdate}
                      onItemDelete={handleDashboardItemDelete}
                      compact
                    />
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <p className="text-5xl mb-4">🚀</p>
                    <h3 className="text-lg font-semibold mb-2 text-foreground">Welcome to WorkSphere!</h3>
                    <p className="text-sm">Start by typing anything in the Smart Input above.</p>
                    <p className="text-xs mt-1">Tasks, reminders, meeting notes — all in one place.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
