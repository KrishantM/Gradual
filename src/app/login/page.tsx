'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login } = useAuth();

  // Redirect if already signed in
  useEffect(() => {
    if (user) router.push('/dashboard');
  }, [user, router]);

  const justRegistered = searchParams?.get('registered') === '1';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in both fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--foreground)] mb-3">
            Welcome to{' '}
            <span className="bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] bg-clip-text text-transparent">
              Gradual
            </span>
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-secondary)]">
            Sign in to access your career operating system
          </p>
        </div>

        {justRegistered && (
          <div
            className="mb-4 flex items-start gap-3 rounded-lg border px-4 py-3"
            style={{
              backgroundColor: 'var(--success-soft)',
              borderColor: 'color-mix(in srgb, var(--success) 30%, transparent)',
              color: 'var(--success)',
            }}
          >
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="flex-1 text-sm">Account created — sign in to continue.</div>
          </div>
        )}

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
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10 pr-10 h-11"
                    autoComplete="current-password"
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
              </div>

              {/* Sign In */}
              <Button
                className="w-full h-11 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-strong)] text-white font-semibold rounded-lg shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all duration-200"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Signing in…
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign in
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
                  Don&apos;t have an account?
                </span>
                <div className="flex-grow border-t border-[var(--border-soft)]" />
              </div>

              {/* Register */}
              <Link href="/register" className="block">
                <Button variant="outline" className="w-full h-11">
                  Create account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Terms */}
        <p className="text-center mt-6 text-xs text-[var(--text-muted)]">
          By signing in, you agree to our{' '}
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-blue)]" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
