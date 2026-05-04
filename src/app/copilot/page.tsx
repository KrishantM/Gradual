'use client';

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import useSWR from 'swr';
import { createAuthFetcher, SWR_AUTH_CONFIG } from '@/lib/swr-fetcher';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Brain, Calendar, ListTodo, Briefcase, Target, Loader2, Plus, Undo2, X,
  ExternalLink, ArrowLeft, Archive,
  FileText, TrendingUp, Lightbulb, ArrowRight, ArrowUp, PanelRight,
  CheckCircle2, AlertTriangle, Activity, Trash2, History, Pin,
} from 'lucide-react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { trackEvent } from '@/lib/analytics';

/* ─── Types ─── */

interface ConversationSummary { id: string; title: string; createdAt: string | null; }
type Mode = 'suggest' | 'assist';
interface Priority { title: string; rationale: string }
interface SuggestedTodo { title: string; notes?: string; priority: string; dueDateISO?: string }
interface SuggestedOpp { jobId: string; title: string; company: string; location: string; url: string; whyFit: string }
interface WeeklyPlanDay { title: string; notes?: string; }
interface CopilotResponse {
  answer: string;
  priorities: Priority[];
  suggestedTodos: SuggestedTodo[];
  suggestedOpportunities: SuggestedOpp[];
  weeklyPlan?: Record<string, WeeklyPlanDay[]>;
  undoToken?: string;
  undoExpiresAt?: string;
}

interface SidebarSignal { key: string; level: 'HIGH' | 'MEDIUM' | 'OK'; message: string }
interface SidebarPlannerEvent { id: string; date: string; title: string; source: string }
interface SidebarData {
  signals: SidebarSignal[] | null;
  profileCompletion: number;
  cvScore: number | null;
  todayPlannerEvents: SidebarPlannerEvent[];
}

/* ─── Quick Action Chips ─── */

const QUICK_ACTIONS = [
  { label: 'Weekly plan', icon: Calendar, prompt: 'Generate my weekly plan based on my profile, CV, applications, and to-dos.' },
  { label: 'Improve my CV', icon: FileText, prompt: 'What are the most impactful things I can do to improve my CV right now?' },
  { label: 'Find opportunities', icon: Briefcase, prompt: 'What opportunities best fit my current profile and goals?' },
  { label: 'What should I focus on?', icon: Target, prompt: 'Based on my profile, CV, applications, and career goals, what should I focus on this week to become more competitive?' },
  { label: 'Career path advice', icon: TrendingUp, prompt: 'Based on my degree, experience, and interests, what are the most realistic career paths for me?' },
  { label: 'Profile gaps', icon: Lightbulb, prompt: 'What are the biggest gaps in my profile that are holding me back, and how can I fix them?' },
];

/* ─── Helpers ─── */

