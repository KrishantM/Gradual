'use client';

import { useState } from 'react';
import { auth, db } from '../../../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  Users,
  Building,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'recruiter'>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const validatePassword = (pw: string) => {
    return pw.length >= 6 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw);
  };

  const handleRegister = async () => {
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!validatePassword(password)) {
      setError(
        'Password must be at least 6 characters and include uppercase, lowercase, and a number.'
      );
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      if (role === 'recruiter') {
        const response = await fetch('/api/recruiter/create-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await userCredential.user.getIdToken()}`,
          },
          body: JSON.stringify({
            email,
            role,
            companyName: '',
            fullName: '',
            jobTitle: '',
            department: '',
            industry: '',
            companySize: 'small',
          }),
        });
        if (!response.ok) throw new Error('Failed to create recruiter profile');
        await setDoc(doc(db, 'users', uid), { email, role, createdAt: new Date() });
      } else {
        await setDoc(doc(db, 'users', uid), {
          email,
          role,
          createdAt: new Date(),
          isProfilePublic: true,
          allowRecruiterContact: true,
          onboardingComplete: false,
        });
      }

      router.push('/login?registered=1');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRegister();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--foreground)] mb-3">
            Join{' '}
            <span className="bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] bg-clip-text text-transparent">
              Gradual
            </span>
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-secondary)]">
            Create your account and start your career journey
          </p>
        </div>

        <Card className="surface-card-elevated">
          <CardContent className="p-6 sm:p-8">
            {error && (
              <div
                className="mb-5 flex items-start gap-3 rounded-lg border px-4 py-3"
                style={{
                  backgroundColor: 'var(--danger-soft)',
                  borderColor: 'color-mix(in srgb, var(--danger) 30%, transparent)',
                  color: 'var(--danger)',
                }}
                role="alert"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="flex-1 text-sm">{error}</div>
              </div>
            )}

            <div className="space-y-5">
              {/* Email */}
              <div>
                <label className="block mb-2 text-sm font-medium text-[var(--text-secondary)]">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10 h-11"
                    autoComplete="email"
                    inputMode="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block mb-2 text-sm font-medium text-[var(--text-secondary)]">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10 pr-10 h-11"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1.5">
                  At least 6 characters with uppercase, lowercase, and a number.
                </p>
              </div>

              {/* Role */}
              <div>
                <label className="block mb-2 text-sm font-medium text-[var(--text-secondary)]">
                  I am a
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-center text-sm font-medium ${
                      role === 'student'
                        ? 'border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]'
                        : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)]/40'
                    }`}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('recruiter')}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-center text-sm font-medium ${
                      role === 'recruiter'
                        ? 'border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]'
                        : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)]/40'
                    }`}
                  >
                    <Building className="h-4 w-4 mr-2" />
                    Recruiter
                  </button>
                </div>
              </div>

              {/* Register */}
              <Button
                className="w-full h-11 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-strong)] text-white font-semibold rounded-lg shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all duration-200"
                onClick={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating account…
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create account
                  </>
                )}
              </Button>

              {/* Guest */}
              <Button
                variant="outline"
                className="w-full h-11"
                onClick={() => router.push('/cvscore')}
                type="button"
              >
                Continue as guest
              </Button>

              {/* Divider */}
              <div className="flex items-center my-2">
                <div className="flex-grow border-t border-[var(--border-soft)]" />
                <span className="mx-3 text-xs text-[var(--text-muted)] whitespace-nowrap">
                  Already have an account?
                </span>
                <div className="flex-grow border-t border-[var(--border-soft)]" />
              </div>

              {/* Login */}
              <Link href="/login" className="block">
                <Button variant="outline" className="w-full h-11">
                  Sign in
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Terms */}
        <p className="text-center mt-6 text-xs text-[var(--text-muted)]">
          By creating an account, you agree to our{' '}
          <a
            href="/terms"
            className="text-[var(--accent-blue)] hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms
          </a>{' '}
          and{' '}
          <a
            href="/privacy"
            className="text-[var(--accent-blue)] hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
