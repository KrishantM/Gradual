'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, MapPin, GraduationCap, Briefcase, Link2, Edit3, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateGradualRating } from '@/lib/gradual-rating';

interface GamifiedProfileDisplayProps {
  formData: any;
  cvScore: number | string | null;
  /**
   * Optional capability-path progresses. Drives the "Paths Progress" component
   * of the Gradual Rating. Pass an empty array (or omit) when not enrolled.
   */
  pathProgresses?: { progressPercent: number }[];
  onEditProfile: () => void;
  onViewCV: () => void;
}

export default function GamifiedProfileDisplay({
  formData,
  cvScore,
  pathProgresses,
  onEditProfile,
  onViewCV
}: GamifiedProfileDisplayProps) {
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  const getNumericalCVScore = useMemo((): number => {
    if (!cvScore) return 0;
    if (typeof cvScore === 'string') {
      if (!cvScore.trim()) return 0;
      const scoreMatch = cvScore.match(/Overall Score \(0–100\): (\d+)/);
      return scoreMatch ? parseInt(scoreMatch[1]) : 0;
    }
    return typeof cvScore === 'number' ? cvScore : 0;
  }, [cvScore]);

  // Single source of truth — same formula as the dashboard's "Gradual Rating".
  const rating = useMemo(
    () =>
      calculateGradualRating({
        profile: formData as Record<string, unknown>,
        cvScore: getNumericalCVScore,
        pathProgresses: pathProgresses ?? [],
      }),
    [formData, getNumericalCVScore, pathProgresses]
  );

  const gradualRating = rating.total;
  const breakdownMetrics = rating.components;

  const getRatingColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  const getBarColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const initials = formData.fullName 
    ? formData.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Profile Banner */}
      <div className="surface-card rounded-2xl overflow-hidden">
        <div className="px-6 py-6 sm:px-8 sm:py-7">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-lg font-semibold text-white shadow-lg shadow-blue-500/20">
                {initials}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-white tracking-tight truncate">
                {formData.fullName || 'Your Name'}
              </h2>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
                {formData.degree && (
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {formData.degree}
                  </span>
                )}
                {formData.university && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" />
                    {formData.university}
                  </span>
                )}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                {(formData.city || formData.country) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {[formData.city, formData.country].filter(Boolean).join(', ')}
                  </span>
                )}
                {formData.portfolioLinks && (
                  <span className="flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5" />
                    Portfolio linked
                  </span>
                )}
              </div>

              {formData.interests && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {formData.interests.split(',').slice(0, 4).map((interest: string, i: number) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 rounded-full text-xs font-medium surface-card-subtle text-gray-400"
                    >
                      {interest.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Gradual Rating Card */}
      <div className="surface-card rounded-2xl overflow-hidden">
        <div className="px-6 py-7 sm:px-8 sm:py-8">
          {/* Rating Display */}
          <div className="text-center">
            <p className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-4">
              Gradual Rating
            </p>

            <div className="relative inline-flex items-baseline">
              <span className={`text-7xl sm:text-8xl font-bold tracking-tighter tabular-nums ${getRatingColor(gradualRating)}`}>
                {gradualRating}
              </span>
              <span className="text-2xl sm:text-3xl font-light text-gray-400 ml-1">/100</span>
            </div>

            <p className="mt-3 text-sm text-gray-400 max-w-sm mx-auto">
              {gradualRating >= 80 && 'Your profile is performing exceptionally well.'}
              {gradualRating >= 60 && gradualRating < 80 && 'Strong foundation — a few improvements will take you further.'}
              {gradualRating >= 40 && gradualRating < 60 && 'Good start. Complete your profile to boost your rating.'}
              {gradualRating < 40 && 'Add more information to build your career profile.'}
            </p>
          </div>

          {/* Breakdown Toggle */}
          <div className="mt-7">
            <button
              onClick={() => setBreakdownOpen(!breakdownOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl surface-card-subtle hover:opacity-80 transition-opacity duration-200 group"
            >
              <span className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">
                Score breakdown
              </span>
              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-300 ${breakdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${breakdownOpen ? 'max-h-[700px] opacity-100 mt-3' : 'max-h-0 opacity-0'}`}
            >
              <div className="space-y-3.5 px-1">
                {breakdownMetrics.map((metric) => (
                  <div key={metric.key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-400">{metric.label}</span>
                      <span className={`text-sm font-semibold tabular-nums ${getRatingColor(metric.value)}`}>
                        {metric.value}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${getBarColor(metric.value)}`}
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-gray-500 leading-snug">
                      {metric.rationale}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button
          onClick={onEditProfile}
          variant="outline"
          className="flex-1 h-11 rounded-xl text-sm font-medium transition-all duration-200"
        >
          <Edit3 className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
        {formData.uploadedCVName && (
          <Button
            onClick={onViewCV}
            variant="outline"
            className="flex-1 h-11 rounded-xl text-sm font-medium transition-all duration-200"
          >
            <FileText className="h-4 w-4 mr-2" />
            View CV
          </Button>
        )}
      </div>
    </div>
  );
}
