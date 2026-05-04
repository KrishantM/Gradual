'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { createAuthFetcher, SWR_AUTH_CONFIG } from '@/lib/swr-fetcher';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '../../../lib/firebase';
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { UserRoleService } from '@/lib/user-role';
import Link from 'next/link';
import ToDoList from '@/components/ToDoList';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Brain,
  CheckCircle,
  TrendingUp,
  Calendar,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  Briefcase,
  MapPin,
  Star,
  ExternalLink,
  BarChart3,
  Trash2,
  Target,
  FileText,
  ArrowRight,
  AlertTriangle,
  Zap,
  ClipboardList,
  GraduationCap,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Interfaces ─── */

interface SavedOpportunity {
  id: string;
  title: string;
  description: string;
  location: string;
  company: string;
  url: string;
  type: 'internship' | 'job';
  category: string;
  created: string;
  salary_min?: number;
  salary_max?: number;
  source: string;
  score: number;
}

interface PinnedSuggestion {
  id: string;
  title: string;
  notes?: string;
  priority: string;
  pinnedAt: string;
}

interface Signal {
  key: string;
  level: 'HIGH' | 'MEDIUM' | 'OK';
  message: string;
}

interface ActivePathSummary {
  pathId: string;
  pathTitle: string;
  outcome: string;
  progressPercent: number;
  completedCount: number;
  totalCount: number;
  currentModule: { id: string; title: string; estimatedMinutes: number } | null;
}

interface RatingComponent {
  key: string;
  label: string;
  value: number;
  weight: number;
  rationale: string;
}

interface IntelligenceData {
  signals: Signal[];
  profileCompletion: number;
  cvScore: number | null;
  gradualRating: { total: number; components: RatingComponent[] };
  latestCopilot: {
    weeklyPlan: Record<string, { title: string; notes?: string }[]> | null;
    priorities: { title: string; rationale: string }[];
    createdAt: string | null;
  } | null;
  todayPlannerEvents: { id: string; date: string; title: string; notes?: string; source: string }[];
  opportunityMomentum: { savedCount: number; recentApplications: number };
  activePath: ActivePathSummary | null;
}

/* ─── Helpers ─── */

// Local-tz YYYY-MM-DD for Today's-Plan filter. Avoids the toISOString() UTC
// shift that would put midnight events on the wrong day for non-UTC users.
function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function extractOverallScore(scoreText: string | number | null): string | null {
  if (!scoreText) return null;
  if (typeof scoreText === 'number') return scoreText.toString();
  if (typeof scoreText === 'string') {
    if (!scoreText || scoreText.trim() === '') return null;
    const match = scoreText.match(/Overall Score \(0–100\):\s*(\d+)/);
    return match ? match[1] : scoreText;
  }
  return null;
}

type DateLike = Date | string | { toDate: () => Date } | null | undefined;

function formatDate(date: DateLike): string {
  if (!date) return '';
  let resolved: Date;
  if (typeof date === 'string') {
    resolved = new Date(date);
  } else if (typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
    resolved = date.toDate();
  } else if (date instanceof Date) {
    resolved = date;
  } else {
    return '';
  }
  return Number.isNaN(resolved.getTime()) ? '' : resolved.toLocaleDateString();
}

function formatOpportunityDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Today';
  if (diffDays <= 7) return `${diffDays} days ago`;
  if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

