'use client';

import { useState } from 'react';
import { auth, db } from '../../../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, Users, Building } from 'lucide-react';
import Link from 'next/link';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const validatePassword = (password: string) => {
    const lengthOK = password.length >= 6;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    return lengthOK && hasUppercase && hasLowercase && hasNumber;
  };

  const handleRegister = async () => {
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
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

      await setDoc(doc(db, 'users', uid), {
        email,
        role,
        createdAt: new Date(),
      });

      alert('Registration successful! Please sign in.');
      router.push('/login');
    } catch (err: any) {
      setError(`Registration failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRegister();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                Join <span className="text-blue-400">neXtwork</span>
              </h1>
              <p className="text-gray-300 text-lg">
                Create your account and start your career journey
              </p>
            </div>
          </div>

          <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
            <CardContent className="p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-6">
                {/* Email Input */}
                <div>
                  <label className="block mb-2 font-medium text-blue-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block mb-2 font-medium text-blue-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">
                    Must be at least 6 characters with uppercase, lowercase, and number
                  </p>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block mb-2 font-medium text-blue-300">
                    I am a
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('student')}
                      className={`p-4 rounded-lg border-2 transition-all duration-300 flex items-center justify-center ${
                        role === 'student'
                          ? 'border-blue-400 bg-blue-400/20 text-blue-300'
                          : 'border-white/20 bg-white/5 text-gray-300 hover:border-white/40 hover:bg-white/10'
                      }`}
                    >
                      <Users className="h-5 w-5 mr-2" />
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('recruiter')}
                      className={`p-4 rounded-lg border-2 transition-all duration-300 flex items-center justify-center ${
                        role === 'recruiter'
                          ? 'border-blue-400 bg-blue-400/20 text-blue-300'
                          : 'border-white/20 bg-white/5 text-gray-300 hover:border-white/40 hover:bg-white/10'
                      }`}
                    >
                      <Building className="h-5 w-5 mr-2" />
                      Recruiter
                    </button>
                  </div>
                </div>

                {/* Register Button */}
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
                  onClick={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Creating Account...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <UserPlus className="h-5 w-5 mr-2" />
                      Create Account
                    </div>
                  )}
                </Button>

                {/* Divider */}
                <div className="flex items-center my-4">
                  <div className="flex-grow border-t border-white/20" />
                  <span className="mx-4 text-gray-400 text-sm bg-transparent whitespace-nowrap">Already have an account?</span>
                  <div className="flex-grow border-t border-white/20" />
                </div>

                {/* Login Link */}
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300"
                  >
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
