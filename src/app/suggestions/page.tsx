'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Brain, 
  Briefcase, 
  Star, 
  Loader2, 
  RefreshCw,
  AlertCircle,
  Sparkles, 
  ArrowRight, 
  CheckCircle, 
  User, 
  GraduationCap, 
  Target, 
  MapPin, 
  ExternalLink, 
  Calendar 
} from 'lucide-react';
import { authenticatedFetch } from '@/lib/api-helper';
import Link from 'next/link';

interface Opportunity {
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

export default function SuggestionsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [opportunitiesLoading, setOpportunitiesLoading] = useState(false);
  const [starringLoading, setStarringLoading] = useState<string | null>(null);
  const [starredOpportunities, setStarredOpportunities] = useState<string[]>([]);
  const [extraContext, setExtraContext] = useState('');

  // Helper function to check if GPA is valid
  const isGPAValid = (gpa: string, scale: string) => {
    if (!gpa || !scale || scale === 'other') return true;
    
    const gpaValue = parseFloat(gpa);
    const maxScale = parseFloat(scale);
    
    if (isNaN(gpaValue)) return false;
    
    if (scale === '100') {
      return gpaValue >= 0 && gpaValue <= 100;
    }
    
    return gpaValue >= 0 && gpaValue <= maxScale;
  };

  const isGPARealisticallyValid = (gpa: string, scale: string) => {
    if (!gpa || !scale || scale === 'other') return true;
    
    const gpaValue = parseFloat(gpa);
    if (isNaN(gpaValue)) return false;
    
    if (scale === '100') {
      return gpaValue >= 1;
    }
    
    const maxScale = parseFloat(scale);
    const minimumGPA = maxScale * 0.25;
    
    return gpaValue >= minimumGPA;
  };

  const isProfileComplete = (profile: any) => {
    return profile.degree && 
           profile.gpa && 
           profile.interests && 
           profile.university &&
           isGPAValid(profile.gpa, profile.gpaScale || '4.0') &&
           isGPARealisticallyValid(profile.gpa, profile.gpaScale || '4.0');
  };

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

