'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { db } from '../../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { User, Target, ArrowRight, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

const GOAL_SUGGESTIONS = [
  'Land my first internship',
  'Build my professional network',
  'Improve my CV and interview skills',
  'Explore career options in my field',
  'Get a graduate role by year end',
];

function localDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [goal, setGoal] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const checkOnboardingStatus = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const data = snap.data();
          // Already onboarded — skip to dashboard
          if (data.onboardingComplete !== false) {
            router.push('/dashboard');
            return;
          }
          // Pre-fill if they had partially filled profile before
          if (data.fullName) setFullName(data.fullName as string);
          if (data.bio) setHeadline(data.bio as string);
        }
      } catch (err) {
        console.error('Error checking onboarding status:', err);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkOnboardingStatus();
  }, [authLoading, user, router]);

  const handleStep1 = () => {
    if (!fullName.trim()) {
      setError('Please enter your name.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleComplete = async () => {
    if (!goal.trim()) {
      setError('Please enter your focus goal.');
      return;
    }
    if (!user) return;

    setSaving(true);
    setError('');
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        fullName: fullName.trim(),
        bio: headline.trim(),
        onboardingComplete: true,
      });

      trackEvent('onboarding_complete', user.uid, {
        usedSuggestion: GOAL_SUGGESTIONS.includes(goal.trim()),
      });

      // Seed one planner event for today with the focus goal
      const token = await user.getIdToken();
      await fetch('/api/planner/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          date: localDateKey(),
          title: goal.trim(),
          notes: 'Your first focus goal — set during onboarding',
          source: 'user',
        }),
      });

      router.push('/dashboard');
    } catch (err) {
      console.error('Error completing onboarding:', err);
      setError('Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  if (authLoading || checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[var(--accent-blue)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center rounded-full bg-[var(--accent-blue-soft)] p-3 mb-4">
            <Sparkles className="h-6 w-6 text-[var(--accent-blue)]" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] mb-2">
            Let&apos;s set up your dashboard
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {step === 1 ? 'Tell us a bit about you' : "What's your #1 goal right now?"}
          </p>
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div
              className={`h-1.5 w-8 rounded-full transition-colors ${
                step >= 1 ? 'bg-[var(--accent-blue)]' : 'bg-[var(--border-soft)]'
              }`}
            />
            <div
              className={`h-1.5 w-8 rounded-full transition-colors ${
                step >= 2 ? 'bg-[var(--accent-blue)]' : 'bg-[var(--border-soft)]'
              }`}
            />
          </div>
        </div>

        <Card className="surface-card-elevated">
          <CardContent className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block mb-2 text-sm font-medium text-[var(--text-secondary)]">
                      Your name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                      <Input
                        type="text"
                        placeholder="e.g. Alex Johnson"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleStep1()}
                        className="pl-10 h-11"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-[var(--text-secondary)]">
                      One-line headline{' '}
                      <span className="text-[var(--text-muted)] font-normal">(optional)</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. CS student at Auckland Uni seeking internships"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleStep1()}
                      className="h-11"
                      maxLength={120}
                    />
                  </div>

                  {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

                  <Button
                    className="w-full h-11 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-strong)] text-white font-semibold"
                    onClick={handleStep1}
                  >
                    Next <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block mb-2 text-sm font-medium text-[var(--text-secondary)]">
                      Your #1 career focus right now
                    </label>
                    <div className="relative">
                      <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                      <Input
                        type="text"
                        placeholder="e.g. Land my first internship"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !saving && handleComplete()}
                        className="pl-10 h-11"
                        autoFocus
                        maxLength={200}
                      />
                    </div>
                  </div>

                  {/* Quick suggestions */}
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-2">Quick pick:</p>
                    <div className="flex flex-wrap gap-2">
                      {GOAL_SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setGoal(s)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                            goal === s
                              ? 'border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]'
                              : 'border-[var(--border-soft)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)]'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="h-11"
                      onClick={() => {
                        setStep(1);
                        setError('');
                      }}
                      disabled={saving}
                    >
                      Back
                    </Button>
                    <Button
                      className="flex-1 h-11 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-strong)] text-white font-semibold"
                      onClick={handleComplete}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Setting up&hellip;
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" /> Open my dashboard
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <p className="text-center mt-6 text-xs text-[var(--text-muted)]">
          You can update your profile anytime from the Profile page.
        </p>
      </div>
    </div>
  );
}
