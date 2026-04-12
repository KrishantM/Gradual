'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Calendar, ChevronLeft, ChevronRight, Plus, Trash2, Loader2, GraduationCap } from 'lucide-react';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function formatDateKey(d: Date): string {
  // Use local date components, not toISOString() which converts to UTC and
  // shifts dates near midnight into the wrong day for users in non-UTC zones.
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
        <div className="flex items-center justify-between gap-4 page-header">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-[var(--accent-blue)]" />
            <h1 className="page-title">Planner</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="border-[var(--border)] text-[var(--text-muted)]"
            >
              Today
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('week')}
              className={view === 'week' ? 'bg-[var(--accent-blue)]' : 'border-[var(--border)] text-[var(--text-muted)]'}
            >
              Week
            </Button>
            <Button
              variant={view === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('month')}
              className={view === 'month' ? 'bg-[var(--accent-blue)]' : 'border-[var(--border)] text-[var(--text-muted)]'}
            >
              Month
            </Button>
          </div>
        </div>

        {view === 'week' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const d = new Date(weekStart);
                  d.setDate(d.getDate() - 7);
                  setWeekStart(d);
                }}
                className="border-[var(--border)] text-[var(--text-muted)]"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-[var(--foreground)] font-medium">
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
                className="border-[var(--border)] text-[var(--text-muted)]"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-blue)]" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((d) => {
                  const key = formatDateKey(d);
                  const isToday = key === todayKey;
                  const dayEvents = eventsByDate[key] ?? [];
                  return (
                    <Card key={key} className={`bg-[var(--surface-card)] border-[var(--border)] ${isToday ? 'ring-2 ring-[var(--accent-blue)]' : ''}`}>
                      <CardHeader className="py-2 px-3">
                        <CardTitle className={`text-sm ${isToday ? 'text-[var(--accent-blue)] font-bold' : 'text-[var(--text-muted)]'}`}>{DAY_NAMES[d.getDay() === 0 ? 6 : d.getDay() - 1]}</CardTitle>
                        <p className={`text-xs ${isToday ? 'text-[var(--accent-blue)]' : 'text-[var(--text-muted)] opacity-60'}`}>{d.getDate()}</p>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 space-y-2">
                        {dayEvents.map((e) => (
                          <div
                            key={e.id}
                            className="flex items-start justify-between gap-1 p-2 rounded bg-[var(--surface-elevated)] text-[var(--foreground)] text-sm"
                          >
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              {e.source === 'copilot' && (
                                <span className="inline-flex items-center gap-0.5 shrink-0 text-[var(--accent-blue)]" title="AI-generated">
                                  <Brain className="h-3 w-3" />
                                </span>
                              )}
                              {e.source === 'path' && (
                                <span className="inline-flex items-center gap-0.5 shrink-0 text-[var(--accent-blue)]" title="From a capability path">
                                  <GraduationCap className="h-3 w-3" />
                                </span>
                              )}
                              <span className="truncate">{e.title}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteEvent(e.id)}
                              disabled={!!deleting}
                              className="text-red-500 hover:text-red-400 shrink-0"
                            >
                              {deleting === e.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                            </button>
                          </div>
                        ))}
                        <div className="flex gap-1">
                          <Input
                            placeholder="Add task..."
                            value={newTitle[key] ?? ''}
                            onChange={(e) => setNewTitle((prev) => ({ ...prev, [key]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && addEvent(key)}
                            className="flex-1 h-8 text-xs bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--text-muted)]"
                          />
                          <Button
                            size="sm"
                            className="h-8 w-8 p-0 bg-[var(--accent-blue)]"
                            onClick={() => addEvent(key)}
                            disabled={!!adding || !(newTitle[key] ?? '').trim()}
                          >
                            {adding === key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {view === 'month' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMonthDate(new Date(monthYear, month - 1))}
                className="border-[var(--border)] text-[var(--text-muted)]"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-[var(--foreground)] font-medium">
                {monthDate.toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMonthDate(new Date(monthYear, month + 1))}
                className="border-[var(--border)] text-[var(--text-muted)]"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-blue)]" />
              </div>
            ) : (
              <Card className="bg-[var(--surface-card)] border-[var(--border)] overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid grid-cols-7 border-b border-[var(--border)]">
                    {DAY_NAMES.map((name) => (
                      <div key={name} className="py-2 text-center text-sm font-medium text-[var(--text-muted)] border-r border-[var(--border)] last:border-r-0">
                        {name}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 auto-rows-fr" style={{ minHeight: 400 }}>
                    {monthGrid.map((d, i) => {
                      if (!d) {
                        return <div key={`pad-${i}`} className="border-r border-b border-[var(--border)] bg-[var(--surface)] min-h-[80px]" />;
                      }
                      const key = formatDateKey(d);
                      const isToday = key === todayKey;
                      const dayEvents = eventsByDate[key] ?? [];
                      const isCurrentMonth = d.getMonth() === month;
                      return (
                        <div
                          key={key}
                          className={`border-r border-b border-[var(--border)] min-h-[80px] p-2 flex flex-col bg-[var(--surface-card)] ${isToday ? 'ring-2 ring-inset ring-[var(--accent-blue)]' : ''}`}
                        >
                          <p className={`text-xs font-medium ${isToday ? 'text-[var(--accent-blue)] font-bold' : isCurrentMonth ? 'text-[var(--foreground)]' : 'text-[var(--text-muted)] opacity-40'}`}>{d.getDate()}</p>
                          <div className="flex-1 space-y-1 overflow-auto">
                            {dayEvents.slice(0, 3).map((e) => (
                              <div key={e.id} className="flex items-center gap-1 text-xs text-[var(--foreground)]">
                                {e.source === 'copilot' && <Brain className="h-2.5 w-2.5 text-[var(--accent-blue)] shrink-0" />}
                                {e.source === 'path' && <GraduationCap className="h-2.5 w-2.5 text-[var(--accent-blue)] shrink-0" />}
                                <span className="flex-1 min-w-0 truncate">{e.title}</span>
                                <button
                                  type="button"
                                  onClick={() => deleteEvent(e.id)}
                                  disabled={!!deleting}
                                  className="text-red-500 hover:text-red-400 shrink-0"
                                >
                                  {deleting === e.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                </button>
                              </div>
                            ))}
                            {dayEvents.length > 3 && <p className="text-xs text-[var(--text-muted)]">+{dayEvents.length - 3} more</p>}
                          </div>
                          <div className="flex gap-1 mt-1">
                            <Input
                              placeholder="Add"
                              value={newTitle[key] ?? ''}
                              onChange={(e) => setNewTitle((prev) => ({ ...prev, [key]: e.target.value }))}
                              onKeyDown={(e) => e.key === 'Enter' && addEvent(key)}
                              className="flex-1 h-6 text-xs bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--text-muted)]"
                            />
                            <Button
                              size="sm"
                              className="h-6 w-6 p-0 bg-[var(--accent-blue)] shrink-0"
                              onClick={() => addEvent(key)}
                              disabled={!!adding || !(newTitle[key] ?? '').trim()}
                            >
                              {adding === key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