  // Fetch starred opportunities
  useEffect(() => {
    if (!user) return;
    const fetchStarredOpportunities = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().savedOpportunities) {
          setStarredOpportunities(userSnap.data().savedOpportunities);
        }
      } catch (error) {
        console.error('Error fetching starred opportunities:', error);
      }
    };
    fetchStarredOpportunities();
  }, [user]);

  const handleGenerate = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      let res;
      
      if (user) {
        // Use authenticated API call
        res = await authenticatedFetch('/api/suggestions', {
          method: 'POST',
          body: JSON.stringify({
            ...profile,
            interests: `${profile.interests || ''} ${extraContext || ''}`,
            uid: user ? (user as any).uid : undefined,
          }),
        });
      } else {
        // Fallback for non-authenticated users (shouldn't happen in normal flow)
        res = await fetch('/api/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...profile,
            interests: `${profile.interests || ''} ${extraContext || ''}`,
          }),
        });
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('Failed to generate suggestions:', err);
      alert('Failed to generate suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOpportunities = useCallback(async () => {
    if (!profile) return;
    setOpportunitiesLoading(true);
    try {
      let res;
      
      if (user) {
        // Use authenticated API call
        res = await authenticatedFetch('/api/opportunities', {
          method: 'POST',
          body: JSON.stringify({
            profile,
            limit: 8
          }),
        });
      } else {
        // Fallback for non-authenticated users
        res = await fetch('/api/opportunities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile,
            limit: 8
          }),
        });
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setOpportunities(data.opportunities || []);
    } catch (err) {
      console.error('Failed to fetch opportunities:', err);
    } finally {
      setOpportunitiesLoading(false);
    }
  }, [profile, user]);

  // Fetch opportunities when profile loads
  useEffect(() => {
    if (profile) {
      fetchOpportunities();
    }
  }, [profile, fetchOpportunities]);

  const toggleStarOpportunity = async (opportunityId: string) => {
    if (!user) return;
    
    setStarringLoading(opportunityId);
    try {
      const userRef = doc(db, 'users', user.uid);
      const isStarred = starredOpportunities.includes(opportunityId);
      
      if (isStarred) {
        // Remove from starred
        await updateDoc(userRef, {
          savedOpportunities: arrayRemove(opportunityId)
        });
        setStarredOpportunities(prev => prev.filter(id => id !== opportunityId));
      } else {
        // Add to starred
        await updateDoc(userRef, {
          savedOpportunities: arrayUnion(opportunityId)
        });
        setStarredOpportunities(prev => [...prev, opportunityId]);
      }
    } catch (error) {
      console.error('Error toggling star:', error);
      alert('Failed to save opportunity');
    } finally {
      setStarringLoading(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 85) return 'bg-green-500/20 border-green-400/30';
    if (score >= 70) return 'bg-yellow-500/20 border-yellow-400/30';
    return 'bg-orange-500/20 border-orange-400/30';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="mb-6">
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                Career <span className="text-blue-400">Suggestions</span>
              </h1>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Get AI-powered career recommendations and discover relevant opportunities tailored to your profile
              </p>
            </div>
          </div>

          {/* Profile Summary */}
          {profile && (
            <>
              {/* Check if profile is complete */}
              {!isProfileComplete(profile) ? (
                <Card className="bg-red-500/10 backdrop-blur-md border-red-400/30 shadow-2xl mb-8">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <AlertCircle className="h-6 w-6 text-red-400 mr-3" />
                      <h2 className="text-xl font-semibold text-white">Complete Your Profile</h2>
                    </div>
                    <div className="text-gray-300 mb-4">
                      <p className="mb-3">To generate personalized career suggestions, please complete your academic information:</p>
                      <ul className="space-y-2">
                        {!profile.university && <li className="flex items-center"><span className="text-red-400 mr-2">•</span> University</li>}
                        {!profile.degree && <li className="flex items-center"><span className="text-red-400 mr-2">•</span> Degree</li>}
                        {!profile.gpa && <li className="flex items-center"><span className="text-red-400 mr-2">•</span> GPA</li>}
                        {profile.gpa && (!isGPAValid(profile.gpa, profile.gpaScale || '4.0') || !isGPARealisticallyValid(profile.gpa, profile.gpaScale || '4.0')) && (
                          <li className="flex items-center"><span className="text-red-400 mr-2">•</span> Valid GPA (current GPA appears invalid)</li>
                        )}
                        {!profile.interests && <li className="flex items-center"><span className="text-red-400 mr-2">•</span> Interests</li>}
                      </ul>
                    </div>
                    <Link href="/profile">
                      <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300">
                        Complete Profile
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
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
                        <span>
                          {profile.gpa}
                          {profile.gpaScale && profile.gpaScale !== '4.0' && (
                            <span className="text-gray-400 text-sm ml-1">
                              (out of {profile.gpaScale})
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-blue-300 mr-2">Interests:</span>
                        <span className="text-gray-300">{profile.interests}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Input Section */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl mb-8">
            <CardContent className="p-6">
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <Sparkles className="h-5 w-5 text-green-400 mr-2" />
                  <p className="text-green-400 text-sm font-medium">Suggestions are based on your profile</p>
                </div>
                <div className="mb-6">
                  <label className="block text-white font-medium mb-2">
                    <Sparkles className="inline h-4 w-4 mr-2 text-blue-400" />
                    Extra Context (Optional)
                  </label>
                  <p className="text-orange-300 text-sm">Add extra context for more specific results</p>
                </div>
                <textarea
                  className="w-full p-4 rounded-lg bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 resize-none"
                  rows={4}
                  placeholder="e.g., I'm particularly interested in remote work, or I want to focus on AI/ML roles..."
                  value={extraContext}
                  onChange={(e) => setExtraContext(e.target.value)}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  onClick={handleGenerate}
                  disabled={loading || !profile || !isProfileComplete(profile)}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Brain className="h-5 w-5 mr-2" />
                      {(!profile || !isProfileComplete(profile)) 
                        ? 'Complete Profile First' 
                        : 'Generate Suggestions'
                      }
                    </div>
                  )}
                </Button>

                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300"
                  >
                    View Saved Opportunities
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* AI Suggestions Results */}
            {suggestions.length > 0 && (
              <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center mb-6">
                    <Brain className="h-6 w-6 text-green-400 mr-3" />
                    <h2 className="text-2xl font-semibold text-white">AI Career Suggestions</h2>
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

            {/* Matched Opportunities */}
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <Briefcase className="h-6 w-6 text-blue-400 mr-3" />
                    <h2 className="text-2xl font-semibold text-white">Matched Opportunities</h2>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchOpportunities}
                    disabled={opportunitiesLoading}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    {opportunitiesLoading ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </div>

                {opportunitiesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                    <p className="text-gray-300">Finding relevant opportunities...</p>
                  </div>
                ) : opportunities.length > 0 ? (
                  <div className="space-y-4">
                    {opportunities.map((opportunity) => {
                      const isStarred = starredOpportunities.includes(opportunity.id);
                      return (
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
                            <div className="flex items-center space-x-2 ml-3">
                              <div className={`px-2 py-1 rounded-full text-xs font-semibold border ${getScoreBgColor(opportunity.score)} ${getScoreColor(opportunity.score)}`}>
                                {opportunity.score}%
                              </div>
                              <button
                                onClick={() => toggleStarOpportunity(opportunity.id)}
                                disabled={starringLoading === opportunity.id}
                                className={`p-1.5 rounded-full transition-all duration-200 ${
                                  isStarred 
                                    ? 'text-yellow-400 bg-yellow-400/20 hover:bg-yellow-400/30' 
                                    : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/20'
                                }`}
                              >
                                {starringLoading === opportunity.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                ) : (
                                  <Star className={`h-4 w-4 ${isStarred ? 'fill-current' : ''}`} />
                                )}
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center text-gray-400 text-sm mb-3 space-x-4">
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {opportunity.location}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(opportunity.created)}
                            </div>
                            <div className="flex items-center">
                              <Star className="h-3 w-3 mr-1" />
                              {opportunity.type}
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
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No relevant opportunities found</p>
                    <p className="text-gray-500 text-sm mt-2">Try updating your profile or check back later</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