function getScoreLevel(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

function getSignalCTA(signal: Signal): { href: string; label: string } {
  switch (signal.key) {
    case 'cv': return { href: '/cvscore', label: 'Improve CV' };
    case 'profile': return { href: '/profile', label: 'Complete Profile' };
    case 'applications': return { href: '/suggestions', label: 'Find Opportunities' };
    case 'todos': return { href: '/copilot', label: 'Get Guidance' };
    default: return { href: '/copilot', label: 'Take Action' };
  }
}

/* ─── CV Score Display ─── */

const CVScoreDisplay = ({ score, analysis }: { score: string | number | null, analysis: string | null }) => {
  const [showDetails, setShowDetails] = useState(false);

  const parseScore = (scoreText: string | number | null) => {
    if (!scoreText) return { overall: null, sections: [] };
    const text = typeof scoreText === 'number' ? scoreText.toString() : scoreText;

    let overall = null;
    const overallMatch1 = text.match(/Overall Score \(0–100\):\s*(\d+)/);
    if (overallMatch1) overall = parseInt(overallMatch1[1]);
    if (!overall && typeof scoreText === 'number') overall = scoreText;
    if (!overall) {
      const numberMatch = text.match(/(\d+)/);
      if (numberMatch) {
        const num = parseInt(numberMatch[1]);
        if (num >= 0 && num <= 100) overall = num;
      }
    }

    const sections: Array<{name: string, score: number}> = [];
    const categoryPatterns = [
      { name: 'Content Quality', pattern: /1\. Content Quality:\s*(\d+)/ },
      { name: 'Structure & Format', pattern: /2\. Structure & Format:\s*(\d+)/ },
      { name: 'Professional Language', pattern: /3\. Professional Language:\s*(\d+)/ },
      { name: 'Achievements & Impact', pattern: /4\. Achievements & Impact:\s*(\d+)/ }
    ];
    categoryPatterns.forEach(category => {
      const match = text.match(category.pattern);
      if (match) sections.push({ name: category.name, score: parseInt(match[1]) });
    });

    return { overall, sections };
  };

  const getCategoryFeedback = (analysisText: string | null, categoryName: string) => {
    if (!analysisText) return '';
    const lines = analysisText.split('\n');
    let inCategory = false;
    let feedback = '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes(categoryName)) { inCategory = true; continue; }
      if (inCategory && line && !line.match(/^\d+\./)) feedback += line + ' ';
      else if (inCategory && line.match(/^\d+\./)) break;
    }
    return feedback.trim();
  };

  const { overall, sections } = parseScore(score);
  const areasToImprove = analysis?.split('5. Areas to improve:')[1]?.trim() || '';

  if (!overall) {
    return (
      <div className="surface-card-subtle rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-5xl font-extrabold text-[var(--accent-blue)]">
              {typeof score === 'number' ? score : '—'}
            </span>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Overall Score</p>
              <p className="text-xs text-[var(--text-subtle)]">out of 100</p>
            </div>
          </div>
          {analysis && (
            <Button variant="outline" size="sm" onClick={() => setShowDetails(v => !v)}>
              {showDetails ? <><ChevronUp className="h-4 w-4 mr-1.5" /> Hide</> : <><ChevronDown className="h-4 w-4 mr-1.5" /> Details</>}
            </Button>
          )}
        </div>
        {showDetails && analysis && (
          <div className="mt-4 rounded-lg border p-4 bg-[var(--surface)]">
            <p className="text-sm text-[var(--text-muted)] whitespace-pre-line leading-relaxed">{analysis}</p>
          </div>
        )}
      </div>
    );
  }

  const level = getScoreLevel(overall);

  return (
    <div className="space-y-4">
      <div className={`score-bg-${level} rounded-lg border p-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className={`text-5xl font-extrabold score-${level}`}>{overall}</span>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Overall Score</p>
              <p className="text-xs text-[var(--text-subtle)]">out of 100</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowDetails(v => !v)}>
            {showDetails ? <><ChevronUp className="h-4 w-4 mr-1.5" /> Hide</> : <><ChevronDown className="h-4 w-4 mr-1.5" /> Details</>}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {areasToImprove && (
              <div className="score-bg-good rounded-lg border p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-5 w-5 score-good" />
                  <h4 className="font-semibold">Areas to Improve</h4>
                </div>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{areasToImprove}</p>
              </div>
            )}

            {sections.length > 0 && (
              <div className="surface-card rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="h-5 w-5 text-[var(--accent-blue)]" />
                  <h4 className="font-semibold">Scoring Breakdown</h4>
                </div>
                <div className="space-y-3">
                  {sections.map((section) => {
                    const sLevel = getScoreLevel(section.score);
                    const feedback = getCategoryFeedback(analysis, section.name);
                    return (
                      <div key={section.name} className="surface-card-subtle rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{section.name}</span>
                          <span className={`text-lg font-bold score-${sLevel}`}>{section.score}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--border-soft)] overflow-hidden">
                          <div className={`h-full rounded-full bg-[var(--${sLevel === 'excellent' ? 'success' : sLevel === 'good' ? 'accent-blue' : sLevel === 'fair' ? 'warning' : 'danger'})]`} style={{ width: `${(section.score / 25) * 100}%` }} />
                        </div>
                        {feedback && <p className="text-xs text-[var(--text-muted)] mt-1.5">{feedback}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Opportunity Card ─── */

const OpportunityCard = ({ opportunity, onUnstar, unstarring }: {
  opportunity: SavedOpportunity;
  onUnstar: (id: string) => void;
  unstarring: boolean;
}) => (
  <div className="surface-card hover-lift rounded-lg p-4 transition-all duration-200">
    <div className="flex items-start justify-between mb-2">
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm line-clamp-2 mb-1">{opportunity.title}</h3>
        <p className="text-sm text-[var(--text-muted)]">{opportunity.company}</p>
      </div>
      <button
        onClick={() => onUnstar(opportunity.id)}
        disabled={unstarring}
        className="p-1.5 rounded-full text-[var(--warning)] bg-[var(--warning-soft)] hover:opacity-80 transition-all ml-2 shrink-0"
      >
        {unstarring ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Star className="h-3.5 w-3.5 fill-current" />
        )}
      </button>
    </div>

    <div className="flex flex-wrap items-center text-xs text-[var(--text-subtle)] mb-2 gap-3">
      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{opportunity.location}</span>
      <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{formatOpportunityDate(opportunity.created)}</span>
      <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" />{opportunity.type}</span>
    </div>

    <p className="text-xs text-[var(--text-muted)] mb-3 line-clamp-2">{opportunity.description}</p>

    <div className="flex items-center justify-between">
      <span className="badge badge-blue">{opportunity.category}</span>
      <a
        href={opportunity.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-[var(--accent-blue)] hover:underline text-xs font-medium"
      >
        Apply <ExternalLink className="h-3 w-3 ml-1" />
      </a>
    </div>
  </div>
);

/* ─── Signal Banner ─── */

const SignalBanner = ({ signal }: { signal: Signal }) => {
  const cta = getSignalCTA(signal);
  const isHigh = signal.level === 'HIGH';

  return (
    <div className={`rounded-xl border p-4 flex items-center justify-between gap-4 ${
      isHigh
        ? 'bg-[var(--danger-soft)] border-[var(--danger)]/20'
        : 'bg-[var(--warning-soft)] border-[var(--warning)]/20'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`rounded-lg p-2 shrink-0 ${isHigh ? 'bg-[var(--danger)]/10' : 'bg-[var(--warning)]/10'}`}>
          <AlertTriangle className={`h-4 w-4 ${isHigh ? 'text-[var(--danger)]' : 'text-[var(--warning)]'}`} />
        </div>
        <p className="text-sm font-medium truncate">{signal.message}</p>
      </div>
      <Link href={cta.href}>
        <Button size="sm" variant="outline" className="shrink-0 text-xs">
          {cta.label} <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </Link>
    </div>
  );
};

/* ─── Metric Card ─── */

const MetricCard = ({ icon: Icon, label, value, sublabel, href }: {
  icon: any; label: string; value: string | number; sublabel?: string; href?: string;
}) => {
  const content = (
    <Card className={href ? 'hover-lift cursor-pointer' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[var(--accent-blue-soft)] p-2.5 shrink-0">
            <Icon className="h-5 w-5 text-[var(--accent-blue)]" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-[var(--text-muted)]">{label}</p>
            {sublabel && <p className="text-xs text-[var(--text-subtle)]">{sublabel}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
};

/* ─── Main Dashboard ─── */

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [cvScore, setCvScore] = useState<string | number | null>(null);
  const [cvScoreTimestamp, setCvScoreTimestamp] = useState<DateLike>(null);
  const [cvScoreAnalysis, setCvScoreAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedOpportunities, setSavedOpportunities] = useState<SavedOpportunity[]>([]);
  const [opportunitiesLoading, setOpportunitiesLoading] = useState(false);
  const [unstarringLoading, setUnstarringLoading] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [clearingScore, setClearingScore] = useState(false);
  const [pinnedSuggestions, setPinnedSuggestions] = useState<PinnedSuggestion[]>([]);
  const [unpinning, setUnpinning] = useState<string | null>(null);

  // Intelligence — SWR cache shared with Copilot sidebar (same key).
  // Memoise the date key so re-renders don't flap the SWR cache.
  const todayKey = useMemo(() => localDateKey(), []);
  const intelligenceFetcher = useMemo(() => (user ? createAuthFetcher(user) : null), [user]);
  const { data: intelligence } = useSWR<IntelligenceData>(
    user ? `/api/dashboard/intelligence?date=${todayKey}` : null,
    intelligenceFetcher,
    SWR_AUTH_CONFIG
  );

  const unpinSuggestion = async (suggestionId: string) => {
    if (!user) return;
    setUnpinning(suggestionId);
    try {
      const userRef = doc(db, 'users', user.uid);
      const updated = pinnedSuggestions.filter(s => s.id !== suggestionId);
      await updateDoc(userRef, { pinnedSuggestions: updated });
      setPinnedSuggestions(updated);
    } catch (error) {
      console.error('Error unpinning suggestion:', error);
    } finally {
      setUnpinning(null);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const checkUserRole = async () => {
      try {
        const userRole = await UserRoleService.getUserRole(user);
        if (userRole.role === 'recruiter') {
          router.push('/recruiter-dashboard');
          return;
        }
        await fetchData();
      } catch (error) {
        console.error('Error checking user role:', error);
        await fetchData();
      }
    };

    const fetchData = async () => {
      try {
        setHasError(false);

        // Fetch Firestore user data (intelligence loads via SWR above)
        const userSnap = await getDoc(doc(db, 'users', user.uid));

        // Process user doc
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setName(userData.fullName || '');

          const rawCvScore = userData.cvScore;
          if (rawCvScore !== null && rawCvScore !== undefined) setCvScore(rawCvScore);
          else setCvScore(null);

          const rawCvScoreTimestamp = userData.cvScoreTimestamp;
          if (rawCvScoreTimestamp && (rawCvScoreTimestamp.toDate || rawCvScoreTimestamp instanceof Date)) setCvScoreTimestamp(rawCvScoreTimestamp);
          else setCvScoreTimestamp(null);

          const rawCvScoreAnalysis = userData.cvScoreAnalysis || userData.cvText;
          if (rawCvScoreAnalysis && typeof rawCvScoreAnalysis === 'string') setCvScoreAnalysis(rawCvScoreAnalysis);
          else setCvScoreAnalysis(null);

          // Read saved opportunities directly from the user doc — no second Firestore read needed
          const savedIds: string[] = userData.savedOpportunities || [];
          const savedOppsData: SavedOpportunity[] = userData.savedOpportunitiesData || [];
          const validOpps = savedOppsData.filter((opp) => savedIds.includes(opp.id));
          setSavedOpportunities(validOpps);
          setOpportunitiesLoading(false);

          // Load pinned suggestions
          const pinned: PinnedSuggestion[] = userData.pinnedSuggestions || [];
          setPinnedSuggestions(pinned);
        }

      } catch (err) {
        console.error('Error loading dashboard:', err);
        setHasError(true);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [authLoading, user, router]);

  const clearCVScore = async () => {
    if (!user) return;
    setClearingScore(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        cvScore: null, cvScoreTimestamp: null, cvScoreAnalysis: null,
        cvScoreBreakdown: null, cvText: null, uploadedCVName: null
      });
      setCvScore(null);
      setCvScoreTimestamp(null);
      setCvScoreAnalysis(null);
    } catch (error) {
      console.error('Error clearing CV score:', error);
    } finally {
      setClearingScore(false);
    }
  };

  const unstarOpportunity = async (opportunityId: string) => {
    if (!user) return;
    setUnstarringLoading(opportunityId);
    try {
      const userRef = doc(db, 'users', user.uid);
      const opportunityToRemove = savedOpportunities.find(opp => opp.id === opportunityId);
      await updateDoc(userRef, {
        savedOpportunities: arrayRemove(opportunityId),
        savedOpportunitiesData: opportunityToRemove ? arrayRemove(opportunityToRemove) : []
      });
      setSavedOpportunities(prev => prev.filter(opp => opp.id !== opportunityId));
    } catch (error) {
      console.error('Error unstarring opportunity:', error);
    } finally {
      setUnstarringLoading(null);
    }
  };

  // Derived values from intelligence
  const topSignal = intelligence?.signals?.find(s => s.level === 'HIGH') ?? intelligence?.signals?.find(s => s.level === 'MEDIUM') ?? null;
  const allOk = intelligence?.signals?.every(s => s.level === 'OK') ?? false;
  const profileCompletion = intelligence?.profileCompletion ?? 0;
  const momentum = intelligence?.opportunityMomentum ?? { savedCount: 0, recentApplications: 0 };
  const todayEvents = intelligence?.todayPlannerEvents ?? [];
  const weeklyPlan = intelligence?.latestCopilot?.weeklyPlan ?? null;
  const priorities = intelligence?.latestCopilot?.priorities ?? [];

  // Plan staleness — copilot plans older than 7 days should prompt a regenerate
  // rather than display as the current focus. createdAt is ISO from the API.
  const activePath = intelligence?.activePath ?? null;
  const planCreatedAt = intelligence?.latestCopilot?.createdAt ?? null;
  const planAgeDays = planCreatedAt
    ? Math.floor((Date.now() - new Date(planCreatedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const planIsStale = planAgeDays !== null && planAgeDays > 7;

  // Flatten weekly plan for display (only when fresh)
  const weekDays = weeklyPlan && !planIsStale ? Object.entries(weeklyPlan).slice(0, 5) : [];

  // ─── Loading state ───
  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 text-[var(--accent-blue)] mx-auto mb-3 animate-spin" />
        <p className="text-sm text-[var(--text-muted)]">Loading your dashboard...</p>
      </div>
    </div>
  );

  // ─── Error state ───
  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="rounded-full bg-[var(--danger-soft)] p-3 w-fit mx-auto mb-4">
            <Target className="h-6 w-6 text-[var(--danger)]" />
          </div>
          <p className="text-[var(--text-muted)] mb-4">Failed to load your dashboard.</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Refresh Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="page-container">
        {/* ─── Header ─── */}
        <motion.div
          className="page-header"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="page-title">
            Welcome back{name ? `, ${name}` : ''}
          </h1>
          <p className="page-subtitle">
            Here&apos;s what matters today
          </p>
        </motion.div>

        {/* ─── Priority Signal Banner ─── */}
        <motion.div
          className="section-gap"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          {topSignal ? (
            <SignalBanner signal={topSignal} />
          ) : allOk && intelligence ? (
            <div className="rounded-xl border border-[var(--success)]/20 bg-[var(--success-soft)] p-4 flex items-center gap-3">
              <div className="rounded-lg bg-[var(--success)]/10 p-2">
                <CheckCircle className="h-4 w-4 text-[var(--success)]" />
              </div>
              <p className="text-sm font-medium">You&apos;re on track. All career signals look good.</p>
            </div>
          ) : null}
        </motion.div>

        {/* ─── Three Metric Cards ─── */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 section-gap"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <MetricCard
            icon={Target}
            label="Gradual Rating"
            value={`${intelligence?.gradualRating?.total ?? 0}/100`}
            sublabel={
              intelligence?.cvScore
                ? `Profile ${profileCompletion}% · CV ${intelligence.cvScore}/100`
                : `Profile ${profileCompletion}% · No CV scored`
            }
            href="/profile"
          />
          <MetricCard
            icon={Briefcase}
            label="Opportunity Momentum"
            value={momentum.savedCount + momentum.recentApplications}
            sublabel={`${momentum.savedCount} saved · ${momentum.recentApplications} applied`}
            href="/suggestions"
          />
          <MetricCard
            icon={Zap}
            label="Today's Focus"
            value={todayEvents.length}
            sublabel={todayEvents.length === 0 ? 'No tasks planned' : `${todayEvents.length} task${todayEvents.length !== 1 ? 's' : ''} planned`}
            href="/planner"
          />
        </motion.div>

        {/* ─── Capability Building (Active Path) ─── */}
        <motion.div
          className="section-gap"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}
        >
          <Card>
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-[var(--accent-blue)]" />
                  <h2 className="text-lg font-semibold">Capability Building</h2>
                </div>
                <Link href="/paths">
                  <Button variant="outline" size="sm" className="text-xs">
                    {activePath ? 'Open path' : 'Browse paths'} <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>

              {activePath ? (
                <div className="flex items-center gap-5">
                  {/* Mini progress ring */}
                  <div className="shrink-0">
                    <svg width={64} height={64}>
                      <circle cx={32} cy={32} r={28} stroke="var(--border-soft)" strokeWidth={5} fill="none" />
                      <circle
                        cx={32}
                        cy={32}
                        r={28}
                        stroke="var(--accent-blue)"
                        strokeWidth={5}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 28}
                        strokeDashoffset={2 * Math.PI * 28 - (activePath.progressPercent / 100) * (2 * Math.PI * 28)}
                        transform="rotate(-90 32 32)"
                      />
                      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="fill-[var(--foreground)] font-semibold" style={{ fontSize: 14 }}>
                        {activePath.progressPercent}%
                      </text>
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-blue)] mb-0.5">
                      Currently learning
                    </p>
                    <h3 className="text-base font-semibold truncate">{activePath.pathTitle}</h3>
                    {activePath.currentModule ? (
                      <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                        Next: {activePath.currentModule.title} · {activePath.currentModule.estimatedMinutes} min
                      </p>
                    ) : (
                      <p className="text-xs text-[var(--success)] mt-0.5">All modules complete</p>
                    )}
                    <p className="text-xs text-[var(--text-subtle)] mt-1 line-clamp-1">{activePath.outcome}</p>
                  </div>
                </div>
              ) : (
                <div className="empty-state py-4">
                  <GraduationCap className="empty-state-icon" />
                  <p className="font-medium mb-1">Build a new capability</p>
                  <p className="text-sm text-[var(--text-subtle)] mb-3">
                    Pick a path that improves your career outcomes — AI for consulting, CV mastery, interview readiness, and more.
                  </p>
                  <Link href="/paths">
                    <Button size="sm" variant="outline">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Explore paths
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── This Week's Focus ─── */}
        <motion.div
          className="section-gap"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Card>
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-[var(--accent-blue)]" />
                  <h2 className="text-lg font-semibold">This Week&apos;s Focus</h2>
                </div>
                <Link href="/copilot">
                  <Button variant="outline" size="sm" className="text-xs">
                    {weeklyPlan ? 'Open G.ai' : 'Generate Plan'} <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>

              {priorities.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {priorities.slice(0, 3).map((p, i) => (
                    <span key={i} className="badge badge-blue text-xs" title={p.rationale}>
                      {p.title}
                    </span>
                  ))}
                </div>
              )}

              {weekDays.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {weekDays.map(([day, tasks]) => (
                    <div key={day} className="surface-card-subtle rounded-lg p-3 min-h-[80px]">
                      <p className="text-xs font-semibold text-[var(--text-muted)] mb-2">{day}</p>
                      <div className="space-y-1">
                        {tasks.slice(0, 3).map((t, i) => (
                          <p key={i} className="text-xs text-[var(--foreground)] truncate">{t.title}</p>
                        ))}
                        {tasks.length > 3 && (
                          <p className="text-xs text-[var(--text-subtle)]">+{tasks.length - 3} more</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : planIsStale ? (
                <div className="rounded-lg border border-[var(--warning)]/30 bg-[var(--warning-soft)] p-4 flex items-start gap-3">
                  <div className="rounded-lg bg-[var(--warning)]/10 p-2 shrink-0">
                    <Brain className="h-4 w-4 text-[var(--warning)]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">Your weekly plan is {planAgeDays} days old</p>
                    <p className="text-xs text-[var(--text-muted)] mb-3">
                      Ask G.ai to refresh this week&apos;s focus so it reflects where you are now.
                    </p>
                    <Link href="/copilot">
                      <Button size="sm" variant="outline" className="text-xs">
                        Regenerate plan <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="empty-state py-4">
                  <ClipboardList className="empty-state-icon" />
                  <p className="font-medium mb-1">No weekly plan yet</p>
                  <p className="text-sm text-[var(--text-subtle)]">Ask G.ai to create a weekly focus plan</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── Two Column Grid: To-Do + Today's Plan ─── */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Career To-Do List */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="h-full">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-[var(--accent-blue)]" />
                  <h2 className="text-lg font-semibold">Career To-Do List</h2>
                </div>
                {user && <ToDoList userId={user.uid} />}
              </CardContent>
            </Card>
          </motion.div>

          {/* Today's Planner Events */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <Card className="h-full">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[var(--accent-blue)]" />
                    <h2 className="text-lg font-semibold">Today&apos;s Plan</h2>
                  </div>
                  <Link href="/planner">
                    <Button variant="ghost" size="sm" className="text-xs text-[var(--text-muted)]">
                      Open Planner <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>

                {todayEvents.length > 0 ? (
                  <div className="space-y-2">
                    {todayEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="flex items-center gap-3 surface-card-subtle rounded-lg px-4 py-3"
                      >
                        {evt.source === 'copilot' ? (
                          <Brain className="h-4 w-4 text-[var(--accent-blue)] shrink-0" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-[var(--text-subtle)] shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{evt.title}</p>
                          {evt.notes && <p className="text-xs text-[var(--text-muted)] truncate">{evt.notes}</p>}
                        </div>
                        {evt.source === 'copilot' && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] shrink-0">AI</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state py-6">
                    <Calendar className="empty-state-icon" />
                    <p className="font-medium mb-1">Nothing planned for today</p>
                    <p className="text-sm text-[var(--text-subtle)] mb-4">Add tasks in the planner or let G.ai plan your week</p>
                    <div className="flex gap-2 justify-center">
                      <Link href="/planner">
                        <Button variant="outline" size="sm">
                          <Calendar className="h-4 w-4 mr-2" />
                          Open Planner
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ─── CV Score Section ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="section-gap"
        >
          <Card>
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[var(--accent-blue)]" />
                  <h2 className="text-lg font-semibold">CV Score</h2>
                </div>
                <div className="flex items-center gap-2">
                  {cvScoreTimestamp && (
                    <span className="text-xs text-[var(--text-subtle)] hidden sm:inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(cvScoreTimestamp)}
                    </span>
                  )}
                  {cvScore && (
                    <Button onClick={clearCVScore} disabled={clearingScore} variant="ghost" size="sm" className="text-[var(--danger)] hover:bg-[var(--danger-soft)]">
                      {clearingScore ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                </div>
              </div>

              {!cvScore ? (
                <div className="empty-state py-6">
                  <FileText className="empty-state-icon" />
                  <p className="font-medium mb-1">No CV score yet</p>
                  <p className="text-sm text-[var(--text-subtle)] mb-4">Upload your CV to get a detailed performance analysis</p>
                  <Link href="/cvscore">
                    <Button size="sm">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Generate CV Score
                    </Button>
                  </Link>
                </div>
              ) : (
                <CVScoreDisplay score={cvScore} analysis={cvScoreAnalysis} />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── Pinned Suggestions from G.ai ─── */}
        {pinnedSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.32 }}
            className="section-gap"
          >
            <Card>
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[var(--accent-blue)]" />
                    <h2 className="text-lg font-semibold">Pinned Suggestions</h2>
                    <span className="badge badge-blue">{pinnedSuggestions.length}</span>
                  </div>
                  <Link href="/copilot">
                    <Button variant="outline" size="sm" className="text-xs">
                      Open G.ai <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
                <div className="space-y-2">
                  {pinnedSuggestions.map((s) => (
                    <div key={s.id} className="flex items-start gap-3 surface-card-subtle rounded-lg px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.title}</p>
                        {s.notes && <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{s.notes}</p>}
                      </div>
                      <button
                        onClick={() => unpinSuggestion(s.id)}
                        disabled={unpinning === s.id}
                        className="p-1 rounded text-[var(--text-subtle)] hover:text-[var(--danger)] transition-colors shrink-0"
                        title="Unpin"
                      >
                        {unpinning === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── Saved Opportunities ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <Card>
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-[var(--warning)]" />
                  <h2 className="text-lg font-semibold">Saved Opportunities</h2>
                  {savedOpportunities.length > 0 && (
                    <span className="badge badge-blue">{savedOpportunities.length}</span>
                  )}
                </div>
                <Link href="/suggestions">
                  <Button variant="outline" size="sm">
                    Find More
                  </Button>
                </Link>
              </div>

              {opportunitiesLoading ? (
                <div className="empty-state py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-blue)] mb-2" />
                  <p className="text-sm">Loading saved opportunities...</p>
                </div>
              ) : savedOpportunities.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {savedOpportunities.map((opportunity) => (
                    <OpportunityCard
                      key={opportunity.id}
                      opportunity={opportunity}
                      onUnstar={unstarOpportunity}
                      unstarring={unstarringLoading === opportunity.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-state py-6">
                  <Star className="empty-state-icon" />
                  <p className="font-medium mb-1">No saved opportunities</p>
                  <p className="text-sm text-[var(--text-subtle)] mb-4">Browse and save opportunities that interest you</p>
                  <Link href="/suggestions">
                    <Button size="sm">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Find Opportunities
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
