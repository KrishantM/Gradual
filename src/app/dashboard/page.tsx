'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '../../../lib/firebase';
import { doc, getDoc, getDocs, collection, query, where, updateDoc, arrayRemove } from 'firebase/firestore';
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
  ChevronUp,
  Briefcase,
  MapPin,
  Star,
  ExternalLink,
  BarChart3,
  Settings
} from 'lucide-react';

interface SavedOpportunity {
  id: string;
  title: string;
  description: string;
  location: string;
  company: string;
  url: string;
  type: 'internship' | 'job';
  category: string;
  created: string;
  salary_min?: number;
  salary_max?: number;
  source: string;
  score: number;
}

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

function formatOpportunityDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Today';
  if (diffDays <= 7) return `${diffDays} days ago`;
  if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`;
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
  const [savedOpportunities, setSavedOpportunities] = useState<SavedOpportunity[]>([]);
  const [opportunitiesLoading, setOpportunitiesLoading] = useState(false);
  const [unstarringLoading, setUnstarringLoading] = useState<string | null>(null);

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
          
          // Fetch saved opportunities
          const savedIds = userSnap.data().savedOpportunities || [];
          if (savedIds.length > 0) {
            await fetchSavedOpportunities(savedIds);
          }
        }

        try {
          const suggRef = doc(db, 'suggestions', user.uid);
          const suggSnap = await getDoc(suggRef);
          if (suggSnap.exists()) {
            setSuggestions(suggSnap.data().suggestions);
          }
        } catch (suggErr) {
          console.warn('Could not load suggestions:', suggErr);
          // Don't break the entire dashboard if suggestions fail
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, router]);

  const fetchSavedOpportunities = async (savedIds: string[]) => {
    setOpportunitiesLoading(true);
    try {
      const opportunitiesRef = collection(db, 'opportunities');
      const opportunities: SavedOpportunity[] = [];
      
      // Fetch each saved opportunity
      for (const id of savedIds) {
        const oppRef = doc(db, 'opportunities', id);
        const oppSnap = await getDoc(oppRef);
        if (oppSnap.exists()) {
          opportunities.push({
            id: oppSnap.id,
            ...oppSnap.data()
          } as SavedOpportunity);
        }
      }
      
      setSavedOpportunities(opportunities);
    } catch (error) {
      console.error('Error fetching saved opportunities:', error);
    } finally {
      setOpportunitiesLoading(false);
    }
  };

  const unstarOpportunity = async (opportunityId: string) => {
    if (!user) return;
    
    setUnstarringLoading(opportunityId);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        savedOpportunities: arrayRemove(opportunityId)
      });
      
      // Remove from local state
      setSavedOpportunities(prev => prev.filter(opp => opp.id !== opportunityId));
    } catch (error) {
      console.error('Error unstarring opportunity:', error);
      alert('Failed to remove opportunity');
    } finally {
      setUnstarringLoading(null);
    }
  };

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

          {/* CV Builder Section */}
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

          {/* Saved Opportunities Section */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <div className="flex items-center">
                  <Star className="h-6 w-6 text-yellow-400 mr-3" />
                  <h2 className="text-xl sm:text-2xl font-semibold text-white">Saved Opportunities</h2>
                </div>
                <Link href="/suggestions" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Find More Opportunities
                  </Button>
                </Link>
              </div>

              {opportunitiesLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-4" />
                  <p className="text-gray-300">Loading saved opportunities...</p>
                </div>
              ) : savedOpportunities.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {savedOpportunities.map((opportunity) => (
                    <div
                      key={opportunity.id}
                      className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 hover:bg-white/15 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold mb-1 line-clamp-2">
                            {opportunity.title}
                          </h3>
                          <p className="text-gray-300 text-sm mb-2">{opportunity.company}</p>
                        </div>
                        <button
                          onClick={() => unstarOpportunity(opportunity.id)}
                          disabled={unstarringLoading === opportunity.id}
                          className="p-1.5 rounded-full text-yellow-400 bg-yellow-400/20 hover:bg-yellow-400/30 transition-all duration-200 ml-3"
                        >
                          {unstarringLoading === opportunity.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          ) : (
                            <Star className="h-4 w-4 fill-current" />
                          )}
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap items-center text-gray-400 text-sm mb-3 gap-2 sm:gap-4">
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="truncate">{opportunity.location}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span className="truncate">{formatOpportunityDate(opportunity.created)}</span>
                        </div>
                        <div className="flex items-center">
                          <Briefcase className="h-3 w-3 mr-1" />
                          <span className="truncate">{opportunity.type}</span>
                        </div>
                      </div>

                      <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                        {opportunity.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 capitalize">
                          {opportunity.category}
                        </span>
                        <a
                          href={opportunity.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                        >
                          Apply Now
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No saved opportunities yet</p>
                  <Link href="/suggestions">
                    <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Find Opportunities
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Link href="/profile" className="w-full">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 h-[120px] flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">Edit Profile</h3>
                        <p className="text-blue-100 text-sm">Update your personal information</p>
                      </div>
                      <Edit className="h-6 w-6 text-white/80 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </Link>
                
                <Link href="/suggestions" className="w-full">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 h-[120px] flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">Suggestions</h3>
                        <p className="text-green-100 text-sm">Discover new career opportunities</p>
                      </div>
                      <Brain className="h-6 w-6 text-white/80 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </Link>
                
                <Link href="/cvscore" className="w-full">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 h-[120px] flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">CV Score</h3>
                        <p className="text-blue-100 text-sm">Get AI-powered CV analysis</p>
                      </div>
                      <BarChart3 className="h-6 w-6 text-white/80 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </Link>

                <Link href="/settings" className="w-full">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 h-[120px] flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">Settings</h3>
                        <p className="text-purple-100 text-sm">Manage account preferences</p>
                      </div>
                      <Settings className="h-6 w-6 text-white/80 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </Link>
                
                <div className="w-full">
                  <div className="bg-gradient-to-br from-red-500 to-pink-600 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 h-[120px] flex flex-col justify-center cursor-pointer" onClick={logout}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">Logout</h3>
                        <p className="text-red-100 text-sm">Sign out of your account</p>
                      </div>
                      <LogOut className="h-6 w-6 text-white/80 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
