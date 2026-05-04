'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Loader2,
  GraduationCap,
  Calendar,
  X,
  Clock,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getWeekRange(weekStart: Date): { from: string; to: string } {
  const mon = new Date(weekStart);
  const sun = new Date(mon);
  sun.setDate(sun.getDate() + 6);
  return { from: formatDateKey(mon), to: formatDateKey(sun) };
}

function getMonthRange(year: number, month: number): { from: string; to: string } {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  return { from: formatDateKey(first), to: formatDateKey(last) };
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const suffix = h < 12 ? 'am' : 'pm';
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, '0')}${suffix}`;
}

interface PlannerEvent {
  id: string;
  date: string;
  title: string;
  notes?: string;
  source?: string;
  startTime?: string | null;
  endTime?: string | null;
  createdAt: string | null;
}

function EventSourceIcon({ source }: { source?: string }) {
  if (source === 'copilot') return <Brain className="h-2.5 w-2.5 shrink-0" />;
  if (source === 'path') return <GraduationCap className="h-2.5 w-2.5 shrink-0" />;
  return null;
}

function getEventColor(source?: string) {
  if (source === 'copilot') return 'bg-[var(--accent-blue-soft)] border-[var(--accent-blue)]/30 text-[var(--accent-blue)]';
  if (source === 'path') return 'bg-[var(--success-soft)] border-[var(--success)]/30 text-[var(--success)]';
  return 'bg-[var(--surface-elevated)] border-[var(--border-soft)] text-[var(--foreground)]';
}

/* ─── Task Detail Panel ─── */
function TaskDetailPanel({
  event,
  onClose,
  onDelete,
  onSave,
}: {
  event: PlannerEvent;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  onSave: (id: string, patch: Partial<Pick<PlannerEvent, 'title' | 'notes' | 'startTime' | 'endTime'>>) => Promise<void>;
}) {
  const [title, setTitle] = useState(event.title);
  const [notes, setNotes] = useState(event.notes ?? '');
  const [startTime, setStartTime] = useState(event.startTime ?? '');
  const [endTime, setEndTime] = useState(event.endTime ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const dirty =
    title !== event.title ||
    notes !== (event.notes ?? '') ||
    startTime !== (event.startTime ?? '') ||
    endTime !== (event.endTime ?? '');

  const save = async () => {
    if (!dirty) return;
    setSaving(true);
    await onSave(event.id, {
      title: title.trim() || event.title,
      notes,
      startTime: startTime || null,
      endTime: endTime || null,
    });
    setSaving(false);
  };

  const del = async () => {
    setDeleting(true);
    await onDelete(event.id);
    setDeleting(false);
  };

  const dateLabel = new Date(event.date + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <motion.div
      initial={{ x: 340, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 340, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed right-0 top-0 h-full w-[340px] bg-[var(--surface)] border-l border-[var(--border-soft)] shadow-[var(--shadow-lg)] z-40 flex flex-col"
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-[var(--border-soft)]">
        <div>
          <p className="text-xs text-[var(--text-subtle)] font-medium">{dateLabel}</p>
          {event.source && event.source !== 'user' && (
            <span className={`inline-flex items-center gap-1 mt-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${
              event.source === 'copilot'
                ? 'bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]'
                : 'bg-[var(--success-soft)] text-[var(--success)]'
            }`}>
              <EventSourceIcon source={event.source} />
              {event.source === 'copilot' ? 'AI-generated' : 'Capability path'}
            </span>
          )}
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-[var(--surface-subtle)] text-[var(--text-muted)]">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Title */}
        <div>
          <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide block mb-1.5">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-sm bg-[var(--surface-card)] border-[var(--border-soft)] focus:border-[var(--accent-blue)]"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide block mb-1.5 flex items-center gap-1.5">
            <FileText className="h-3 w-3" />Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes or description…"
            rows={4}
            className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--text-muted)] resize-none outline-none focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]/20 transition-all"
          />
        </div>

        {/* Time */}
        <div>
          <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide block mb-1.5 flex items-center gap-1.5">
            <Clock className="h-3 w-3" />Time (optional)
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p className="text-[10px] text-[var(--text-subtle)] mb-1">Start</p>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="text-sm bg-[var(--surface-card)] border-[var(--border-soft)] focus:border-[var(--accent-blue)]"
              />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-[var(--text-subtle)] mb-1">End</p>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="text-sm bg-[var(--surface-card)] border-[var(--border-soft)] focus:border-[var(--accent-blue)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 px-5 py-4 border-t border-[var(--border-soft)] flex items-center gap-2">
        <Button
          size="sm"
          onClick={save}
          disabled={!dirty || saving}
          className="flex-1"
        >
          {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Saving</> : 'Save changes'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={del}
          disabled={deleting}
          className="text-[var(--danger)] border-[var(--danger)]/30 hover:bg-[var(--danger-soft)]"
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </motion.div>
  );
}

export default function PlannerPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<'week' | 'month'>('week');
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<string | null>(null);
  const [addingForDate, setAddingForDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<PlannerEvent | null>(null);

  const fetchEvents = useCallback(
    async (from: string, to: string) => {
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch(`/api/planner/events?from=${from}&to=${to}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setEvents(data.events ?? []);
    },
    [user]
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (view === 'week') {
      const { from, to } = getWeekRange(weekStart);
      setLoading(true);
      fetchEvents(from, to).finally(() => setLoading(false));
    } else {
      const { from, to } = getMonthRange(monthDate.getFullYear(), monthDate.getMonth());
      setLoading(true);
      fetchEvents(from, to).finally(() => setLoading(false));
    }
  }, [authLoading, user, view, weekStart, monthDate, fetchEvents, router]);

  const addEvent = async (date: string) => {
    const title = (newTitle[date] ?? '').trim();
    if (!title || !user) return;
    setAdding(date);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/planner/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ date, title }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setEvents((prev) => [...prev, { id: data.id, date, title, notes: data.notes, source: 'user', startTime: null, endTime: null, createdAt: null }]);
      setNewTitle((prev) => ({ ...prev, [date]: '' }));
      setAddingForDate(null);
    } catch {
      // ignore
    } finally {
      setAdding(null);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!user) return;
    setDeleting(id);
    try {
      const token = await user.getIdToken();
      await fetch(`/api/planner/events/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setEvents((prev) => prev.filter((e) => e.id !== id));
      if (selectedEvent?.id === id) setSelectedEvent(null);
    } catch {
      // ignore
    } finally {
      setDeleting(null);
    }
  };

  const updateEvent = async (
    id: string,
    patch: Partial<Pick<PlannerEvent, 'title' | 'notes' | 'startTime' | 'endTime'>>
  ) => {
    if (!user) return;
    const token = await user.getIdToken();
    await fetch(`/api/planner/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    });
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
    setSelectedEvent((prev) => (prev?.id === id ? { ...prev, ...patch } : prev));
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const monthYear = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(monthYear, month, 1);
  const lastDay = new Date(monthYear, month + 1, 0);
  const startPad = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();
  const monthGrid = Array.from({ length: startPad + daysInMonth }, (_, i) =>
    i < startPad ? null : new Date(monthYear, month, i - startPad + 1)
  );

  const eventsByDate = events.reduce<Record<string, PlannerEvent[]>>((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {});

  const todayKey = formatDateKey(new Date());

  const goToToday = () => {
    if (view === 'week') {
      setWeekStart(getMonday(new Date()));
    } else {
      setMonthDate(new Date());
    }
  };

  if (!user) return null;

  return (
    <div className="h-screen flex flex-col">
      <div className="shrink-0 page-container pb-0">
        {/* ─── Header ─── */}
        <div className="page-header pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl bg-[var(--accent-blue-soft)] p-2.5">
                <Calendar className="h-5 w-5 text-[var(--accent-blue)]" />
              </div>
              <div>
                <h1 className="page-title">Planner</h1>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {view === 'week'
                    ? `${weekDays[0].toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })} – ${weekDays[6].toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    : monthDate.toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' })
                  }
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday} className="text-xs">Today</Button>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (view === 'week') {
                      const d = new Date(weekStart);
                      d.setDate(d.getDate() - 7);
                      setWeekStart(d);
                    } else {
                      setMonthDate(new Date(monthYear, month - 1));
                    }
                  }}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (view === 'week') {
                      const d = new Date(weekStart);
                      d.setDate(d.getDate() + 7);
                      setWeekStart(d);
                    } else {
                      setMonthDate(new Date(monthYear, month + 1));
                    }
                  }}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="tab-nav !p-0.5 !gap-0.5">
                <button onClick={() => setView('week')} className={`tab-nav-item !py-1.5 !px-3 !text-xs ${view === 'week' ? 'active' : ''}`}>Week</button>
                <button onClick={() => setView('month')} className={`tab-nav-item !py-1.5 !px-3 !text-xs ${view === 'month' ? 'active' : ''}`}>Month</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-blue)]" />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden px-4 sm:px-6 lg:px-8 pb-4">
          {/* ─── Week View ─── */}
          {view === 'week' && (
            <>
              {/* Desktop: full-height 7-column grid */}
              <div className="hidden md:grid grid-cols-7 gap-px bg-[var(--border-soft)] rounded-xl overflow-hidden border border-[var(--border-soft)] h-full">
                {weekDays.map((d) => {
                  const key = formatDateKey(d);
                  const isToday = key === todayKey;
                  const dayEvents = (eventsByDate[key] ?? []).sort((a, b) => {
                    if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
                    if (a.startTime) return -1;
                    if (b.startTime) return 1;
                    return 0;
                  });
                  const dayName = DAY_NAMES[d.getDay() === 0 ? 6 : d.getDay() - 1];
                  return (
                    <div key={key} className={`flex flex-col bg-[var(--surface-card)] overflow-hidden ${isToday ? 'ring-inset ring-2 ring-[var(--accent-blue)]' : ''}`}>
                      {/* Day header */}
                      <div className={`shrink-0 px-3 py-3 border-b border-[var(--border-soft)] ${isToday ? 'bg-[var(--accent-blue)] text-white' : 'bg-[var(--surface)]'}`}>
                        <p className={`text-[10px] font-semibold uppercase tracking-widest ${isToday ? 'text-white/80' : 'text-[var(--text-subtle)]'}`}>
                          {dayName}
                        </p>
                        <p className={`text-2xl font-bold leading-none mt-0.5 ${isToday ? 'text-white' : 'text-[var(--foreground)]'}`}>
                          {d.getDate()}
                        </p>
                      </div>

                      {/* Events list — scrollable */}
                      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
                        {dayEvents.map((e) => (
                          <motion.div
                            key={e.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`group flex flex-col gap-0.5 px-2 py-1.5 rounded-md border text-xs cursor-pointer transition-colors ${getEventColor(e.source)} ${selectedEvent?.id === e.id ? 'ring-1 ring-[var(--accent-blue)]' : ''}`}
                            onClick={() => setSelectedEvent(selectedEvent?.id === e.id ? null : e)}
                          >
                            <div className="flex items-center gap-1.5">
                              <EventSourceIcon source={e.source} />
                              <span className="flex-1 truncate font-medium">{e.title}</span>
                              <button
                                type="button"
                                onClick={(ev) => { ev.stopPropagation(); deleteEvent(e.id); }}
                                disabled={!!deleting}
                                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:text-[var(--danger)]"
                              >
                                {deleting === e.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                              </button>
                            </div>
                            {(e.startTime || e.endTime) && (
                              <div className="flex items-center gap-1 pl-0.5 opacity-70">
                                <Clock className="h-2.5 w-2.5 shrink-0" />
                                <span className="text-[10px]">
                                  {e.startTime ? formatTime(e.startTime) : ''}
                                  {e.startTime && e.endTime ? ' – ' : ''}
                                  {e.endTime ? formatTime(e.endTime) : ''}
                                </span>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>

                      {/* Add task */}
                      <div className="shrink-0 px-2 pb-2">
                        <AnimatePresence>
                          {addingForDate === key ? (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex gap-1"
                            >
                              <Input
                                placeholder="Task name..."
                                value={newTitle[key] ?? ''}
                                onChange={(e) => setNewTitle((prev) => ({ ...prev, [key]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') addEvent(key);
                                  if (e.key === 'Escape') setAddingForDate(null);
                                }}
                                autoFocus
                                className="flex-1 h-7 text-xs bg-[var(--surface)] border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]"
                              />
                              <Button
                                size="sm"
                                className="h-7 w-7 p-0 bg-[var(--accent-blue)]"
                                onClick={() => addEvent(key)}
                                disabled={!!adding || !(newTitle[key] ?? '').trim()}
                              >
                                {adding === key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setAddingForDate(null)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </motion.div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAddingForDate(key)}
                              className="w-full flex items-center gap-1 px-2 py-1 rounded-md text-xs text-[var(--text-subtle)] hover:text-[var(--accent-blue)] hover:bg-[var(--accent-blue-soft)] transition-colors group"
                            >
                              <Plus className="h-3 w-3" />
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity">Add task</span>
                            </button>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile: stacked cards */}
              <div className="md:hidden space-y-3 overflow-y-auto h-full pb-4">
                {weekDays.map((d) => {
                  const key = formatDateKey(d);
                  const isToday = key === todayKey;
                  const dayEvents = eventsByDate[key] ?? [];
                  const dayName = DAY_NAMES[d.getDay() === 0 ? 6 : d.getDay() - 1];
                  return (
                    <div
                      key={key}
                      className={`rounded-xl border overflow-hidden ${
                        isToday
                          ? 'border-[var(--accent-blue)] ring-1 ring-[var(--accent-blue)]'
                          : 'border-[var(--border-soft)]'
                      }`}
                    >
                      <div className={`flex items-center justify-between px-4 py-3 border-b border-[var(--border-soft)] ${isToday ? 'bg-[var(--accent-blue)]' : 'bg-[var(--surface)]'}`}>
                        <div className="flex items-center gap-3">
                          <div>
                            <p className={`text-[10px] font-semibold uppercase tracking-widest ${isToday ? 'text-white/80' : 'text-[var(--text-subtle)]'}`}>{dayName}</p>
                            <p className={`text-xl font-bold leading-none mt-0.5 ${isToday ? 'text-white' : 'text-[var(--foreground)]'}`}>{d.getDate()}</p>
                          </div>
                          {isToday && <span className="text-xs font-semibold text-white/90 bg-white/20 px-2 py-0.5 rounded-full">Today</span>}
                        </div>
                        {dayEvents.length > 0 && (
                          <span className={`text-xs font-medium ${isToday ? 'text-white/80' : 'text-[var(--text-subtle)]'}`}>
                            {dayEvents.length} task{dayEvents.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      <div className="p-3 space-y-2 bg-[var(--surface-card)]">
                        {dayEvents.map((e) => (
                          <div
                            key={e.id}
                            onClick={() => setSelectedEvent(selectedEvent?.id === e.id ? null : e)}
                            className={`flex flex-col gap-1 px-3 py-2 rounded-lg border text-sm cursor-pointer ${getEventColor(e.source)} ${selectedEvent?.id === e.id ? 'ring-1 ring-[var(--accent-blue)]' : ''}`}
                          >
                            <div className="flex items-center gap-2">
                              <EventSourceIcon source={e.source} />
                              <span className="flex-1 truncate font-medium">{e.title}</span>
                              <button
                                type="button"
                                onClick={(ev) => { ev.stopPropagation(); deleteEvent(e.id); }}
                                disabled={!!deleting}
                                className="shrink-0 hover:text-[var(--danger)] transition-colors p-1"
                              >
                                {deleting === e.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                            {(e.startTime || e.endTime) && (
                              <div className="flex items-center gap-1 opacity-70 text-xs">
                                <Clock className="h-3 w-3 shrink-0" />
                                <span>
                                  {e.startTime ? formatTime(e.startTime) : ''}
                                  {e.startTime && e.endTime ? ' – ' : ''}
                                  {e.endTime ? formatTime(e.endTime) : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}

                        {addingForDate === key ? (
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add task..."
                              value={newTitle[key] ?? ''}
                              onChange={(e) => setNewTitle((prev) => ({ ...prev, [key]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') addEvent(key);
                                if (e.key === 'Escape') setAddingForDate(null);
                              }}
                              autoFocus
                              className="flex-1 h-9 text-sm bg-[var(--surface)] border-[var(--accent-blue)]"
                            />
                            <Button
                              size="sm"
                              className="h-9 w-9 p-0 bg-[var(--accent-blue)]"
                              onClick={() => addEvent(key)}
                              disabled={!!adding || !(newTitle[key] ?? '').trim()}
                            >
                              {adding === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-9 w-9 p-0" onClick={() => setAddingForDate(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAddingForDate(key)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-subtle)] hover:text-[var(--accent-blue)] hover:bg-[var(--accent-blue-soft)] transition-colors border border-dashed border-[var(--border-soft)]"
                          >
                            <Plus className="h-4 w-4" />
                            Add task
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ─── Month View ─── */}
          {view === 'month' && (
            <div className="rounded-xl border border-[var(--border-soft)] overflow-hidden bg-[var(--surface-card)] h-full flex flex-col">
              {/* Day name header */}
              <div className="shrink-0 grid grid-cols-7 border-b border-[var(--border-soft)] bg-[var(--surface)]">
                {DAY_NAMES.map((name) => (
                  <div key={name} className="py-3 text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider border-r border-[var(--border-soft)] last:border-r-0">
                    <span className="hidden sm:inline">{name}</span>
                    <span className="sm:hidden">{name.charAt(0)}</span>
                  </div>
                ))}
              </div>

              <div className="flex-1 grid grid-cols-7 auto-rows-fr">
                {monthGrid.map((d, i) => {
                  if (!d) {
                    return <div key={`pad-${i}`} className="border-r border-b border-[var(--border-soft)] bg-[var(--surface-subtle)]" />;
                  }
                  const key = formatDateKey(d);
                  const isToday = key === todayKey;
                  const dayEvents = eventsByDate[key] ?? [];
                  const isCurrentMonth = d.getMonth() === month;
                  return (
                    <div
                      key={key}
                      className={`border-r border-b border-[var(--border-soft)] p-1.5 flex flex-col cursor-pointer transition-colors group ${
                        isToday
                          ? 'bg-[var(--accent-blue-soft)]'
                          : isCurrentMonth
                            ? 'bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)]'
                            : 'bg-[var(--surface-subtle)]'
                      }`}
                      onClick={() => setAddingForDate(addingForDate === key ? null : key)}
                    >
                      {/* Date number */}
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday
                            ? 'bg-[var(--accent-blue)] text-white'
                            : isCurrentMonth
                              ? 'text-[var(--foreground)]'
                              : 'text-[var(--text-subtle)]'
                        }`}>
                          {d.getDate()}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="text-[10px] text-[var(--text-subtle)]">{dayEvents.length}</span>
                        )}
                      </div>

                      {/* Events */}
                      <div className="flex-1 space-y-0.5 overflow-hidden">
                        {dayEvents.slice(0, 3).map((e) => (
                          <div
                            key={e.id}
                            onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(selectedEvent?.id === e.id ? null : e); }}
                            className={`group/event flex flex-col gap-0.5 text-[10px] sm:text-xs leading-tight px-1.5 py-0.5 rounded border cursor-pointer ${getEventColor(e.source)} ${selectedEvent?.id === e.id ? 'ring-1 ring-[var(--accent-blue)]' : ''}`}
                          >
                            <div className="flex items-center gap-0.5">
                              <EventSourceIcon source={e.source} />
                              <span className="flex-1 truncate">{e.title}</span>
                              <button
                                type="button"
                                onClick={(ev) => { ev.stopPropagation(); deleteEvent(e.id); }}
                                disabled={!!deleting}
                                className="opacity-0 group-hover/event:opacity-100 transition-opacity text-[var(--danger)] shrink-0"
                              >
                                {deleting === e.id ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <X className="h-2.5 w-2.5" />}
                              </button>
                            </div>
                            {e.startTime && (
                              <div className="flex items-center gap-0.5 opacity-70">
                                <Clock className="h-2 w-2 shrink-0" />
                                <span className="text-[9px]">{formatTime(e.startTime)}</span>
                              </div>
                            )}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <p className="text-[10px] text-[var(--text-subtle)] pl-1">+{dayEvents.length - 3} more</p>
                        )}
                      </div>

                      {/* Inline add on click */}
                      <AnimatePresence>
                        {addingForDate === key && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex gap-0.5">
                              <Input
                                placeholder="Add task"
                                value={newTitle[key] ?? ''}
                                onChange={(e) => setNewTitle((prev) => ({ ...prev, [key]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') addEvent(key);
                                  if (e.key === 'Escape') setAddingForDate(null);
                                }}
                                autoFocus
                                className="flex-1 h-6 text-[10px] px-1.5 bg-[var(--surface)] border-[var(--accent-blue)]"
                              />
                              <Button
                                size="sm"
                                className="h-6 w-6 p-0 bg-[var(--accent-blue)]"
                                onClick={() => addEvent(key)}
                                disabled={!!adding || !(newTitle[key] ?? '').trim()}
                              >
                                {adding === key ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Plus className="h-2.5 w-2.5" />}
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 px-1">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-subtle)]">
              <div className="w-3 h-3 rounded bg-[var(--accent-blue-soft)] border border-[var(--accent-blue)]/30" />
              AI-generated
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-subtle)]">
              <div className="w-3 h-3 rounded bg-[var(--success-soft)] border border-[var(--success)]/30" />
              Capability path
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-subtle)]">
              <div className="w-3 h-3 rounded bg-[var(--surface-elevated)] border border-[var(--border-soft)]" />
              Personal task
            </div>
          </div>
        </div>
      )}

      {/* ─── Task Detail Panel ─── */}
      <AnimatePresence>
        {selectedEvent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-30"
              onClick={() => setSelectedEvent(null)}
            />
            <TaskDetailPanel
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
              onDelete={deleteEvent}
              onSave={updateEvent}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
