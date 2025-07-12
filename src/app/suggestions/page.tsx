'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '../../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Sparkles, ArrowRight, CheckCircle, User, GraduationCap, Target } from 'lucide-react';

export default function SuggestionsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [extraContext, setExtraContext] = useState('');
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setProfile(snap.data());
      }
    };
    fetchProfile();
  }, [user]);

  const handleGenerate = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          interests: `${profile.interests} ${extraContext}`,
          uid: user?.uid,
        }),
      });
      const data = await res.json();
      setSuggestions(data.suggestions);
    } catch (err) {
      alert('Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="mb-6">
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                Career <span className="text-blue-400">Suggestions</span>
              </h1>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Get AI-powered career recommendations tailored to your profile and aspirations
              </p>
            </div>
          </div>

          {/* Profile Summary */}
          {profile && (
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl mb-8">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <User className="h-6 w-6 text-blue-400 mr-3" />
                  <h2 className="text-xl font-semibold text-white">Your Profile Summary</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-4 text-gray-300">
                  <div className="flex items-center">
                    <span className="font-medium text-blue-300 mr-2">Name:</span>
                    <span>{profile.fullName}</span>
                  </div>
                  <div className="flex items-center">
                    <GraduationCap className="h-4 w-4 text-blue-400 mr-2" />
                    <span className="font-medium text-blue-300 mr-2">University:</span>
                    <span>{profile.university}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium text-blue-300 mr-2">Degree:</span>
                    <span>{profile.degree}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium text-blue-300 mr-2">GPA:</span>
                    <span>{profile.gpa}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium text-blue-300 mr-2">Interests:</span>
                    <span className="text-gray-300">{profile.interests}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Input Section */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl mb-8">
            <CardContent className="p-6">
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <Sparkles className="h-5 w-5 text-green-400 mr-2" />
                  <p className="text-green-400 text-sm font-medium">Suggestions are based on your profile</p>
                </div>
                <div className="flex items-center mb-4">
                  <Target className="h-5 w-5 text-orange-300 mr-2" />
                  <p className="text-orange-300 text-sm">Add extra context for more specific results</p>
                </div>
                <textarea
                  className="w-full p-4 rounded-lg bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 resize-none"
                  rows={4}
                  placeholder="e.g. Interested in data roles with social impact, prefer remote work, looking for entry-level positions..."
                  value={extraContext}
                  onChange={(e) => setExtraContext(e.target.value)}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Brain className="h-5 w-5 mr-2" />
                      Generate Suggestions
                    </div>
                  )}
                </Button>

                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300"
                  >
                    View Saved Suggestions
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Suggestions Results */}
          {suggestions.length > 0 && (
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center mb-6">
                  <CheckCircle className="h-6 w-6 text-green-400 mr-3" />
                  <h2 className="text-2xl font-semibold text-white">Your Career Suggestions</h2>
                </div>
                <div className="space-y-4">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 hover:bg-white/15 transition-all duration-300"
                    >
                      <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                        {suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
