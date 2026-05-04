'use client';

/**
 * Recruiter Profile — own profile management
 *
 * Updates company + personal details. Mirrors the onboarding form but
 * surfaces account-level metadata (subscription tier, creation date) at the
 * top so recruiters know what plan they're on.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Building2,
  User,
  Loader2,
  CheckCircle2,
  Crown,
  ArrowLeft,
  Save,
  Calendar,
  Award,
  Mail,
} from 'lucide-react';
import type { RecruiterProfile } from '@/types/recruiter';

const COMPANY_SIZES = [
  { value: 'startup', label: 'Startup (1-10)' },
  { value: 'small', label: 'Small (11-50)' },
  { value: 'medium', label: 'Medium (51-200)' },
  { value: 'large', label: 'Large (201-1000)' },
  { value: 'enterprise', label: 'Enterprise (1000+)' },
] as const;

type CompanySize = (typeof COMPANY_SIZES)[number]['value'];

export default function RecruiterProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [recruiterProfile, setRecruiterProfile] = useState<RecruiterProfile | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    companySize: 'small' as CompanySize,
    industry: '',
    companyWebsite: '',
    fullName: '',
    jobTitle: '',
    department: '',
    phoneNumber: '',
    linkedinProfile: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    const load = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/recruiter/verify', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          // Allow demo bypass users to reach this page even without a recruiter doc
          setLoading(false);
          return;
        }
        const data = await res.json();
        setRecruiterProfile(data.recruiter);
        setFormData({
          companyName: data.recruiter.companyName ?? '',
          companySize: data.recruiter.companySize ?? 'small',
          industry: data.recruiter.industry ?? '',
          companyWebsite: data.recruiter.companyWebsite ?? '',
          fullName: data.recruiter.fullName ?? '',
          jobTitle: data.recruiter.jobTitle ?? '',
          department: data.recruiter.department ?? '',
          phoneNumber: data.recruiter.phoneNumber ?? '',
          linkedinProfile: data.recruiter.linkedinProfile ?? '',
        });
      } catch (err) {
        console.error('Error loading recruiter profile:', err);
        setError('Could not load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, authLoading, router]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      if (
        !formData.companyName ||
        !formData.fullName ||
        !formData.jobTitle ||
        !formData.department ||
        !formData.industry
      ) {
        setError('Please fill in all required fields');
        setSaving(false);
        return;
      }
      const token = await user.getIdToken();
      const response = await fetch('/api/recruiter/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2200);
    } catch (err) {
      setError('Could not save profile: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-blue)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="page-container">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="page-header flex items-center justify-between gap-3 flex-wrap"
        >
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/recruiter-dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-[var(--accent-blue)]" />
              <h1 className="page-title !text-xl">Recruiter profile</h1>
            </div>
          </div>
          {recruiterProfile && (
            <span className="badge badge-blue uppercase tracking-wider">
              {recruiterProfile.subscriptionTier}
            </span>
          )}
        </motion.div>

        {/* Account snapshot */}
        {recruiterProfile && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="mb-6"
          >
            <Card>
              <CardContent className="p-5 sm:p-6">
                <div className="grid sm:grid-cols-3 gap-4">
                  <SnapshotItem
                    icon={Calendar}
                    label="Member since"
                    value={
                      recruiterProfile.createdAt
                        ? new Date(recruiterProfile.createdAt).toLocaleDateString()
                        : '—'
                    }
                  />
                  <SnapshotItem
                    icon={Award}
                    label="Status"
                    value={recruiterProfile.isVerified ? 'Verified' : 'Pending verification'}
                    badgeClass={recruiterProfile.isVerified ? 'badge badge-success' : 'badge badge-warning'}
                  />
                  <SnapshotItem icon={Mail} label="Email" value={recruiterProfile.email || '—'} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Forms */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid lg:grid-cols-2 gap-5"
        >
          <Card>
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-4 h-4 text-[var(--accent-blue)]" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Company
                </h2>
              </div>
              <div className="space-y-3">
                <Field label="Company name" required>
                  <Input
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                  />
                </Field>
                <Field label="Company size" required>
                  <select
                    value={formData.companySize}
                    onChange={(e) => handleInputChange('companySize', e.target.value)}
                    className="form-input"
                  >
                    {COMPANY_SIZES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Industry" required>
                  <Input
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    placeholder="e.g., Technology, Finance, Healthcare"
                  />
                </Field>
                <Field label="Company website">
                  <Input
                    value={formData.companyWebsite}
                    onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                    placeholder="https://www.company.com"
                  />
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-[var(--accent-blue)]" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  About you
                </h2>
              </div>
              <div className="space-y-3">
                <Field label="Full name" required>
                  <Input
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                  />
                </Field>
                <Field label="Job title" required>
                  <Input
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                  />
                </Field>
                <Field label="Department" required>
                  <Input
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                  />
                </Field>
                <Field label="Phone">
                  <Input
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  />
                </Field>
                <Field label="LinkedIn">
                  <Input
                    value={formData.linkedinProfile}
                    onChange={(e) => handleInputChange('linkedinProfile', e.target.value)}
                  />
                </Field>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-3"
          >
            <p className="text-sm text-[var(--danger)]">{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 rounded-lg border border-[var(--success)]/30 bg-[var(--success-soft)] px-4 py-3 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
            <p className="text-sm text-[var(--success)]">Profile saved.</p>
          </motion.div>
        )}

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
        {label}
        {required && <span className="text-[var(--danger)] ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}

function SnapshotItem({
  icon: Icon,
  label,
  value,
  badgeClass,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
  badgeClass?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="rounded-md bg-[var(--surface-subtle)] p-1.5 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-[var(--text-subtle)] font-semibold mb-0.5">
          {label}
        </p>
        {badgeClass ? (
          <span className={badgeClass}>{value}</span>
        ) : (
          <p className="text-sm text-[var(--foreground)] truncate">{value}</p>
        )}
      </div>
    </div>
  );
}
