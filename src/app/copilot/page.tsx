'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Brain, Send, Calendar, ListTodo, Briefcase, Target, Loader2, Plus, Undo2, X,
  ExternalLink, FolderOpen, ChevronDown, ArrowLeft, Archive, Sparkles,
  FileText, TrendingUp, MessageSquare, Lightbulb, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { trackEvent } from '@/lib/analytics';

/* ─── Types ─── */

interface ConversationSummary { id: string; title: string; createdAt: string | null; }
type Mode = 'suggest' | 'assist';
interface Priority { title: string; rationale: string }
interface SuggestedTodo { title: string; notes?: string; priority: string; dueDateISO?: string }
interface SuggestedOpp { jobId: string; title: string; company: string; location: string; url: string; whyFit: string }
interface ConsultingRec { recommended: boolean; reason: string; ctaText: string }
interface WeeklyPlanDay { title: string; notes?: string; }
interface CopilotResponse {
  answer: string;
  priorities: Priority[];
  suggestedTodos: SuggestedTodo[];
  suggestedOpportunities: SuggestedOpp[];
  consultingRecommendation?: ConsultingRec;
  weeklyPlan?: Record<string, WeeklyPlanDay[]>;
  undoToken?: string;
  undoExpiresAt?: string;
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

export default function CopilotPage() {
  const { user } = useAuth();
  const router = useRouter();
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
  const conversationsRef = useRef<HTMLDivElement>(null);
  const [addingTodo, setAddingTodo] = useState<string | null>(null);
  const [undoing, setUndoing] = useState(false);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [sendingToPlan, setSendingToPlan] = useState(false);
  const [sentToPlan, setSentToPlan] = useState(false);
  const [addingToPlanner, setAddingToPlanner] = useState<string | null>(null);
  const [plannerDateFor, setPlannerDateFor] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  /* ─── API Helpers ─── */

  const getToken = async () => user ? user.getIdToken() : null;

  const archiveCurrentConversation = async () => {
    if (!user) return;
    setArchivingCurrent(true);
    setConversationsOpen(false);
    try {
      const token = await getToken();
      await fetch('/api/copilot/conversations/archive', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      setResponse(null);
      setConversationMessages([]);
      setMessage('');
      const currentRes = await fetch('/api/copilot/current', { headers: { Authorization: `Bearer ${token}` } });
      if (currentRes.ok) { const d = await currentRes.json(); setConversationMessages(d.messages ?? []); }
      const listRes = await fetch('/api/copilot/conversations', { headers: { Authorization: `Bearer ${token}` } });
      if (listRes.ok) { const listData = await listRes.json(); setConversationsList(listData.conversations ?? []); }
    } catch { setError('Failed to archive conversation'); }
    finally { setArchivingCurrent(false); }
  };

  useEffect(() => {
    if (!conversationsOpen || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch('/api/copilot/conversations', { headers: { Authorization: `Bearer ${token}` } });
        if (!cancelled && res.ok) { const data = await res.json(); setConversationsList(data.conversations ?? []); }
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [conversationsOpen, user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (conversationsRef.current && !conversationsRef.current.contains(e.target as Node)) setConversationsOpen(false);
    }
    if (conversationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [conversationsOpen]);

  const startNewConversation = async () => {
    if (!user) return;
    setConversationsOpen(false);
    try {
      const token = await getToken();
      await fetch('/api/copilot/conversations/archive', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      await fetch('/api/copilot/current', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setResponse(null); setConversationMessages([]); setMessage(''); setViewingArchiveId(null); setArchivedView(null);
      const currentRes = await fetch('/api/copilot/current', { headers: { Authorization: `Bearer ${token}` } });
      if (currentRes.ok) { const d = await currentRes.json(); setConversationMessages(d.messages ?? []); }
      const listRes = await fetch('/api/copilot/conversations', { headers: { Authorization: `Bearer ${token}` } });
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

  const fetchLatestAndConversation = async () => {
    if (!user) return;
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
          suggestedOpportunities: data.suggestedOpportunities ?? [], consultingRecommendation: data.consultingRecommendation, weeklyPlan: data.weeklyPlan,
        });
      }
    }
    if (currentRes.ok) { const currentData = await currentRes.json(); setConversationMessages(currentData.messages ?? []); }
  };

  useEffect(() => {
    if (!user) { setLoadingLatest(false); return; }
    let cancelled = false;
    (async () => {
      try { await fetchLatestAndConversation(); }
      catch { /* ignore */ }
      finally { if (!cancelled) setLoadingLatest(false); }
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Auto-scroll conversation thread
  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [conversationMessages]);

  if (typeof window !== 'undefined' && !user) { router.push('/login'); return null; }

  const send = async (overrideMessage?: string) => {
    const text = (overrideMessage ?? message).trim();
    if (!text || !user) return;
    setLoading(true); setError(null);
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
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong'); }
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
      trackEvent('copilot_send_to_planner', user.uid, { eventCount: events.length });
    } catch { setError('Failed to send plan to planner'); }
    finally { setSendingToPlan(false); }
  };

  const addTodoToPlanner = async (t: SuggestedTodo, date: string) => {
    if (!user) return;
    setAddingToPlanner(t.title);
    try {
      const token = await getToken();
      const res = await fetch('/api/planner/events', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ date, title: t.title, notes: t.notes, source: 'copilot' }),
      });
      if (!res.ok) throw new Error('Failed to add');
      setPlannerDateFor(null);
      trackEvent('copilot_add_to_planner', user.uid, { todoTitle: t.title, date });
    } catch { setError('Failed to add to planner'); }
    finally { setAddingToPlanner(null); }
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

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-20 pb-12">
        {/* ─── Header ─── */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[var(--accent-blue-soft)] p-2.5">
              <Brain className="h-6 w-6 text-[var(--accent-blue)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Career Copilot</h1>
              <p className="text-sm text-[var(--text-muted)]">Your AI career strategist</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!viewingArchiveId && conversationMessages.length > 0 && (
              <Button variant="outline" size="sm" onClick={archiveCurrentConversation} disabled={archivingCurrent}>
                {archivingCurrent ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5 mr-1.5" />}
                Archive
              </Button>
            )}
            <div className="relative" ref={conversationsRef}>
              <Button variant="outline" size="sm" onClick={() => setConversationsOpen(o => !o)} aria-expanded={conversationsOpen}>
                <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
                History
                <ChevronDown className={`h-3.5 w-3.5 ml-1 transition-transform ${conversationsOpen ? 'rotate-180' : ''}`} />
              </Button>
              {conversationsOpen && (
                <div className="absolute right-0 top-full mt-1 w-72 max-h-[60vh] overflow-hidden rounded-lg border bg-[var(--surface)] shadow-[var(--shadow-lg)] z-50 flex flex-col" role="menu">
                  <button type="button" onClick={startNewConversation} className="text-left px-3 py-2.5 text-sm font-medium hover:bg-[var(--surface-subtle)] border-b transition-colors" role="menuitem">
                    <Plus className="h-3.5 w-3.5 inline mr-1.5" />New conversation
                  </button>
                  <div className="overflow-y-auto flex-1 min-h-0">
                    {conversationsList.length === 0 ? (
                      <p className="px-3 py-4 text-[var(--text-subtle)] text-sm">No archived conversations yet.</p>
                    ) : (
                      <ul className="py-1">
                        {conversationsList.map(c => (
                          <li key={c.id}>
                            <button type="button" onClick={() => openArchived(c.id)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface-subtle)] truncate transition-colors" role="menuitem" title={c.title}>
                              <span className="block truncate">{c.title}</span>
                              <span className="block text-xs text-[var(--text-subtle)] mt-0.5">
                                {c.createdAt ? new Date(c.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ─── Archived banner ─── */}
        {viewingArchiveId && archivedView && (
          <div className="mb-4 rounded-lg border border-[var(--warning)] bg-[var(--warning-soft)] p-3 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Viewing: {archivedView.title}</span>
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
          <div className="mb-4 flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading conversation...
          </div>
        )}

        {/* ─── Mode toggle ─── */}
        {!viewingArchiveId && (
          <motion.div
            className="flex items-center gap-2 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <span className="text-xs text-[var(--text-muted)] font-medium">Mode:</span>
            <button
              onClick={() => setMode('suggest')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${mode === 'suggest' ? 'bg-[var(--accent-blue)] text-white' : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:bg-[var(--border-soft)]'}`}
            >
              Suggest
            </button>
            <button
              onClick={() => setMode('assist')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${mode === 'assist' ? 'bg-[var(--accent-blue)] text-white' : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:bg-[var(--border-soft)]'}`}
            >
              Assist
            </button>
            <span className="text-xs text-[var(--text-subtle)] ml-1">
              {mode === 'suggest' ? 'Show Add buttons for to-dos' : 'Auto-create top 3 to-dos (with undo)'}
            </span>
          </motion.div>
        )}

        {/* ─── Conversation thread ─── */}
        {hasConversation && (
          <div ref={threadRef} className="mb-4 space-y-2.5 max-h-[360px] overflow-y-auto rounded-lg border bg-[var(--surface-subtle)] p-3">
            {displayMessages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.role === 'user'
                    ? 'bg-[var(--accent-blue)] text-white'
                    : 'bg-[var(--surface)] border text-[var(--foreground)]'
                }`}>
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-[var(--surface)] border px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-blue)]" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Quick action chips (show when no conversation yet) ─── */}
        {!hasConversation && !response && !loading && !loadingLatest && !viewingArchiveId && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="empty-state py-8 mb-4">
              <Brain className="empty-state-icon !w-10 !h-10" />
              <p className="font-medium mb-1">What would you like to work on?</p>
              <p className="text-sm text-[var(--text-subtle)] max-w-md">
                Copilot uses your profile, CV, applications, and to-dos to give personalized career guidance.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {QUICK_ACTIONS.map(action => (
                <button
                  key={action.label}
                  onClick={() => send(action.prompt)}
                  disabled={loading}
                  className="surface-card hover-lift rounded-lg p-3 flex items-start gap-2.5 text-left transition-all group"
                >
                  <action.icon className="h-4 w-4 text-[var(--accent-blue)] shrink-0 mt-0.5" />
                  <span className="text-sm font-medium group-hover:text-[var(--accent-blue)] transition-colors">{action.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ─── Input ─── */}
        {!viewingArchiveId && (
          <div className="flex gap-2 mb-6">
            <Input
              placeholder={conversationMessages.length > 0 ? 'Ask a follow-up...' : 'Ask a career question...'}
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              maxLength={4000}
              disabled={loading}
            />
            <Button onClick={() => send()} disabled={loading || !message.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        )}

        {/* ─── Error ─── */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[var(--danger-soft)] border border-[var(--danger)] text-sm text-[var(--danger)]">
            {error}
          </div>
        )}

        {/* ─── Response sections ─── */}
        {response && (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Main answer */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="h-4 w-4 text-[var(--accent-blue)]" />
                  <span className="text-sm font-semibold text-[var(--text-muted)]">Response</span>
                </div>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {response.answer}
                </div>
              </CardContent>
            </Card>

            {/* Priorities */}
            {response.priorities.length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-4 w-4 text-[var(--accent-blue)]" />
                    <span className="text-sm font-semibold text-[var(--text-muted)]">Priorities</span>
                  </div>
                  <div className="space-y-2">
                    {response.priorities.map((p, i) => (
                      <div key={i} className="surface-card-subtle rounded-lg p-3">
                        <p className="font-medium text-sm">{p.title}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{p.rationale}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Suggested todos */}
            {response.suggestedTodos.length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <ListTodo className="h-4 w-4 text-[var(--accent-blue)]" />
                    <span className="text-sm font-semibold text-[var(--text-muted)]">Suggested To-dos</span>
                  </div>
                  <div className="space-y-2">
                    {response.suggestedTodos.map((t, i) => (
                      <div key={i} className="flex items-center justify-between surface-card-subtle rounded-lg p-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm">{t.title}</p>
                          {t.notes && <p className="text-xs text-[var(--text-muted)] mt-0.5">{t.notes}</p>}
                        </div>
                        {mode === 'suggest' && (
                          <div className="flex items-center gap-1.5 ml-2 shrink-0">
                            <Button size="sm" variant="outline" onClick={() => addTodo(t)} disabled={!!addingTodo}>
                              {addingTodo === t.title ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
                              Add
                            </Button>
                            {plannerDateFor === t.title ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="date"
                                  className="text-xs rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[var(--foreground)]"
                                  onChange={(e) => { if (e.target.value) addTodoToPlanner(t, e.target.value); }}
                                  autoFocus
                                />
                                <button onClick={() => setPlannerDateFor(null)} className="text-[var(--text-muted)] hover:text-[var(--foreground)]">
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => setPlannerDateFor(t.title)} disabled={!!addingToPlanner} title="Add to Planner">
                                {addingToPlanner === t.title ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Calendar className="h-3.5 w-3.5" />}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Suggested opportunities */}
            {response.suggestedOpportunities.length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="h-4 w-4 text-[var(--accent-blue)]" />
                    <span className="text-sm font-semibold text-[var(--text-muted)]">Relevant Opportunities</span>
                  </div>
                  <div className="space-y-2">
                    {response.suggestedOpportunities.map((o, i) => (
                      <div key={i} className="surface-card-subtle rounded-lg p-3 hover:border-[var(--accent-blue)] transition-colors">
                        <p className="font-medium text-sm">{o.title}</p>
                        <p className="text-xs text-[var(--text-muted)]">{o.company} · {o.location}</p>
                        {o.whyFit && <p className="text-xs text-[var(--accent-blue)] mt-1">{o.whyFit}</p>}
                        {o.url && (
                          <a href={o.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[var(--accent-blue)] hover:underline mt-1.5 font-medium">
                            <ExternalLink className="h-3 w-3" /> View opportunity
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Consulting recommendation */}
            {response.consultingRecommendation?.recommended && (
              <Card className="border-[var(--warning)]">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-[var(--warning)]" />
                    <span className="text-sm font-semibold">Consider Gradual Consulting</span>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] mb-3">{response.consultingRecommendation.reason}</p>
                  <Link href="/consulting/contact">
                    <Button size="sm">
                      {response.consultingRecommendation.ctaText}
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Undo banner */}
            {response.undoToken && response.undoExpiresAt && (
              <div className="flex items-center gap-2 p-3 rounded-lg surface-card-subtle text-sm">
                <span className="text-[var(--text-muted)]">Assist mode created to-dos. Undo within 5 minutes.</span>
                <Button variant="outline" size="sm" onClick={undoAssist} disabled={undoing}>
                  {undoing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Undo2 className="h-3.5 w-3.5 mr-1" />}
                  Undo
                </Button>
              </div>
            )}

            {/* Weekly plan */}
            {response.weeklyPlan && Object.keys(response.weeklyPlan).length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-4 w-4 text-[var(--accent-blue)]" />
                    <span className="text-sm font-semibold text-[var(--text-muted)]">Your Week at a Glance</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
                    {(() => {
                      const mon = new Date();
                      const day = mon.getDay();
                      const diff = day === 0 ? -6 : 1 - day;
                      mon.setDate(mon.getDate() + diff);
                      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
                      return dayNames.map((dayName, i) => {
                        const date = new Date(mon);
                        date.setDate(mon.getDate() + i);
                        const key = date.toISOString().slice(0, 10);
                        const tasks = response.weeklyPlan![key] ?? [];
                        return (
                          <div key={dayName} className="surface-card-subtle rounded-lg p-2.5">
                            <div className="text-xs font-medium text-[var(--text-muted)] mb-1.5">
                              {dayName} {date.getDate()}/{date.getMonth() + 1}
                            </div>
                            <ul className="space-y-1 text-xs">
                              {tasks.map((t, j) => (
                                <li key={j}>
                                  <span>{t.title}</span>
                                  {t.notes && <span className="block text-[var(--text-subtle)]">{t.notes}</span>}
                                </li>
                              ))}
                              {tasks.length === 0 && <span className="text-[var(--text-subtle)]">—</span>}
                            </ul>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <Button
                      size="sm"
                      variant={sentToPlan ? 'outline' : 'default'}
                      onClick={sendWeeklyPlanToPlanner}
                      disabled={sendingToPlan || sentToPlan}
                    >
                      {sendingToPlan ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Sending...</>
                      ) : sentToPlan ? (
                        <>Sent to Planner</>
                      ) : (
                        <><Calendar className="h-3.5 w-3.5 mr-1.5" />Send to Planner</>
                      )}
                    </Button>
                    <Link href="/planner" className="text-xs text-[var(--accent-blue)] hover:underline">
                      Open Planner
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Contextual next steps */}
            {(() => {
              const nextSteps: { label: string; href: string; icon: typeof ArrowRight }[] = [];
              if (response.suggestedTodos.length > 0) {
                nextSteps.push({ label: 'View your planner', href: '/planner', icon: Calendar });
              }
              if (response.suggestedOpportunities.length > 0) {
                nextSteps.push({ label: 'Browse all opportunities', href: '/suggestions', icon: Briefcase });
              }
              if (response.weeklyPlan && Object.keys(response.weeklyPlan).length > 0) {
                nextSteps.push({ label: 'Open planner', href: '/planner', icon: Calendar });
              }
              if (response.answer.toLowerCase().includes('cv') || response.answer.toLowerCase().includes('resume')) {
                nextSteps.push({ label: 'Update your profile', href: '/profile', icon: FileText });
              }
              // Deduplicate by href
              const seen = new Set<string>();
              const unique = nextSteps.filter(s => { if (seen.has(s.href)) return false; seen.add(s.href); return true; });
              if (unique.length === 0) return null;
              return (
                <div className="flex flex-wrap gap-2 pt-1">
                  {unique.map((step) => {
                    const Icon = step.icon;
                    return (
                      <Link key={step.href} href={step.href}>
                        <Button variant="outline" size="sm" className="text-xs">
                          <Icon className="h-3.5 w-3.5 mr-1.5" />
                          {step.label}
                          <ArrowRight className="h-3 w-3 ml-1.5" />
                        </Button>
                      </Link>
                    );
                  })}
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* ─── Empty state (loading latest) ─── */}
        {!response && !loading && loadingLatest && (
          <div className="empty-state py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-blue)] mb-3" />
            <p className="text-sm">Loading your last session...</p>
          </div>
        )}
      </div>
    </div>
  );
}
