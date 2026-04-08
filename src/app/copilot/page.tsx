'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Send, Calendar, ListTodo, Briefcase, Target, Loader2, Plus, Undo2, ExternalLink, FolderOpen, ChevronDown, ArrowLeft, Archive } from 'lucide-react';
import Link from 'next/link';

interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string | null;
}

type Mode = 'suggest' | 'assist';

interface Priority { title: string; rationale: string }
interface SuggestedTodo { title: string; notes?: string; priority: string; dueDateISO?: string }
interface SuggestedOpp { jobId: string; title: string; company: string; location: string; url: string; whyFit: string }
interface ConsultingRec { recommended: boolean; reason: string; ctaText: string }

interface WeeklyPlanDay {
  title: string;
  notes?: string;
}
interface CopilotResponse {
  answer: string;
  priorities: Priority[];
  suggestedTodos: SuggestedTodo[];
  suggestedOpportunities: SuggestedOpp[];
  consultingRecommendation?: ConsultingRec;
  /** When present, keys are YYYY-MM-DD and values are tasks for that day (weekly plan view) */
  weeklyPlan?: Record<string, WeeklyPlanDay[]>;
  undoToken?: string;
  undoExpiresAt?: string;
}

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

  const archiveCurrentConversation = async () => {
    if (!user) return;
    setArchivingCurrent(true);
    setConversationsOpen(false);
    try {
      const token = await user.getIdToken();
      await fetch('/api/copilot/conversations/archive', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      setResponse(null);
      setConversationMessages([]);
      setMessage('');
      const currentRes = await fetch('/api/copilot/current', { headers: { Authorization: `Bearer ${token}` } });
      if (currentRes.ok) {
        const d = await currentRes.json();
        setConversationMessages(d.messages ?? []);
      }
      const listRes = await fetch('/api/copilot/conversations', { headers: { Authorization: `Bearer ${token}` } });
      if (listRes.ok) {
        const listData = await listRes.json();
        setConversationsList(listData.conversations ?? []);
      }
    } catch {
      setError('Failed to archive conversation');
    } finally {
      setArchivingCurrent(false);
    }
  };

  useEffect(() => {
    if (!conversationsOpen || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/copilot/conversations', { headers: { Authorization: `Bearer ${token}` } });
        if (!cancelled && res.ok) {
          const data = await res.json();
          setConversationsList(data.conversations ?? []);
        }
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, [conversationsOpen, user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (conversationsRef.current && !conversationsRef.current.contains(e.target as Node)) {
        setConversationsOpen(false);
      }
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
      const token = await user.getIdToken();
      await fetch('/api/copilot/conversations/archive', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      await fetch('/api/copilot/current', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setResponse(null);
      setConversationMessages([]);
      setMessage('');
      setViewingArchiveId(null);
      setArchivedView(null);
      const currentRes = await fetch('/api/copilot/current', { headers: { Authorization: `Bearer ${token}` } });
      if (currentRes.ok) {
        const d = await currentRes.json();
        setConversationMessages(d.messages ?? []);
      }
      const listRes = await fetch('/api/copilot/conversations', { headers: { Authorization: `Bearer ${token}` } });
      if (listRes.ok) {
        const listData = await listRes.json();
        setConversationsList(listData.conversations ?? []);
      }
    } catch {
      setError('Failed to start new conversation');
    }
  };

  const openArchived = async (id: string) => {
    if (!user) return;
    setLoadingArchive(true);
    setConversationsOpen(false);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/copilot/conversations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setViewingArchiveId(id);
      setArchivedView({ messages: data.messages ?? [], title: data.title ?? 'Conversation' });
      setResponse(null);
    } catch {
      setError('Failed to load conversation');
    } finally {
      setLoadingArchive(false);
    }
  };

  const backToCurrent = () => {
    setViewingArchiveId(null);
    setArchivedView(null);
  };

  const restoreConversation = async () => {
    if (!user || !viewingArchiveId) return;
    setRestoring(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/copilot/conversations/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: viewingArchiveId }),
      });
      if (!res.ok) throw new Error('Failed to restore');
      setArchivedView(null);
      setViewingArchiveId(null);
      const currentRes = await fetch('/api/copilot/current', { headers: { Authorization: `Bearer ${token}` } });
      if (currentRes.ok) {
        const d = await currentRes.json();
        setConversationMessages(d.messages ?? []);
      }
      setResponse(null);
    } catch {
      setError('Failed to restore conversation');
    } finally {
      setRestoring(false);
    }
  };

  const [addingTodo, setAddingTodo] = useState<string | null>(null);
  const [undoing, setUndoing] = useState(false);
  const [loadingLatest, setLoadingLatest] = useState(true);

  const fetchLatestAndConversation = async () => {
    if (!user) return;
    const token = await user.getIdToken();
    const [latestRes, currentRes] = await Promise.all([
      fetch('/api/copilot/latest', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/copilot/current', { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    if (latestRes.ok) {
      const data = await latestRes.json();
      if (data && data.answer) {
        setResponse({
          answer: data.answer,
          priorities: data.priorities ?? [],
          suggestedTodos: data.suggestedTodos ?? [],
          suggestedOpportunities: data.suggestedOpportunities ?? [],
          consultingRecommendation: data.consultingRecommendation,
          weeklyPlan: data.weeklyPlan,
        });
      }
    }
    if (currentRes.ok) {
      const currentData = await currentRes.json();
      setConversationMessages(currentData.messages ?? []);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoadingLatest(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await fetchLatestAndConversation();
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingLatest(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (typeof window !== 'undefined' && !user) {
    router.push('/login');
    return null;
  }

  const send = async (overrideMessage?: string) => {
    const text = (overrideMessage ?? message).trim();
    if (!text || !user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Request failed');
      setResponse(data as CopilotResponse);
      if (!overrideMessage) setMessage('');
      // Refresh conversation thread so user sees their message and the new reply
      const currentRes = await fetch('/api/copilot/current', { headers: { Authorization: `Bearer ${token}` } });
      if (currentRes.ok) {
        const currentData = await currentRes.json();
        setConversationMessages(currentData.messages ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (t: SuggestedTodo) => {
    if (!user) return;
    setAddingTodo(t.title);
    try {
      const token = await user.getIdToken();
      const text = t.notes?.trim() ? `${t.title}\n${t.notes.trim()}` : t.title;
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('Failed to add');
      setResponse((prev) => prev ? {
        ...prev,
        suggestedTodos: prev.suggestedTodos.filter((x) => x.title !== t.title),
      } : null);
    } catch {
      setError('Failed to add to-do');
    } finally {
      setAddingTodo(null);
    }
  };

  const undoAssist = async () => {
    if (!user || !response?.undoToken) return;
    setUndoing(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/copilot/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ undoToken: response.undoToken }),
      });
      if (!res.ok) throw new Error('Undo failed');
      setResponse((prev) => prev ? { ...prev, undoToken: undefined, undoExpiresAt: undefined } : null);
    } catch {
      setError('Undo failed or expired');
    } finally {
      setUndoing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Brain className="h-9 w-9 text-blue-500" />
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Gradual Copilot</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/planner">
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-gray-300 hover:bg-white/10"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Open Planner
              </Button>
            </Link>
            {!viewingArchiveId && conversationMessages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={archiveCurrentConversation}
                disabled={archivingCurrent}
                className="border-white/20 text-gray-300 hover:bg-white/10"
                aria-label="Archive current conversation"
              >
                {archivingCurrent ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4 mr-2" />}
                Archive
              </Button>
            )}
            <div className="relative" ref={conversationsRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConversationsOpen((o) => !o)}
                className="border-white/20 text-gray-300 hover:bg-white/10"
                aria-expanded={conversationsOpen}
                aria-haspopup="true"
                aria-label="Conversations"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Conversations
                <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${conversationsOpen ? 'rotate-180' : ''}`} />
              </Button>
              {conversationsOpen && (
                <div
                  className="absolute right-0 top-full mt-1 w-72 max-h-[70vh] overflow-hidden rounded-lg border border-white/10 bg-slate-900 shadow-xl z-50 flex flex-col"
                  role="menu"
                >
                  <button
                    type="button"
                    onClick={startNewConversation}
                    className="text-left px-3 py-2.5 text-sm text-gray-200 hover:bg-white/10 border-b border-white/10"
                    role="menuitem"
                  >
                    Start new conversation
                  </button>
                  <div className="overflow-y-auto flex-1 min-h-0">
                    {conversationsList.length === 0 ? (
                      <p className="px-3 py-4 text-gray-500 text-sm">No archived conversations yet.</p>
                    ) : (
                      <ul className="py-1">
                        {conversationsList.map((c) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              onClick={() => openArchived(c.id)}
                              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/10 truncate"
                              role="menuitem"
                              title={c.title}
                            >
                              <span className="block truncate">{c.title}</span>
                              <span className="block text-xs text-gray-500 mt-0.5">
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
        </div>

        {/* Viewing archived conversation */}
        {viewingArchiveId && archivedView && (
          <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex flex-wrap items-center gap-2">
            <span className="text-amber-200 text-sm font-medium">Viewing archived: {archivedView.title}</span>
            <Button variant="outline" size="sm" onClick={restoreConversation} disabled={restoring} className="border-amber-400/50 text-amber-200 hover:bg-amber-500/20">
              {restoring ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Continue this conversation
            </Button>
            <Button variant="ghost" size="sm" onClick={backToCurrent} className="text-gray-400 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to current
            </Button>
          </div>
        )}

        {loadingArchive && (
          <div className="mb-4 flex items-center gap-2 text-gray-400 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading conversation…
          </div>
        )}
        <p className="text-gray-300 mb-6">
          Ask strategic career questions or get a weekly plan. Copilot uses your profile, CV, applications, and to-dos.
        </p>

        {/* Mode toggle */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-gray-400 text-sm">Mode:</span>
          <Button
            variant={mode === 'suggest' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('suggest')}
            className={mode === 'suggest' ? 'bg-blue-600' : 'border-white/20 text-gray-300'}
          >
            Suggest
          </Button>
          <Button
            variant={mode === 'assist' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('assist')}
            className={mode === 'assist' ? 'bg-blue-600' : 'border-white/20 text-gray-300'}
          >
            Assist
          </Button>
          <span className="text-gray-500 text-xs ml-2">
            {mode === 'suggest' ? 'Show Add buttons for to-dos' : 'Auto-create top 3 to-dos (with undo)'}
          </span>
        </div>

        {/* Conversation thread: user and assistant messages (current or archived) */}
        {((viewingArchiveId && archivedView && archivedView.messages.length > 0) || (!viewingArchiveId && conversationMessages.length > 0)) && (
          <div className="mb-6 space-y-3 max-h-[320px] overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-3">
            {(viewingArchiveId && archivedView ? archivedView.messages : conversationMessages).map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    m.role === 'user'
                      ? 'bg-blue-600/80 text-white'
                      : 'bg-white/10 text-gray-200 border border-white/10'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Input + actions (hidden when viewing archived) */}
        {!viewingArchiveId && (
          <div className="flex gap-2 mb-6">
            <Input
              placeholder={conversationMessages.length > 0 ? 'Ask a follow-up...' : 'Ask a career question or paste your goal...'}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              maxLength={4000}
              disabled={loading}
            />
            <Button
              onClick={() => send()}
              disabled={loading || !message.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              onClick={() => send('Generate my weekly plan based on my profile, CV, applications, and to-dos.')}
              disabled={loading}
              className="border-white/20 text-gray-300"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Weekly plan
            </Button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-400/50 text-red-200 text-sm">
            {error}
          </div>
        )}

        {response && (
          <div className="space-y-6">
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert prose-sm max-w-none text-gray-200 whitespace-pre-wrap">
                  {response.answer.split('\n').map((line, i) => (
                    <span key={i}>{line}{i < response.answer.split('\n').length - 1 && <br />}</span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {response.priorities && response.priorities.length > 0 && (
              <Card className="bg-white/5 backdrop-blur-md border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Priorities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {response.priorities.map((p, i) => (
                    <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="font-medium text-white">{p.title}</div>
                      <div className="text-gray-400 text-sm">{p.rationale}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {response.suggestedTodos && response.suggestedTodos.length > 0 && (
              <Card className="bg-white/5 backdrop-blur-md border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <ListTodo className="h-5 w-5" />
                    Suggested to-dos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {response.suggestedTodos.map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div>
                        <div className="font-medium text-white">{t.title}</div>
                        {t.notes && <div className="text-gray-400 text-sm">{t.notes}</div>}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addTodo(t)}
                        disabled={!!addingTodo}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {addingTodo === t.title ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Add
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {response.suggestedOpportunities && response.suggestedOpportunities.length > 0 && (
              <Card className="bg-white/5 backdrop-blur-md border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Suggested opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {response.suggestedOpportunities.map((o, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-blue-400/30 transition-colors"
                    >
                      <div className="font-medium text-white">{o.title}</div>
                      <div className="text-gray-400 text-sm">{o.company} · {o.location}</div>
                      {o.whyFit && <div className="text-blue-200 text-sm mt-1">{o.whyFit}</div>}
                      {o.url && (
                        <a
                          href={o.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-400 hover:underline mt-2 text-sm"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open
                        </a>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {response.consultingRecommendation?.recommended && (
              <Card className="bg-amber-500/10 backdrop-blur-md border-amber-400/30">
                <CardHeader>
                  <CardTitle className="text-amber-200">Consider Gradual Consulting</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-200 mb-4">{response.consultingRecommendation.reason}</p>
                  <Link href="/consulting/contact">
                    <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                      {response.consultingRecommendation.ctaText}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {response.undoToken && response.undoExpiresAt && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-gray-400 text-sm">Assist mode created to-dos. You can undo within 5 minutes.</span>
                <Button variant="outline" size="sm" onClick={undoAssist} disabled={undoing} className="border-white/20 text-gray-300">
                  {undoing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4 mr-1" />}
                  Undo
                </Button>
              </div>
            )}

            {/* Weekly plan day-by-day view */}
            {response.weeklyPlan && Object.keys(response.weeklyPlan).length > 0 && (
              <Card className="bg-white/5 backdrop-blur-md border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Your week at a glance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
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
                          <div key={dayName} className="rounded-lg border border-white/10 bg-white/5 p-3">
                            <div className="text-xs font-medium text-gray-400 mb-2">
                              {dayName} {date.getDate()}/{date.getMonth() + 1}
                            </div>
                            <ul className="space-y-1.5 text-sm text-gray-200">
                              {tasks.map((t, j) => (
                                <li key={j} className="flex flex-col gap-0.5">
                                  <span>{t.title}</span>
                                  {t.notes && <span className="text-gray-500 text-xs">{t.notes}</span>}
                                </li>
                              ))}
                              {tasks.length === 0 && <span className="text-gray-500 text-xs">—</span>}
                            </ul>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <p className="text-gray-500 text-xs mt-3">Add these to your <Link href="/planner" className="text-blue-400 hover:underline">Planner</Link> or dashboard to-dos to track them.</p>
                </CardContent>
              </Card>
            )}

            <p className="text-gray-500 text-sm">You can ask a follow-up below or start a new conversation.</p>
          </div>
        )}

        {!response && !loading && (
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardContent className="py-12 text-center text-gray-400">
              {loadingLatest ? (
                <>
                  <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin opacity-50" />
                  <p>Loading your last Copilot output…</p>
                </>
              ) : (
                <>
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ask a question or click &quot;Weekly plan&quot; to get started.</p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
