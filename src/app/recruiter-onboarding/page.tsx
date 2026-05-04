'use client';

/**
 * Recruiter Onboarding — Gradual partner platform
 *
 * Lightweight first-run form. Demo bypass users skip this entirely (the
 * dashboard short-circuits to the bypass viewer). Paid recruiters fill it
 * once before they hit the dashboard.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Building2,
  User,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Crown,
} from 'lucide-react';

const COMPANY_SIZES = [
  { value: 'startup', label: 'Startup (1-10)' },
  { value: 'small', label: 'Small (11-50)' },
  { value: 'medium', label: 'Medium (51-200)' },
  { value: 'large', label: 'Large (201-1000)' },
  { value: 'enterprise', label: 'Enterprise (1000+)' },
] as const;

type CompanySize = (typeof COMPANY_SIZES)[number]['value'];

export default function RecruiterOnboarding() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

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
        const snap = await getDoc(doc(db, 'recruiters', user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setFormData((prev) => ({ ...prev, ...data }));
          if (data.companyName && data.fullName && data.jobTitle && data.department && data.industry) {
            router.push('/recruiter-dashboard');
            return;
          }
        }
      } catch (err) {
        console.error('Error loading recruiter data:', err);
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
      setTimeout(() => router.push('/recruiter-dashboard'), 1600);
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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center page-container">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--success-soft)] mb-4">
                <CheckCircle2 className="w-6 h-6 text-[var(--success)]" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Profile saved</h2>
              <p className="text-sm text-[var(--text-muted)] mb-4">
                Taking you to your recruiter dashboard…
              </p>
              <Loader2 className="w-4 h-4 animate-spin mx-auto text-[var(--accent-blue)]" />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="page-container max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="page-header text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--accent-blue-soft)] mb-3">
              <Crown className="w-5 h-5 text-[var(--accent-blue)]" />
            </div>
            <h1 className="page-title">Welcome to Gradual Recruiter</h1>
            <p className="page-subtitle max-w-xl mx-auto">
              A few quick details before you start discovering candidates. You can update these later.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid lg:grid-cols-2 gap-5"
        >
          {/* Company */}
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
                    placeholder="Acme Co."
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
                    placeholder="Technology, Finance, Healthcare…"
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

          {/* Personal */}
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
                    placeholder="Your name"
                  />
                </Field>
                <Field label="Job title" required>
                  <Input
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    placeholder="Senior Recruiter, Talent Lead…"
                  />
                </Field>
                <Field label="Department" required>
                  <Input
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    placeholder="Talent Acquisition"
                  />
                </Field>
                <Field label="Phone (optional)">
                  <Input
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </Field>
                <Field label="LinkedIn (optional)">
                  <Input
                    value={formData.linkedinProfile}
                    onChange={(e) => handleInputChange('linkedinProfile', e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
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

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-[var(--text-subtle)]">
            * required · We never share your details with candidates without consent.
          </p>
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
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
