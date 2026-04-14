'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Calendar, ChevronLeft, ChevronRight, Plus, Trash2, Loader2, GraduationCap } from 'lucide-react';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_NAMES_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

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

interface PlannerEvent {
  id: string;
  date: string;
  title: string;
  notes?: string;
  source?: string;
  createdAt: string | null;
}

export default function PlannerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<'week' | 'month'>('week');
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<string | null>(null);

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
  }, [user, view, weekStart, monthDate, fetchEvents, router]);

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
      setEvents((prev) => [...prev, { id: data.id, date, title, notes: data.notes, source: 'user', createdAt: null }]);
      setNewTitle((prev) => ({ ...prev, [date]: '' }));
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
    } catch {
      // ignore
    } finally {
      setDeleting(null);
    }
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
    <div className="min-h-screen">
      <div className="page-container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 page-header">
          <div className="flex items-center gap-2.5">
            <Calendar className="h-5 w-5 text-[var(--accent-blue)]" />
            <h1 className="page-title">Planner</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="text-xs border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-subtle)]"
            >
              Today
            </Button>
            <div className="tab-nav !p-0.5 !gap-0.5">
              <button
                onClick={() => setView('week')}
                className={`tab-nav-item !py-1.5 !px-3 !text-xs ${view === 'week' ? 'active' : ''}`}
              >
                Week
              </button>
              <button
                onClick={() => setView('month')}
                className={`tab-nav-item !py-1.5 !px-3 !text-xs ${view === 'month' ? 'active' : ''}`}
              >
                Month
              </button>
            </div>
          </div>
        </div>

        {/* Week View */}
        {view === 'week' && (
          <>
            {/* Week Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const d = new Date(weekStart);
                  d.setDate(d.getDate() - 7);
                  setWeekStart(d);
                }}
                className="border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-subtle)] h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-[var(--foreground)]">
                {weekDays[0].toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })} –{' '}
                {weekDays[6].toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const d = new Date(weekStart);
                  d.setDate(d.getDate() + 7);
                  setWeekStart(d);
                }}
                className="border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-subtle)] h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-blue)]" />
              </div>
            ) : (
              <>
                {/* Desktop: 7-column grid */}
                <div className="hidden md:grid grid-cols-7 gap-2">
                  {weekDays.map((d) => {
                    const key = formatDateKey(d);
                    const isToday = key === todayKey;
                    const dayEvents = eventsByDate[key] ?? [];
                    return (
                      <div
                        key={key}
                        className={`rounded-xl border bg-[var(--surface-card)] flex flex-col min-h-[180px] transition-shadow duration-200 ${
                          isToday
                            ? 'border-[var(--accent-blue)] ring-1 ring-[var(--accent-blue)] shadow-md'
                            : 'border-[var(--border-soft)] hover:shadow-sm'
                        }`}
                      >
                        {/* Day Header */}
                        <div className={`px-3 py-2 border-b ${isToday ? 'border-[var(--accent-blue)]/20 bg-[var(--accent-blue-soft)]' : 'border-[var(--border-soft)]'}`}>
                          <div className={`text-xs font-semibold ${isToday ? 'text-[var(--accent-blue)]' : 'text-[var(--text-muted)]'}`}>
                            {DAY_NAMES[d.getDay() === 0 ? 6 : d.getDay() - 1]}
                          </div>
                          <div className={`text-lg font-bold leading-tight ${isToday ? 'text-[var(--accent-blue)]' : 'text-[var(--foreground)]'}`}>
                            {d.getDate()}
                          </div>
                        </div>

                        {/* Events */}
                        <div className="flex-1 px-2.5 py-2 space-y-1.5 overflow-y-auto">
                          {dayEvents.map((e) => (
                            <div
                              key={e.id}
                              className="group flex items-start justify-between gap-1 p-1.5 rounded-md bg-[var(--surface-elevated)] text-xs transition-colors hover:bg-[var(--surface-subtle)]"
                            >
                              <div className="flex items-center gap-1 flex-1 min-w-0">
                                {e.source === 'copilot' && (
                                  <span title="AI-generated" className="inline-flex shrink-0">
                                    <Brain className="h-3 w-3 text-[var(--accent-blue)]" />
                                  </span>
                                )}
                                {e.source === 'path' && (
                                  <span title="From capability path" className="inline-flex shrink-0">
                                    <GraduationCap className="h-3 w-3 text-[var(--accent-blue)]" />
                                  </span>
                                )}
                                <span className="truncate text-[var(--foreground)]">{e.title}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => deleteEvent(e.id)}
                                disabled={!!deleting}
                                className="text-[var(--danger)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              >
                                {deleting === e.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add Task */}
                        <div className="px-2.5 pb-2.5 pt-1">
                          <div className="flex gap-1">
                            <Input
                              placeholder="Add task..."
                              value={newTitle[key] ?? ''}
                              onChange={(e) => setNewTitle((prev) => ({ ...prev, [key]: e.target.value }))}
                              onKeyDown={(e) => e.key === 'Enter' && addEvent(key)}
                              className="flex-1 h-7 text-xs bg-[var(--surface-elevated)] border-[var(--border-soft)] text-[var(--foreground)] placeholder:text-[var(--text-subtle)] focus:border-[var(--accent-blue)]"
                            />
                            <Button
                              size="sm"
                              className="h-7 w-7 p-0 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-strong)] shrink-0"
                              onClick={() => addEvent(key)}
                              disabled={!!adding || !(newTitle[key] ?? '').trim()}
                            >
                              {adding === key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile: stacked list */}
                <div className="md:hidden space-y-3">
                  {weekDays.map((d) => {
                    const key = formatDateKey(d);
                    const isToday = key === todayKey;
                    const dayEvents = eventsByDate[key] ?? [];
                    return (
                      <div
                        key={key}
                        className={`rounded-xl border bg-[var(--surface-card)] overflow-hidden transition-shadow duration-200 ${
                          isToday
                            ? 'border-[var(--accent-blue)] ring-1 ring-[var(--accent-blue)]'
                            : 'border-[var(--border-soft)]'
                        }`}
                      >
                        {/* Day Header */}
                        <div className={`flex items-center justify-between px-4 py-2.5 border-b ${
                          isToday ? 'border-[var(--accent-blue)]/20 bg-[var(--accent-blue-soft)]' : 'border-[var(--border-soft)]'
                        }`}>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${isToday ? 'text-[var(--accent-blue)]' : 'text-[var(--text-muted)]'}`}>
                              {DAY_NAMES[d.getDay() === 0 ? 6 : d.getDay() - 1]}
                            </span>
                            <span className={`text-sm font-bold ${isToday ? 'text-[var(--accent-blue)]' : 'text-[var(--foreground)]'}`}>
                              {d.getDate()}
                            </span>
                            {isToday && (
                              <span className="badge badge-blue !text-[0.625rem]">Today</span>
                            )}
                          </div>
                          <span className="text-xs text-[var(--text-subtle)]">
                            {dayEvents.length > 0 ? `${dayEvents.length} task${dayEvents.length > 1 ? 's' : ''}` : ''}
                          </span>
                        </div>

                        {/* Events + Add */}
                        <div className="p-3 space-y-2">
                          {dayEvents.map((e) => (
                            <div
                              key={e.id}
                              className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[var(--surface-elevated)] text-sm"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {e.source === 'copilot' && (
                                  <Brain className="h-3.5 w-3.5 text-[var(--accent-blue)] shrink-0" />
                                )}
                                {e.source === 'path' && (
                                  <GraduationCap className="h-3.5 w-3.5 text-[var(--accent-blue)] shrink-0" />
                                )}
                                <span className="truncate text-[var(--foreground)]">{e.title}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => deleteEvent(e.id)}
                                disabled={!!deleting}
                                className="text-[var(--danger)] shrink-0 p-1"
                              >
                                {deleting === e.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          ))}

                          <div className="flex gap-2">
                            <Input
                              placeholder="Add task..."
                              value={newTitle[key] ?? ''}
                              onChange={(e) => setNewTitle((prev) => ({ ...prev, [key]: e.target.value }))}
                              onKeyDown={(e) => e.key === 'Enter' && addEvent(key)}
                              className="flex-1 h-9 text-sm bg-[var(--surface-elevated)] border-[var(--border-soft)] text-[var(--foreground)] placeholder:text-[var(--text-subtle)] focus:border-[var(--accent-blue)]"
                            />
                            <Button
                              size="sm"
                              className="h-9 w-9 p-0 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-strong)] shrink-0"
                              onClick={() => addEvent(key)}
                              disabled={!!adding || !(newTitle[key] ?? '').trim()}
                            >
                              {adding === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* Month View */}
        {view === 'month' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMonthDate(new Date(monthYear, month - 1))}
                className="border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-subtle)] h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-[var(--foreground)]">
                {monthDate.toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMonthDate(new Date(monthYear, month + 1))}
                className="border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-subtle)] h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-blue)]" />
              </div>
            ) : (
              <div className="surface-card overflow-hidden">
                {/* Day name header */}
                <div className="grid grid-cols-7 border-b border-[var(--border-soft)]">
                  {DAY_NAMES.map((name, i) => (
                    <div key={name} className="py-2.5 text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider border-r border-[var(--border-soft)] last:border-r-0">
                      <span className="hidden sm:inline">{name}</span>
                      <span className="sm:hidden">{DAY_NAMES_SHORT[i]}</span>
                    </div>
                  ))}
                </div>

                {/* Month grid */}
                <div className="grid grid-cols-7 auto-rows-fr" style={{ minHeight: 420 }}>
                  {monthGrid.map((d, i) => {
                    if (!d) {
                      return <div key={`pad-${i}`} className="border-r border-b border-[var(--border-soft)] bg-[var(--surface-subtle)] min-h-[80px]" />;
                    }
                    const key = formatDateKey(d);
                    const isToday = key === todayKey;
                    const dayEvents = eventsByDate[key] ?? [];
                    const isCurrentMonth = d.getMonth() === month;
                    return (
                      <div
                        key={key}
                        className={`border-r border-b border-[var(--border-soft)] min-h-[80px] p-1.5 sm:p-2 flex flex-col transition-colors ${
                          isToday
                            ? 'bg-[var(--accent-blue-soft)] ring-1 ring-inset ring-[var(--accent-blue)]'
                            : 'bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)]'
                        }`}
                      >
                        <p className={`text-xs font-medium mb-1 ${
                          isToday
                            ? 'text-[var(--accent-blue)] font-bold'
                            : isCurrentMonth
                              ? 'text-[var(--foreground)]'
                              : 'text-[var(--text-subtle)]'
                        }`}>
                          {d.getDate()}
                        </p>
                        <div className="flex-1 space-y-0.5 overflow-auto">
                          {dayEvents.slice(0, 3).map((e) => (
                            <div key={e.id} className="group flex items-center gap-0.5 text-[0.625rem] sm:text-xs text-[var(--foreground)] leading-tight">
                              {e.source === 'copilot' && <Brain className="h-2.5 w-2.5 text-[var(--accent-blue)] shrink-0" />}
                              {e.source === 'path' && <GraduationCap className="h-2.5 w-2.5 text-[var(--accent-blue)] shrink-0" />}
                              <span className="flex-1 min-w-0 truncate">{e.title}</span>
                              <button
                                type="button"
                                onClick={() => deleteEvent(e.id)}
                                disabled={!!deleting}
                                className="text-[var(--danger)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              >
                                {deleting === e.id ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Trash2 className="h-2.5 w-2.5" />}
                              </button>
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <p className="text-[0.625rem] text-[var(--text-subtle)]">+{dayEvents.length - 3} more</p>
                          )}
                        </div>

                        {/* Inline add — hidden on small screens, visible on hover on larger */}
                        <div className="hidden sm:flex gap-0.5 mt-1 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <Input
                            placeholder="Add"
                            value={newTitle[key] ?? ''}
                            onChange={(e) => setNewTitle((prev) => ({ ...prev, [key]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && addEvent(key)}
                            className="flex-1 h-5 text-[0.625rem] bg-[var(--surface-elevated)] border-[var(--border-soft)] text-[var(--foreground)] placeholder:text-[var(--text-subtle)] px-1"
                          />
                          <Button
                            size="sm"
                            className="h-5 w-5 p-0 bg-[var(--accent-blue)] shrink-0"
                            onClick={() => addEvent(key)}
                            disabled={!!adding || !(newTitle[key] ?? '').trim()}
                          >
                            {adding === key ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Plus className="h-2.5 w-2.5" />}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
