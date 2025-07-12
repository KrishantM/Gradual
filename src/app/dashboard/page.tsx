'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import ToDoList from '@/components/ToDoList';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Home, 
  User, 
  Brain, 
  CheckCircle, 
  TrendingUp, 
  Calendar, 
  LogOut, 
  Edit, 
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

function extractOverallScore(scoreText: string | null): string | null {
  if (!scoreText) return null;
  const match = scoreText.match(/Overall Score \(0–100\):\s*(\d+)/);
  return match ? match[1] : null;
}

function formatDate(date: any) {
  if (!date) return '';
  if (typeof date === 'string') date = new Date(date);
  if (date.toDate) date = date.toDate(); // Firestore Timestamp
  return date.toLocaleDateString();
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [suggestions, setSuggestions] = useState('');
  const [name, setName] = useState('');
  const [cvScore, setCvScore] = useState<string | null>(null);
  const [cvScoreTimestamp, setCvScoreTimestamp] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setName(userSnap.data().fullName || '');
          setCvScore(userSnap.data().cvScore || null);
          setCvScoreTimestamp(userSnap.data().cvScoreTimestamp || null);
        }

        const suggRef = doc(db, 'suggestions', user.uid);
        const suggSnap = await getDoc(suggRef);
        if (suggSnap.exists()) {
          setSuggestions(suggSnap.data().suggestions);
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, router]);

  const overallScore = extractOverallScore(cvScore);

  if (loading || !user) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-4" />
        <p className="text-gray-300">Loading your dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="mb-6">
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                Welcome{name && `, ${name}`}! 👋
              </h1>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Your personalized career dashboard with insights, suggestions, and progress tracking
              </p>
            </div>
          </div>

          {/* CV Score Section */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl mb-8">
            <CardContent className="p-6">
              <div className="flex items-center mb-6">
                <TrendingUp className="h-6 w-6 text-blue-400 mr-3" />
                <h2 className="text-2xl font-semibold text-white">Your Latest CV Score</h2>
              </div>
              
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-6xl font-extrabold text-blue-400">
                      {overallScore ? overallScore : '—'}
                    </span>
                    <div className="text-left">
                      <p className="text-gray-300 text-sm">Overall Score</p>
                      <p className="text-gray-400 text-xs">out of 100</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-auto min-w-0 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 whitespace-nowrap px-3 py-2 text-sm"
                    onClick={() => setShowDetails((v) => !v)}
                  >
                    {showDetails ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        View Details
                      </>
                    )}
                  </Button>
                </div>
                
                {cvScoreTimestamp && (
                  <div className="flex items-center text-gray-400 text-sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    Last updated: {formatDate(cvScoreTimestamp)}
                  </div>
                )}
                
                {showDetails && cvScore && (
                  <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
                    <p className="text-gray-200 whitespace-pre-line leading-relaxed text-sm">
                      {cvScore}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Saved Suggestions */}
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center mb-6">
                  <Sparkles className="h-6 w-6 text-blue-400 mr-3" />
                  <h2 className="text-xl font-semibold text-white">Saved Suggestions</h2>
                </div>
                
                {suggestions ? (
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
                    <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                      {suggestions}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">
                      No saved suggestions yet
                    </p>
                    <Link href="/suggestions">
                      <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                        <Brain className="h-4 w-4 mr-2" />
                        Generate Suggestions
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* To-Do List */}
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center mb-6">
                  <CheckCircle className="h-6 w-6 text-blue-400 mr-3" />
                  <h2 className="text-xl font-semibold text-white">Your Career To-Do List</h2>
                </div>
                <ToDoList userId={user.uid} />
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/profile" className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105">
                    <Edit className="h-5 w-5 mr-2" />
                    Edit Profile
                  </Button>
                </Link>
                
                <Link href="/suggestions" className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105">
                    <Brain className="h-5 w-5 mr-2" />
                    Get New Suggestions
                  </Button>
                </Link>
                
                <Link href="/cvscore" className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Score CV
                  </Button>
                </Link>
                
                <Button 
                  onClick={logout}
                  className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
