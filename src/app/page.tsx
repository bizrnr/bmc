'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ToastContainer, type ToastItem } from '@/components/Toast';
import { ExecutiveOverview } from '@/components/tabs/ExecutiveOverview';
import { LeadPipeline } from '@/components/tabs/LeadPipeline';
import { OutreachPerformance } from '@/components/tabs/OutreachPerformance';
import { RevenueConversion } from '@/components/tabs/RevenueConversion';
import { SystemHealth } from '@/components/tabs/SystemHealth';
import { AgentManagement } from '@/components/tabs/AgentManagement';
import clsx from 'clsx';

type TabType = 'executive' | 'pipeline' | 'outreach' | 'revenue' | 'system' | 'agents';

function haptic(ms: number = 10) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
}

export default function Dashboard() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { state, connected, refresh } = useWebSocket();
  const [activeTab, setActiveTab] = useState<TabType>('executive');
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [pullProgress, setPullProgress] = useState(0);
  const pullStartRef = useRef<number | null>(null);
  const prevActivityCountRef = useRef(0);
  const isAdmin = (session?.user as { role?: string })?.role === 'admin';

  useEffect(() => {
    if (authStatus === 'loading') return;
    if (!session) router.push('/login');
  }, [session, authStatus, router]);

  useEffect(() => {
    const count = state.recentActivity.length;
    if (prevActivityCountRef.current > 0 && count > prevActivityCountRef.current) {
      const newest = state.recentActivity[0];
      if (newest) {
        setToasts(prev => [...prev, {
          id: newest.id,
          message: `New: ${newest.description.slice(0, 60)}`,
          type: newest.status === 'error' ? 'error' : 'info',
        }]);
      }
    }
    prevActivityCountRef.current = count;
  }, [state.recentActivity]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const tabs: Record<string, TabType> = { 
        '1': 'executive', '2': 'pipeline', '3': 'outreach', 
        '4': 'revenue', '5': 'system', '6': 'agents' 
      };
      if (tabs[e.key]) { setActiveTab(tabs[e.key]); haptic(); }
      if (e.key === 'r' || e.key === 'R') { e.preventDefault(); refresh(); haptic(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [refresh]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => { pullStartRef.current = e.touches[0].clientY; };
    const handleTouchMove = (e: TouchEvent) => {
      if (pullStartRef.current === null || window.scrollY > 0) return;
      const diff = e.touches[0].clientY - pullStartRef.current;
      if (diff > 0) setPullProgress(Math.min(diff / 100, 1));
    };
    const handleTouchEnd = () => {
      if (pullProgress >= 1) { refresh(); haptic(20); }
      setPullProgress(0);
      pullStartRef.current = null;
    };
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullProgress, refresh]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const switchTab = useCallback((tab: TabType) => {
    setActiveTab(tab);
    haptic();
  }, []);

  if (authStatus === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-[var(--text-primary)]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col">
      {pullProgress > 0 && (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-2" style={{ opacity: pullProgress }}>
          <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center"
               style={{ transform: `rotate(${pullProgress * 360}deg)` }}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <header className="sticky top-0 z-40 bg-[var(--bg-overlay)] backdrop-blur border-b border-[var(--border-color)] px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🦾</span>
            <div>
              <h1 className="text-lg font-bold">BizRnR Mission Control</h1>
              <div className="flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[var(--text-secondary)]">{connected ? 'Live' : 'Offline'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isAdmin && (
              <button onClick={() => router.push('/admin')}
                className="p-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] transition-colors border border-[var(--border-color)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </button>
            )}
            <button onClick={() => { refresh(); haptic(); }}
              className="p-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] transition-colors border border-[var(--border-color)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button onClick={() => signOut()}
              className="p-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] transition-colors border border-[var(--border-color)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-7xl mx-auto p-4">
          {activeTab === 'executive' && <ExecutiveOverview />}
          {activeTab === 'pipeline' && <LeadPipeline />}
          {activeTab === 'outreach' && <OutreachPerformance />}
          {activeTab === 'revenue' && <RevenueConversion />}
          {activeTab === 'system' && <SystemHealth />}
          {activeTab === 'agents' && <AgentManagement />}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-[var(--bg-overlay)] backdrop-blur border-t border-[var(--border-color)] px-2 py-2">
        <div className="max-w-7xl mx-auto flex justify-around">
          {([
            { id: 'executive' as TabType, icon: '📊', label: 'Exec' },
            { id: 'pipeline' as TabType, icon: '🎯', label: 'Leads' },
            { id: 'outreach' as TabType, icon: '📧', label: 'Outreach' },
            { id: 'revenue' as TabType, icon: '💰', label: 'Revenue' },
            { id: 'system' as TabType, icon: '⚙️', label: 'System' },
            { id: 'agents' as TabType, icon: '🤖', label: 'Agents' },
          ]).map((tab) => (
            <button key={tab.id} onClick={() => switchTab(tab.id)}
              className={clsx('flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors',
                activeTab === tab.id ? 'text-[var(--accent)] bg-[var(--bg-card)]' : 'text-[var(--text-muted)]')}>
              <span className="text-xl">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
