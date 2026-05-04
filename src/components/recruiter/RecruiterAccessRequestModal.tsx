'use client';

/**
 * RecruiterAccessRequestModal — in-app form for "Request recruiter access".
 *
 * Replaces the old mailto link. Sends to `/api/recruiter/access-request`,
 * which writes to Firestore (`recruiterAccessRequests`) and emails
 * `admin@gradual.co.nz` via Resend.
 *
 * Honors auth: when the user is signed in we forward the Firebase ID token
 * so admin can correlate the request to a Gradual account.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Loader2,
  CheckCircle2,
  Send,
  Mail,
  User,
  Phone,
  Briefcase,
  Building2,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface RecruiterAccessRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fill email from the signed-in user, if any. */
  defaultEmail?: string | null;
}

export function RecruiterAccessRequestModal({
  open,
  onOpenChange,
  defaultEmail,
}: RecruiterAccessRequestModalProps) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    email: defaultEmail ?? '',
    phone: '',
    role: '',
    organisation: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Sync the email field when defaultEmail changes (e.g. user signs in
  // while modal is mounted but closed).
  useEffect(() => {
    if (defaultEmail && !form.email) {
      setForm((prev) => ({ ...prev, email: defaultEmail }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultEmail]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const update = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.fullName || !form.email || !form.phone || !form.role || !form.organisation) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user) {
        try {
          const token = await user.getIdToken();
          headers.Authorization = `Bearer ${token}`;
        } catch {
          /* fall through — anonymous submission still works */
        }
      }

      const res = await fetch('/api/recruiter/access-request', {
        method: 'POST',
        headers,
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Could not send your request. Please try again.');
      }

      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        // small delay so the success state stays visible during the fade-out
        setTimeout(() => {
          setSuccess(false);
          setForm({
            fullName: '',
            email: defaultEmail ?? '',
            phone: '',
            role: '',
            organisation: '',
            message: '',
          });
        }, 250);
      }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => !submitting && onOpenChange(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <button
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)] transition-colors disabled:opacity-40"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {success ? (
              <div className="p-8 sm:p-10 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--success-soft)] mb-4"
                >
                  <CheckCircle2 className="w-7 h-7 text-[var(--success)]" />
                </motion.div>
                <h2 className="text-xl font-semibold mb-2 text-[var(--foreground)]">
                  Request sent
                </h2>
                <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto">
                  Thanks — the Gradual partnerships team will be in touch within
                  two business days.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
                <div className="px-6 sm:px-7 pt-6 pb-4 border-b border-[var(--border-soft)]">
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="rounded-lg bg-[var(--accent-blue-soft)] p-1.5">
                      <Mail className="w-4 h-4 text-[var(--accent-blue)]" />
                    </div>
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">
                      Request recruiter access
                    </h2>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] ml-9">
                    We&apos;ll review and reply within two business days.
                  </p>
                </div>

                <div className="px-6 sm:px-7 py-5 space-y-4 overflow-y-auto">
                  <div className="grid sm:grid-cols-2 gap-3.5">
                    <FormField label="Full name" icon={User} required>
                      <Input
                        value={form.fullName}
                        onChange={(e) => update('fullName', e.target.value)}
                        placeholder="Jane Smith"
                        autoComplete="name"
                        required
                      />
                    </FormField>
                    <FormField label="Work email" icon={Mail} required>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => update('email', e.target.value)}
                        placeholder="jane@company.com"
                        autoComplete="email"
                        required
                      />
                    </FormField>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3.5">
                    <FormField label="Phone" icon={Phone} required>
                      <Input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => update('phone', e.target.value)}
                        placeholder="+64 21 123 4567"
                        autoComplete="tel"
                        required
                      />
                    </FormField>
                    <FormField label="Role / title" icon={Briefcase} required>
                      <Input
                        value={form.role}
                        onChange={(e) => update('role', e.target.value)}
                        placeholder="Talent Acquisition Lead"
                        autoComplete="organization-title"
                        required
                      />
                    </FormField>
                  </div>

                  <FormField label="Organisation" icon={Building2} required>
                    <Input
                      value={form.organisation}
                      onChange={(e) => update('organisation', e.target.value)}
                      placeholder="Acme Co."
                      autoComplete="organization"
                      required
                    />
                  </FormField>

                  <FormField label="Tell us about your hiring goals (optional)" icon={MessageSquare}>
                    <textarea
                      value={form.message}
                      onChange={(e) => update('message', e.target.value)}
                      rows={4}
                      maxLength={2000}
                      placeholder="What roles are you hiring for? Any specific skills, study areas, or timing we should know about?"
                      className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--text-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/40 focus-visible:ring-offset-2 ring-offset-[var(--surface)] resize-none"
                    />
                    <p className="text-[11px] text-[var(--text-subtle)] mt-1.5">
                      {form.message.length} / 2000
                    </p>
                  </FormField>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2.5"
                    >
                      <p className="text-sm text-[var(--danger)]">{error}</p>
                    </motion.div>
                  )}
                </div>

                <div className="px-6 sm:px-7 py-4 border-t border-[var(--border-soft)] bg-[var(--surface-subtle)]/40 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-[11px] text-[var(--text-subtle)]">
                    Sent securely to <strong>admin@gradual.co.nz</strong>
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send request
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FormField({
  label,
  icon: Icon,
  required,
  children,
}: {
  label: string;
  icon: typeof Mail;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] mb-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
        {required && <span className="text-[var(--danger)]">*</span>}
      </span>
      {children}
    </label>
  );
}
