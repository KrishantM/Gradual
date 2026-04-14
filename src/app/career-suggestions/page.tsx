'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  AlertCircle,
  Sparkles, 
  User, 
  GraduationCap
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function CareerSuggestionsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [savedSuggestions, setSavedSuggestions] = useState<string>('');
  const [loading, setLoading] = useState(false);
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

  // Fetch saved suggestions
  useEffect(() => {
    if (!user) return;
    const fetchSavedSuggestions = async () => {
      try {
        const suggestionsRef = doc(db, 'suggestions', user.uid);
        const suggestionsSnap = await getDoc(suggestionsRef);
        if (suggestionsSnap.exists() && suggestionsSnap.data().suggestions) {
          setSavedSuggestions(suggestionsSnap.data().suggestions);
        }
      } catch (error) {
        console.error('Error fetching saved suggestions:', error);
      }
    };
    fetchSavedSuggestions();
  }, [user]);

  const handleGenerate = async () => {
    if (!profile || !user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...profile,
          interests: `${profile.interests || ''} ${extraContext || ''}`,
          uid: user.uid,
        }),
      });

      const data = await response.json();

      if (response.ok && data.suggestions) {
        setSuggestions(data.suggestions || []);
        
        // Refresh saved suggestions
        const suggestionsRef = doc(db, 'suggestions', user.uid);
        const suggestionsSnap = await getDoc(suggestionsRef);
        if (suggestionsSnap.exists() && suggestionsSnap.data().suggestions) {
          setSavedSuggestions(suggestionsSnap.data().suggestions);
        }
      } else {
        console.error('Failed to generate suggestions:', data.error || 'Unknown error');
        alert('Failed to generate suggestions. Please try again.');
      }
    } catch (err) {
      console.error('Failed to generate suggestions:', err);
      alert('Failed to generate suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="page-container">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            className="page-header"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="page-title">
              <span className="text-[var(--accent-blue)]">Career Suggestions</span>
            </h1>
            <p className="page-subtitle">
              Get AI-powered career recommendations tailored to your profile
            </p>
          </motion.div>

          {/* Profile Summary */}
          {profile && (
            <>
              {/* Check if profile is complete */}
              {!isProfileComplete(profile) ? (
                <Card className="border-[var(--danger)]/30 bg-[var(--danger-soft)] section-gap">
                  <CardContent className="p-5">
                    <div className="flex items-center mb-3">
                      <AlertCircle className="h-5 w-5 text-[var(--danger)] mr-2" />
                      <h2 className="text-lg font-semibold">Complete Your Profile</h2>
                    </div>
                    <div className="text-sm text-[var(--text-muted)] mb-4">
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
                <Card className="surface-card section-gap">
                  <CardContent className="p-5">
                    <div className="flex items-center mb-4">
                      <User className="h-5 w-5 text-[var(--accent-blue)] mr-2.5" />
                      <h2 className="text-lg font-semibold">Your Profile Summary</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center">
                        <span className="font-medium text-[var(--accent-blue)] mr-2">Name:</span>
                        <span className="text-[var(--text-secondary)]">{profile.fullName}</span>
                      </div>
                      <div className="flex items-center">
                        <GraduationCap className="h-4 w-4 text-[var(--accent-blue)] mr-2" />
                        <span className="font-medium text-[var(--accent-blue)] mr-2">University:</span>
                        <span className="text-[var(--text-secondary)]">{profile.university}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium text-[var(--accent-blue)] mr-2">Degree:</span>
                        <span className="text-[var(--text-secondary)]">{profile.degree}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium text-[var(--accent-blue)] mr-2">GPA:</span>
                        <span className="text-[var(--text-secondary)]">
                          {profile.gpa}
                          {profile.gpaScale && profile.gpaScale !== '4.0' && (
                            <span className="text-[var(--text-muted)] text-xs ml-1">
                              (out of {profile.gpaScale})
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-[var(--accent-blue)] mr-2">Interests:</span>
                        <span className="text-[var(--text-secondary)]">{profile.interests}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Career Suggestions Content */}
          <Card className="surface-card">
            <CardContent className="p-5">
              <div className="flex items-center mb-5">
                <Brain className="h-5 w-5 text-[var(--accent-blue)] mr-2.5" />
                <h2 className="text-lg font-semibold">AI Career Suggestions</h2>
              </div>

              {/* Extra Context Section */}
              <div className="mb-5">
                <div className="flex items-center mb-3">
                  <Sparkles className="h-4 w-4 text-[var(--accent-blue)] mr-2" />
                  <p className="text-[var(--accent-blue)] text-sm font-medium">Suggestions are based on your profile</p>
                </div>
                <div className="mb-4">
                  <label className="block font-medium text-sm mb-2">
                    <Sparkles className="inline h-4 w-4 mr-1.5 text-[var(--accent-blue)]" />
                    Extra Context (Optional)
                  </label>
                  <p className="text-[var(--text-muted)] text-sm mb-3">Add extra context for more specific results</p>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    placeholder="e.g., I'm particularly interested in remote work, or I want to focus on AI/ML roles..."
                    value={extraContext}
                    onChange={(e) => setExtraContext(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-strong)] text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleGenerate}
                  disabled={loading || !profile || !isProfileComplete(profile)}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Brain className="h-5 w-5 mr-2" />
                      {(!profile || !isProfileComplete(profile))
                        ? 'Complete Profile First'
                        : 'Generate Suggestions'
                      }
                    </div>
                  )}
                </Button>
              </div>

              {suggestions.length > 0 && (
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="feedback-card"
                    >
                      <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap text-sm">
                        {suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