function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function CopilotPageInner() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<Mode>('suggest');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<CopilotResponse | null>(null);
  const [conversationMessages, setConversationMessages] = useState<{ role: string; content: string }[]>([]);
  const [conversationsList, setConversationsList] = useState<ConversationSummary[]>([]);
  const [conversationsOpen, setConversationsOpen] = useState(false);
  const [viewingArchiveId, setViewingArchiveId] = useState<string | null>(null);
  const [archivedView, setArchivedView] = useState<{ messages: { role: string; content: string }[]; title: string } | null>(null);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [archivingCurrent, setArchivingCurrent] = useState(false);
  const [addingTodo, setAddingTodo] = useState<string | null>(null);
  const [undoing, setUndoing] = useState(false);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [sendingToPlan, setSendingToPlan] = useState(false);
  const [sentToPlan, setSentToPlan] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sidebar state — intelligence data via SWR, same cache key as Dashboard.
  // Memoise the date key once per mount so re-renders don't flap the SWR key.
  const todayKey = useMemo(() => localDateKey(), []);
  const intelligenceFetcher = useMemo(() => (user ? createAuthFetcher(user) : null), [user]);
  const { data: intelligenceData } = useSWR(
    user ? `/api/dashboard/intelligence?date=${todayKey}` : null,
    intelligenceFetcher,
    SWR_AUTH_CONFIG
  );
  const sidebar: SidebarData | null = intelligenceData
    ? {
        signals: intelligenceData.signals ?? null,
        profileCompletion: intelligenceData.profileCompletion ?? 0,
        cvScore: intelligenceData.cvScore ?? null,
        todayPlannerEvents: intelligenceData.todayPlannerEvents ?? [],
      }
    : null;
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const [sidebarPanel, setSidebarPanel] = useState<'signals' | 'history'>('signals');
  const [deletingConvId, setDeletingConvId] = useState<string | null>(null);
  const [pinningTodo, setPinningTodo] = useState<string | null>(null);
  const [pinnedTitles, setPinnedTitles] = useState<Set<string>>(new Set());

  /* ─── API Helpers ─── */

  // Not memoized — always produces a fresh token from the current user.
  // Using a ref-forwarding pattern so effects can call it without listing it
  // as a dep (avoids the stale-closure / re-trigger cascade).
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);
  const getToken = useCallback(async () => (userRef.current ? userRef.current.getIdToken() : null), []);

  const archiveCurrentConversation = async () => {
    if (!user) return;
    setArchivingCurrent(true);
    try {
      const token = await getToken();
      await fetch('/api/copilot/conversations/archive', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      setResponse(null);
      setConversationMessages([]);
      setMessage('');
      const [currentRes, listRes] = await Promise.all([
        fetch('/api/copilot/current', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/copilot/conversations', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (currentRes.ok) { const d = await currentRes.json(); setConversationMessages(d.messages ?? []); }
      if (listRes.ok) { const listData = await listRes.json(); setConversationsList(listData.conversations ?? []); }
    } catch { setError('Failed to archive conversation'); }
    finally { setArchivingCurrent(false); }
  };

  // Load conversation history when panel switches to history or on first load
  useEffect(() => {
    if (sidebarPanel !== 'history' || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch('/api/copilot/conversations', { headers: { Authorization: `Bearer ${token}` } });
        if (!cancelled && res.ok) { const data = await res.json(); setConversationsList(data.conversations ?? []); }
      } catch { /* ignore */ }
    })().catch(() => {});
    return () => { cancelled = true; };
  }, [sidebarPanel, user, getToken]);


  const startNewConversation = async () => {
    if (!user) return;
    try {
      const token = await getToken();
      await fetch('/api/copilot/conversations/archive', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      await fetch('/api/copilot/current', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setResponse(null); setConversationMessages([]); setMessage(''); setViewingArchiveId(null); setArchivedView(null);
      const [currentRes, listRes] = await Promise.all([
        fetch('/api/copilot/current', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/copilot/conversations', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (currentRes.ok) { const d = await currentRes.json(); setConversationMessages(d.messages ?? []); }
      if (listRes.ok) { const listData = await listRes.json(); setConversationsList(listData.conversations ?? []); }
    } catch { setError('Failed to start new conversation'); }
  };

  const openArchived = async (id: string) => {
    if (!user) return;
    setLoadingArchive(true); setConversationsOpen(false);
    try {
      const token = await getToken();
      const res = await fetch(`/api/copilot/conversations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setViewingArchiveId(id); setArchivedView({ messages: data.messages ?? [], title: data.title ?? 'Conversation' }); setResponse(null);
    } catch { setError('Failed to load conversation'); }
    finally { setLoadingArchive(false); }
  };

  const backToCurrent = () => { setViewingArchiveId(null); setArchivedView(null); };

  const restoreConversation = async () => {
    if (!user || !viewingArchiveId) return;
    setRestoring(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/copilot/conversations/restore', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: viewingArchiveId }),
      });
      if (!res.ok) throw new Error('Failed to restore');
      setArchivedView(null); setViewingArchiveId(null);
      const currentRes = await fetch('/api/copilot/current', { headers: { Authorization: `Bearer ${token}` } });
      if (currentRes.ok) { const d = await currentRes.json(); setConversationMessages(d.messages ?? []); }
      setResponse(null);
    } catch { setError('Failed to restore conversation'); }
    finally { setRestoring(false); }
  };

  const fetchLatestAndConversation = useCallback(async () => {
    if (!userRef.current) return;
    const token = await getToken();
    const [latestRes, currentRes] = await Promise.all([
      fetch('/api/copilot/latest', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/copilot/current', { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    if (latestRes.ok) {
      const data = await latestRes.json();
      if (data && data.answer) {
        setResponse({
          answer: data.answer, priorities: data.priorities ?? [], suggestedTodos: data.suggestedTodos ?? [],
          suggestedOpportunities: data.suggestedOpportunities ?? [], weeklyPlan: data.weeklyPlan,
        });
      }
    }
    if (currentRes.ok) { const currentData = await currentRes.json(); setConversationMessages(currentData.messages ?? []); }
  }, [getToken]); // getToken is stable, so this is effectively stable too

  useEffect(() => {
    if (!user) { setLoadingLatest(false); return; }
    let cancelled = false;
    (async () => {
      try { await fetchLatestAndConversation(); }
      catch { /* ignore */ }
      finally { if (!cancelled) setLoadingLatest(false); }
    })().catch(() => {});
    return () => { cancelled = true; };
  }, [user, fetchLatestAndConversation]);


  // Auto-scroll conversation thread when messages change or response arrives
  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [conversationMessages, response, loading]);

  // Deep-link: if URL has ?prompt=..., auto-send it once after the user is loaded.
  // Used by the Pathway Generator timeline to "Ask G.ai" about a specific step.
  const initialPromptRef = useRef<string | null>(null);
  const initialPromptSentRef = useRef(false);
  if (initialPromptRef.current === null && typeof window !== 'undefined') {
    const p = searchParams?.get('prompt');
    if (p && p.length > 3) initialPromptRef.current = p.slice(0, 4000);
  }
  useEffect(() => {
    if (!user || loadingLatest || initialPromptSentRef.current) return;
    const p = initialPromptRef.current;
    if (!p) return;
    initialPromptSentRef.current = true;
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('prompt');
      window.history.replaceState({}, '', url.toString());
    }
    void send(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loadingLatest]);

  // Auto-grow textarea (1–4 rows)
  const autoGrowTextarea = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const lineHeight = 24;
    const maxHeight = lineHeight * 4;
    ta.style.height = `${Math.min(ta.scrollHeight, maxHeight)}px`;
  }, []);

  useEffect(() => {
    autoGrowTextarea();
  }, [message, autoGrowTextarea]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  if (authLoading) return null;
  if (!user) return null;

  const send = async (overrideMessage?: string) => {
    const text = (overrideMessage ?? message).trim();
    if (!text || !user) return;
    setLoading(true); setError(null);
    // Optimistic: append the user message immediately so the UI feels instant
    setConversationMessages((prev) => [...prev, { role: 'user', content: text }]);
    setSentToPlan(false);
    try {
      const token = await getToken();
      const res = await fetch('/api/copilot/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Request failed');
      setResponse(data as CopilotResponse);
      trackEvent('copilot_query', user.uid, { mode, isQuickAction: !!overrideMessage });
      if (!overrideMessage) setMessage('');
      const currentRes = await fetch('/api/copilot/current', { headers: { Authorization: `Bearer ${token}` } });
      if (currentRes.ok) { const currentData = await currentRes.json(); setConversationMessages(currentData.messages ?? []); }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      // Roll back the optimistic user message on failure
      setConversationMessages((prev) => prev.slice(0, -1));
    }
    finally { setLoading(false); }
  };

  const addTodo = async (t: SuggestedTodo) => {
    if (!user) return;
    setAddingTodo(t.title);
    try {
      const token = await getToken();
      const text = t.notes?.trim() ? `${t.title}\n${t.notes.trim()}` : t.title;
      const res = await fetch('/api/todos', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('Failed to add');
      setResponse(prev => prev ? { ...prev, suggestedTodos: prev.suggestedTodos.filter(x => x.title !== t.title) } : null);
      trackEvent('copilot_add_todo', user.uid, { todoTitle: t.title });
    } catch { setError('Failed to add to-do'); }
    finally { setAddingTodo(null); }
  };

  const sendWeeklyPlanToPlanner = async () => {
    if (!user || !response?.weeklyPlan) return;
    setSendingToPlan(true);
    try {
      const token = await getToken();
      const events = Object.entries(response.weeklyPlan).flatMap(([date, tasks]) =>
        tasks.map((t) => ({ date, title: t.title, notes: t.notes, source: 'copilot' as const }))
      );
      if (events.length === 0) return;
      const res = await fetch('/api/planner/events/batch', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ events }),
      });
      if (!res.ok) throw new Error('Failed to send');
      setSentToPlan(true);
      router.refresh();
      trackEvent('copilot_send_to_planner', user.uid, { eventCount: events.length });
    } catch { setError('Failed to send plan to planner'); }
    finally { setSendingToPlan(false); }
  };


  const deleteConversation = async (id: string) => {
    if (!user) return;
    setDeletingConvId(id);
    try {
      const token = await getToken();
      await fetch(`/api/copilot/conversations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversationsList(prev => prev.filter(c => c.id !== id));
    } catch { setError('Failed to delete conversation'); }
    finally { setDeletingConvId(null); }
  };

  const pinSuggestion = async (t: SuggestedTodo) => {
    if (!user) return;
    setPinningTodo(t.title);
    try {
      const pinnedItem = {
        id: `pin_${Date.now()}`,
        title: t.title,
        notes: t.notes,
        priority: t.priority,
        pinnedAt: new Date().toISOString(),
      };
      await updateDoc(doc(db, 'users', user.uid), {
        pinnedSuggestions: arrayUnion(pinnedItem),
      });
      setPinnedTitles(prev => new Set([...prev, t.title]));
      setTimeout(() => {
        setPinnedTitles(prev => { const next = new Set(prev); next.delete(t.title); return next; });
        setResponse(prev => prev ? { ...prev, suggestedTodos: prev.suggestedTodos.filter(x => x.title !== t.title) } : null);
      }, 1500);
    } catch { setError('Failed to pin suggestion'); }
    finally { setPinningTodo(null); }
  };

  const undoAssist = async () => {
    if (!user || !response?.undoToken) return;
    setUndoing(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/copilot/undo', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ undoToken: response.undoToken }),
      });
      if (!res.ok) throw new Error('Undo failed');
      setResponse(prev => prev ? { ...prev, undoToken: undefined, undoExpiresAt: undefined } : null);
    } catch { setError('Undo failed or expired'); }
    finally { setUndoing(false); }
  };

  const hasConversation = viewingArchiveId ? archivedView && archivedView.messages.length > 0 : conversationMessages.length > 0;
  const displayMessages = viewingArchiveId && archivedView ? archivedView.messages : conversationMessages;
  const lastAssistantIndex = (() => {
    for (let i = displayMessages.length - 1; i >= 0; i--) {
      if (displayMessages[i].role === 'assistant') return i;
    }
    return -1;
  })();

  /* ─── Render helpers ─── */

  const SignalIcon = ({ level }: { level: 'HIGH' | 'MEDIUM' | 'OK' }) => {
    if (level === 'HIGH') return <AlertTriangle className="h-3.5 w-3.5 text-[var(--danger)]" />;
    if (level === 'MEDIUM') return <Activity className="h-3.5 w-3.5 text-[var(--warning)]" />;
    return <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)]" />;
  };

  const renderInlineActions = () => {
    if (!response) return null;
    return (
      <div className="mt-3 space-y-3 max-w-2xl">
        {/* Priority chips */}
        {response.priorities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {response.priorities.slice(0, 4).map((p, i) => (
              <span
                key={i}
                title={p.rationale}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] text-xs font-medium px-2.5 py-1 border border-[var(--accent-blue)]/20"
              >
                <Target className="h-3 w-3" />
                {p.title}
              </span>
            ))}
          </div>
        )}

        {/* Suggested opportunities */}
        {response.suggestedOpportunities.length > 0 && (
          <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-card)] divide-y divide-[var(--border-soft)] overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
              <Briefcase className="h-3.5 w-3.5" />
              Relevant opportunities
            </div>
            {response.suggestedOpportunities.slice(0, 4).map((o, i) => (
              <div key={i} className="px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{o.title}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{o.company} · {o.location}</p>
                    {o.whyFit && <p className="text-xs text-[var(--accent-blue)] mt-0.5 line-clamp-2">{o.whyFit}</p>}
                  </div>
                  {o.url && (
                    <a
                      href={o.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-[var(--accent-blue)] hover:text-[var(--accent-blue-strong)]"
                      aria-label="Open opportunity"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Weekly plan — compact pill with send action */}
        {response.weeklyPlan && Object.keys(response.weeklyPlan).length > 0 && (
          <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-card)] p-3 flex items-center gap-3">
            <div className="rounded-lg bg-[var(--accent-blue-soft)] p-2 shrink-0">
              <Calendar className="h-4 w-4 text-[var(--accent-blue)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Weekly plan ready</p>
              <p className="text-xs text-[var(--text-muted)]">
                {Object.values(response.weeklyPlan).reduce((sum, day) => sum + day.length, 0)} tasks across the week
              </p>
            </div>
            <Button
              size="sm"
              variant={sentToPlan ? 'outline' : 'default'}
              onClick={sendWeeklyPlanToPlanner}
              disabled={sendingToPlan || sentToPlan}
              className="shrink-0"
            >
              {sendingToPlan ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Sending</>
              ) : sentToPlan ? (
                <>Sent</>
              ) : (
                <>Send to Planner</>
              )}
            </Button>
          </div>
        )}

        {/* Undo assist banner */}
        {response.undoToken && response.undoExpiresAt && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] text-sm">
            <Undo2 className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            <span className="flex-1 text-[var(--text-muted)] text-xs">Assist mode created to-dos. You can undo within 5 minutes.</span>
            <Button variant="outline" size="sm" onClick={undoAssist} disabled={undoing}>
              {undoing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Undo'}
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderSidebar = () => (
    <aside className="flex flex-col w-full h-full overflow-hidden bg-[var(--surface)]">
      {/* Panel toggle */}
      <div className="shrink-0 flex border-b border-[var(--border-soft)]">
        <button
          onClick={() => setSidebarPanel('signals')}
          className={`flex-1 px-3 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            sidebarPanel === 'signals'
              ? 'text-[var(--accent-blue)] border-b-2 border-[var(--accent-blue)]'
              : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          Career Signals
        </button>
        <button
          onClick={() => { setSidebarPanel('history'); setConversationsOpen(false); }}
          className={`flex-1 px-3 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            sidebarPanel === 'history'
              ? 'text-[var(--accent-blue)] border-b-2 border-[var(--accent-blue)]'
              : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
          }`}
        >
          <History className="h-3.5 w-3.5" />
          History
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {sidebarPanel === 'signals' ? (
          <>
            {/* ── Suggested next actions ── */}
            {response && response.suggestedTodos.length > 0 && (
              <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-card)] overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--border-soft)]">
                  <ListTodo className="h-3.5 w-3.5 text-[var(--accent-blue)] shrink-0" />
                  <span className="text-xs font-semibold text-[var(--accent-blue)] uppercase tracking-wide">Suggested actions</span>
                </div>
                <div className="divide-y divide-[var(--border-soft)]">
                  {response.suggestedTodos.slice(0, 5).map((t, i) => (
                    <div key={i} className="px-3 py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[var(--foreground)] leading-snug">{t.title}</p>
                          {t.notes && <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{t.notes}</p>}
                        </div>
                        {mode === 'suggest' && (
                          <div className="flex items-center gap-0.5 shrink-0 ml-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-1.5 text-xs text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/10"
                              onClick={() => addTodo(t)}
                              disabled={!!addingTodo}
                              title="Add to To-do list"
                            >
                              {addingTodo === t.title ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                            </Button>
                            {pinnedTitles.has(t.title) ? (
                              <span className="h-6 px-1.5 text-[10px] font-medium text-[var(--success)] flex items-center gap-0.5">
                                <CheckCircle2 className="h-3 w-3" />Saved
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-1.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/10 gap-0.5"
                                onClick={() => pinSuggestion(t)}
                                disabled={!!pinningTodo}
                                title="Save to Dashboard"
                              >
                                {pinningTodo === t.title ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Pin className="h-3 w-3" />Save</>}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-3 py-2 border-t border-[var(--border-soft)] bg-[var(--surface-subtle)] flex items-center gap-3">
                  <span className="text-[11px] text-[var(--text-subtle)] flex items-center gap-1">
                    <Plus className="h-3 w-3" />Add to To-do list
                  </span>
                  <span className="text-[11px] text-[var(--text-subtle)] flex items-center gap-1">
                    <Pin className="h-3 w-3" />Save to Dashboard
                  </span>
                </div>
              </div>
            )}

            {/* Signals */}
            <div>
              <div className="text-xs uppercase tracking-wide text-[var(--text-subtle)] font-semibold mb-2 px-1">
                Career signals
              </div>
              {sidebar?.signals && sidebar.signals.length > 0 ? (
                <div className="space-y-1.5">
                  {sidebar.signals.slice(0, 5).map((s) => (
                    <div key={s.key} className="flex items-start gap-2 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)] px-2.5 py-2">
                      <SignalIcon level={s.level} />
                      <p className="text-xs text-[var(--foreground)] leading-snug flex-1">{s.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--text-subtle)] px-1">
                  {sidebar ? 'All signals look good.' : 'Loading signals…'}
                </p>
              )}
            </div>

            {/* Quick stats */}
            <div>
              <div className="text-xs uppercase tracking-wide text-[var(--text-subtle)] font-semibold mb-2 px-1">Quick stats</div>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/profile" className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)] p-3 hover:border-[var(--accent-blue)]/40 transition-colors">
                  <div className="text-xs text-[var(--text-muted)] mb-1">Profile</div>
                  <div className="text-lg font-bold text-[var(--foreground)]">{sidebar?.profileCompletion ?? 0}%</div>
                </Link>
                <Link href="/cvscore" className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)] p-3 hover:border-[var(--accent-blue)]/40 transition-colors">
                  <div className="text-xs text-[var(--text-muted)] mb-1">CV score</div>
                  <div className="text-lg font-bold text-[var(--foreground)]">{sidebar?.cvScore != null ? `${sidebar.cvScore}` : '—'}</div>
                </Link>
              </div>
            </div>

            {/* Today's planner events */}
            <div>
              <div className="text-xs uppercase tracking-wide text-[var(--text-subtle)] font-semibold mb-2 px-1 flex items-center justify-between">
                <span>Today</span>
                <Link href="/planner" className="text-[var(--accent-blue)] normal-case tracking-normal hover:underline">Open planner</Link>
              </div>
              {sidebar && sidebar.todayPlannerEvents.length > 0 ? (
                <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)] divide-y divide-[var(--border-soft)] overflow-hidden">
                  {sidebar.todayPlannerEvents.slice(0, 6).map((e) => (
                    <div key={e.id} className="flex items-center gap-2 px-2.5 py-2">
                      {e.source === 'copilot' && <Brain className="h-3 w-3 text-[var(--accent-blue)] shrink-0" />}
                      <p className="text-xs text-[var(--foreground)] truncate flex-1">{e.title}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--text-subtle)] px-1">{sidebar ? 'Nothing planned for today.' : 'Loading…'}</p>
              )}
            </div>

            {/* Mode toggle */}
            <div>
              <div className="text-xs uppercase tracking-wide text-[var(--text-subtle)] font-semibold mb-2 px-1">G.ai mode</div>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-soft)]">
                <button onClick={() => setMode('suggest')} className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${mode === 'suggest' ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'}`}>Suggest</button>
                <button onClick={() => setMode('assist')} className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${mode === 'assist' ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'}`}>Assist</button>
              </div>
              <p className="text-xs text-[var(--text-subtle)] mt-1.5 px-1 leading-snug">
                {mode === 'suggest' ? 'Show Add buttons for to-dos.' : 'Auto-create top 3 to-dos with undo.'}
              </p>
            </div>
          </>
        ) : (
          /* History panel */
          <>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs uppercase tracking-wide text-[var(--text-subtle)] font-semibold px-1">Past conversations</p>
              <Button variant="ghost" size="sm" onClick={startNewConversation} className="h-6 px-2 text-xs">
                <Plus className="h-3 w-3 mr-1" />New
              </Button>
            </div>
            {conversationsList.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-8 w-8 text-[var(--text-subtle)] mx-auto mb-2" />
                <p className="text-xs text-[var(--text-subtle)]">No conversation history yet.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversationsList.map((c) => (
                  <div
                    key={c.id}
                    className={`group flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
                      viewingArchiveId === c.id
                        ? 'bg-[var(--accent-blue-soft)] border border-[var(--accent-blue)]/20'
                        : 'hover:bg-[var(--surface-subtle)] border border-transparent'
                    }`}
                    onClick={() => openArchived(c.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate text-[var(--foreground)]">{c.title}</p>
                      {c.createdAt && (
                        <p className="text-[10px] text-[var(--text-subtle)] mt-0.5">
                          {new Date(c.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                      disabled={deletingConvId === c.id}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-[var(--text-subtle)] hover:text-[var(--danger)] transition-all"
                      title="Delete conversation"
                    >
                      {deletingConvId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );

  return (
    <div className="h-[calc(100dvh-3rem)] lg:h-screen flex">
      {/* ─── Main chat zone ─── */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-[var(--border-soft)]">
        {/* Header bar */}
        <div className="shrink-0 border-b border-[var(--border-soft)] px-4 sm:px-6 py-3 flex items-center justify-between gap-3 bg-[var(--surface)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="rounded-lg bg-[var(--accent-blue-soft)] p-1.5 shrink-0">
              <Brain className="h-4 w-4 text-[var(--accent-blue)]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold truncate">G.ai</h1>
              <p className="text-xs text-[var(--text-subtle)] truncate">Your career AI — knows your profile, CV, and goals</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {!viewingArchiveId && conversationMessages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={archiveCurrentConversation} disabled={archivingCurrent} title="Archive conversation">
                {archivingCurrent ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={startNewConversation} title="New conversation">
              <Plus className="h-3.5 w-3.5" />
            </Button>
            {/* Mobile sidebar toggle */}
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpenMobile(true)} title="Show context">
              <PanelRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Archived banner */}
        {viewingArchiveId && archivedView && (
          <div className="shrink-0 mx-4 sm:mx-6 mt-3 rounded-lg border border-[var(--warning)]/40 bg-[var(--warning-soft)] p-3 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium flex-1">Viewing archived: {archivedView.title}</span>
            <Button variant="outline" size="sm" onClick={restoreConversation} disabled={restoring}>
              {restoring && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              Continue this conversation
            </Button>
            <Button variant="ghost" size="sm" onClick={backToCurrent}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
            </Button>
          </div>
        )}

        {loadingArchive && (
          <div className="shrink-0 mx-4 sm:mx-6 mt-3 flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading conversation...
          </div>
        )}

        {/* Scrolling thread */}
        <div ref={threadRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
            {/* Empty state — quick actions */}
            {!hasConversation && !loading && !loadingLatest && !viewingArchiveId && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="empty-state py-8 mb-4">
                  <Brain className="empty-state-icon !w-10 !h-10" />
                  <p className="font-medium mb-1">What would you like to work on?</p>
                  <p className="text-sm text-[var(--text-subtle)] max-w-md">
                    G.ai uses your profile, CV, applications, and to-dos to give personalized career guidance.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map(action => (
                    <button
                      key={action.label}
                      onClick={() => send(action.prompt)}
                      disabled={loading}
                      className="surface-card hover-lift rounded-xl p-3 flex items-start gap-2.5 text-left transition-all group"
                    >
                      <div className="rounded-lg bg-[var(--accent-blue-soft)] p-1.5 shrink-0">
                        <action.icon className="h-3.5 w-3.5 text-[var(--accent-blue)]" />
                      </div>
                      <span className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--accent-blue)] transition-colors">{action.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {loadingLatest && !hasConversation && (
              <div className="empty-state py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-blue)] mb-3" />
                <p className="text-sm">Loading your last session...</p>
              </div>
            )}

            {/* Conversation messages */}
            {hasConversation && (
              <div className="space-y-5">
                {displayMessages.map((m, i) => {
                  const isLastAssistant = i === lastAssistantIndex && !loading;
                  if (m.role === 'user') {
                    return (
                      <div key={i} className="flex justify-end">
                        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[var(--accent-blue-soft)] px-4 py-2.5 text-sm text-[var(--foreground)] leading-relaxed">
                          <div className="whitespace-pre-wrap break-words">{m.content}</div>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={i} className="flex flex-col items-start">
                      <div className="max-w-[90%] text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap break-words">
                        {m.content}
                      </div>
                      {isLastAssistant && !viewingArchiveId && renderInlineActions()}
                    </div>
                  );
                })}
                {loading && (
                  <div className="flex flex-col items-start">
                    <div className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)]">
                      <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-blue)]" />
                      Thinking…
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error inline */}
            {error && (
              <div className="mt-4 p-3 rounded-lg bg-[var(--danger-soft)] border border-[var(--danger)]/30 text-sm text-[var(--danger)]">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Pinned input bar */}
        {!viewingArchiveId && (
          <div className="shrink-0 border-t border-[var(--border-soft)] bg-[var(--surface)] px-4 sm:px-6 py-3">
            <div className="mx-auto max-w-3xl">
              <div className="flex items-end gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] px-3 py-2 focus-within:border-[var(--accent-blue)] focus-within:ring-2 focus-within:ring-[var(--accent-blue)]/15 transition-all">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder={conversationMessages.length > 0 ? 'Ask a follow-up…' : 'Ask a career question…'}
                  maxLength={4000}
                  disabled={loading}
                  className="flex-1 resize-none bg-transparent text-sm leading-6 text-[var(--foreground)] placeholder:text-[var(--text-muted)] outline-none min-h-[24px] max-h-[96px] py-1"
                />
                <Button
                  size="sm"
                  className="rounded-xl shrink-0 h-8 w-8 p-0"
                  onClick={() => send()}
                  disabled={loading || !message.trim()}
                  aria-label="Send"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-[var(--text-subtle)] mt-1.5 px-1">
                Press Enter to send · Shift+Enter for newline
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ─── Desktop sidebar ─── */}
      <div className="hidden lg:flex w-[340px] shrink-0 bg-[var(--surface)]">
        {renderSidebar()}
      </div>

      {/* ─── Mobile sidebar drawer ─── */}
      {sidebarOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/30"
            onClick={() => setSidebarOpenMobile(false)}
            aria-label="Close context panel"
          />
          <div className="w-[320px] bg-[var(--surface)] border-l border-[var(--border-soft)] shadow-[var(--shadow-lg)] flex flex-col">
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-[var(--border-soft)]">
              <span className="text-sm font-semibold">Context</span>
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpenMobile(false)} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {renderSidebar()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CopilotPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-blue)]" />
        </div>
      }
    >
      <CopilotPageInner />
    </Suspense>
  );
}
