'use client';

/**
 * Profile Page - CV Score Management
 * 
 * CRITICAL: This page implements a conservative CV score refresh strategy to prevent
 * overwriting recently updated scores from CV scoring operations.
 * 
 * Key Principles:
 * 1. NEVER automatically refresh CV scores unless absolutely necessary
 * 2. Respect cvScoreTimestamp to prevent overwriting recent updates
 * 3. Only recalculate scores when no score exists at all
 * 4. Manual refresh only when user explicitly requests it
 * 5. Preserve most recent CV scores across profile operations
 * 
 * This prevents the score reversion issues that were occurring when
 * the profile page aggressively refreshed scores on navigation.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '../../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { User, GraduationCap, Star, Save, Upload, Loader2, Target, Edit3 } from 'lucide-react';
import { Dialog } from "@/components/ui/dialog";
import GamifiedProfileDisplay from '@/components/GamifiedProfileDisplay';
import { calculateProfileCompletion } from '@/lib/profile-completion';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    university: '',
    degree: '',
    gpa: '',
    gpaScale: '4.0',
    interests: '',
    uploadedCVName: null as string | null,
    bio: '',
    city: '',
    country: '',
    age: '',
    preferredIndustries: '',
    portfolioLinks: '',
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cvText, setCvText] = useState("");
  const [showCVText, setShowCVText] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [removeSuccess, setRemoveSuccess] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [cvScore, setCvScore] = useState<number | string | null>(null);
  const [cvScoreTimestamp, setCvScoreTimestamp] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'edit'>('profile');
  // Drives the "Paths Progress" component of the Gradual Rating.
  const [pathProgresses, setPathProgresses] = useState<{ progressPercent: number }[]>([]);

  // Load profile data once when component mounts
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    
    const fetchProfile = async () => {
      try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          console.log('Profile loaded - CV Score from Firestore:', data.cvScore);
          
          // Update form data with all fields from Firestore
          setFormData(prev => ({ 
            ...prev, 
            ...data,
            // Ensure all required fields are present
            fullName: data.fullName || '',
            university: data.university || '',
            degree: data.degree || '',
            gpa: data.gpa || '',
            gpaScale: data.gpaScale || '4.0',
            interests: data.interests || '',
            bio: data.bio || '',
            city: data.city || '',
            country: data.country || '',
            age: data.age || '',
            preferredIndustries: data.preferredIndustries || '',
            portfolioLinks: data.portfolioLinks || '',
            uploadedCVName: data.uploadedCVName || null,
          }));
          
          setCvText(data.cvText || "");
          setCvScoreTimestamp(data.cvScoreTimestamp || null);
          
          // Get the latest CV score - try multiple sources
          let latestCvScore = data.cvScore || null;
          
          // Handle legacy CV scores that might be stored as text strings
          if (typeof latestCvScore === 'string' && latestCvScore.includes('Overall Score')) {
            if (latestCvScore.trim()) {
              const scoreMatch = latestCvScore.match(/Overall Score \(0–100\): (\d+)/);
              if (scoreMatch) {
                const numericalScore = parseInt(scoreMatch[1]);
                console.log('Converting legacy text CV score to number:', latestCvScore, '->', numericalScore);
                latestCvScore = numericalScore;
                
                // Update the stored score to be numerical
                await setDoc(ref, { cvScore: numericalScore }, { merge: true });
              }
            }
          }
          
          // Debug: Log what we found in the profile data
          console.log('Profile data found:', {
            cvScore: data.cvScore,
            cvText: data.cvText ? `${data.cvText.substring(0, 100)}...` : 'No CV text',
            hasCVText: !!data.cvText,
            cvTextLength: data.cvText ? data.cvText.length : 0
          });
          
          // CRITICAL: Only recalculate CV score if absolutely none exists
          // AND if the CV score wasn't recently updated (within last 10 minutes)
          // This prevents overwriting recently updated scores from CV scoring operations.
          // Handle both Firestore Timestamps (have .toDate()) and plain strings/Dates.
          const tsMs = (() => {
            const ts = data.cvScoreTimestamp;
            if (!ts) return null;
            if (typeof (ts as any).toDate === 'function') return (ts as any).toDate().getTime();
            const d = new Date(ts);
            return isNaN(d.getTime()) ? null : d.getTime();
          })();
          const hasRecentScore = tsMs !== null && (new Date().getTime() - tsMs) < 10 * 60 * 1000; // 10 minutes
          
          if (data.cvText && data.cvText.trim() !== '' && 
              (data.cvScore === null || data.cvScore === undefined) && 
              !hasRecentScore) {
            try {
              console.log('No CV score found at all, calculating from CV text...');
              const response = await fetch('/api/score', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${await user.getIdToken()}`
                },
                body: JSON.stringify({ cvText: data.cvText })
              });
              
              if (response.ok) {
                const result = await response.json();
                console.log('CV scoring API response:', result);
                
                // Extract score from the response (format: "Overall Score (0–100): 86")
                if (result.score && typeof result.score === 'string') {
                  const scoreMatch = result.score.match(/Overall Score \(0–100\): (\d+)/);
                  if (scoreMatch) {
                    const newScore = parseInt(scoreMatch[1]);
                    console.log('Extracted CV score:', newScore);
                    
                    // Update the score in the profile
                    latestCvScore = newScore;
                    await setDoc(ref, { 
                      cvScore: newScore,
                      cvScoreAnalysis: result.score // Save the full analysis text
                    }, { merge: true });
                    console.log('CV score saved to profile:', newScore);
                  } else {
                    console.log('Could not extract score from API response:', result.score);
                  }
                } else {
                  console.log('Invalid score format in API response:', result.score);
                }
              } else {
                console.log('CV scoring API failed:', response.status, response.statusText);
              }
            } catch (scoreErr) {
              console.error('Error fetching CV score:', scoreErr);
            }
          } else {
            if (hasRecentScore) {
              console.log('CV score exists and was recently updated, no recalculation needed');
            } else {
              console.log('CV score already exists, no recalculation needed');
            }
          }
          
          console.log('Final CV score to set:', latestCvScore);
          setCvScore(latestCvScore);
          
          // Debug: Log when CV score state changes
          console.log('Profile page CV score state updated to:', latestCvScore);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [user, authLoading, router]);

  // Pull path enrollments so the "Paths Progress" component of the Gradual
  // Rating reflects real progress instead of always reading 0. Goes through
  // /api/paths (server-side, Admin SDK) — direct client reads on the
  // path_state subcollection are blocked by Firestore rules.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/paths', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          paths?: { isEnrolled: boolean; progressPercent: number }[];
        };
        const enrolled = (data.paths ?? []).filter((p) => p.isEnrolled);
        if (!cancelled) {
          setPathProgresses(enrolled.map((p) => ({ progressPercent: p.progressPercent })));
        }
      } catch (e) {
        console.error('[profile] failed to load path progresses', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    // Validation for required fields
    if (!formData.fullName || !formData.university || !formData.degree || !formData.gpa || !formData.interests || !formData.city || !formData.country) {
      setError('Please fill in all required fields: Full Name, University, Degree, GPA, Interests, City, and Country.');
      return;
    }
    
    // Validate GPA doesn't exceed scale
    if (!isGPAValid(formData.gpa, formData.gpaScale)) {
      if (formData.gpaScale === '100') {
        setError(`Your GPA (${formData.gpa}%) must be between 0 and 100.`);
      } else {
        setError(`Your GPA (${formData.gpa}) exceeds the maximum for a ${formData.gpaScale} scale. Please enter a valid GPA.`);
      }
      return;
    }
    
    // Validate GPA is realistically valid (not too low)
    if (!isGPARealisticallyValid(formData.gpa, formData.gpaScale)) {
      if (formData.gpaScale === '100') {
        setError(`Your GPA (${formData.gpa}%) seems unrealistically low. Please lock in.`);
      } else {
        setError(`Your GPA (${formData.gpa}) seems unrealistically low for a ${formData.gpaScale} scale. Please lock in.`);
      }
      return;
    }
    
    setSaving(true);
    setError(''); // Clear any previous errors
    
    try {
      let extractedText = cvText;
      if (cvFile) {
        // Extract text from PDF
        const formDataFile = new FormData();
        formDataFile.append('file', cvFile);
        const res = await fetch('/api/extract-pdf', {
          method: 'POST',
          body: formDataFile,
        });
        if (!res.ok) throw new Error('Failed to extract text from PDF');
        const data = await res.json();
        extractedText = data.text || "";
        setCvText(extractedText);
      }
      
      const { ...dataWithoutFile } = formData;
      await setDoc(
        doc(db, 'users', user.uid),
        {
          ...dataWithoutFile,
          updatedAt: new Date(),
          uploadedCVName: cvFile?.name || formData.uploadedCVName || null,
          cvText: extractedText,
        },
        { merge: true }
      );
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Clear the file input after successful save
      setCvFile(null);
      
      // Switch back to profile tab after saving
      setActiveTab('profile');
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCV = async () => {
    if (!user) return;
    setRemoveLoading(true);
    setRemoveSuccess("");
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          uploadedCVName: null,
          cvText: "",
          cvScore: null,
          cvScoreTimestamp: null,
        },
        { merge: true }
      );
      setCvFile(null);
      setCvText("");
      setCvScore(null);
      setCvScoreTimestamp(null);
      setFormData(prev => ({ ...prev, uploadedCVName: null }));
      setRemoveSuccess("CV removed successfully.");
      setTimeout(() => setRemoveSuccess(""), 3000);
    } catch (err) {
      console.error('Error removing CV:', err);
      setError('Failed to remove CV.');
    } finally {
      setRemoveLoading(false);
    }
  };

  // Manual CV score refresh function - ONLY for user-initiated refreshes
  const handleRefreshCVScore = async () => {
    if (!user || !cvText) return;
    
    // CRITICAL: Check if we have a recent score to prevent unnecessary overwrites
    const refreshTsMs = (() => {
      const ts = cvScoreTimestamp;
      if (!ts) return null;
      if (typeof (ts as any).toDate === 'function') return (ts as any).toDate().getTime();
      const d = new Date(ts);
      return isNaN(d.getTime()) ? null : d.getTime();
    })();
    const hasRecentScore = refreshTsMs !== null && (new Date().getTime() - refreshTsMs) < 10 * 60 * 1000; // 10 minutes

    if (hasRecentScore) {
      console.log('CV score was recently updated, manual refresh not needed');
      setError('CV score was recently updated. No refresh needed.');
      return;
    }
    
    try {
      console.log('Manually refreshing CV score...');
      const response = await fetch('/api/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({ cvText: cvText })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Manual CV scoring response:', result);
        
        if (result.score && typeof result.score === 'string') {
          const scoreMatch = result.score.match(/Overall Score \(0–100\): (\d+)/);
          if (scoreMatch) {
            const newScore = parseInt(scoreMatch[1]);
            console.log('Manual CV score extracted:', newScore);
            
            // Only update if the score has actually changed
            if (newScore !== cvScore) {
              console.log(`CV score updated from ${cvScore} to ${newScore}`);
              
              // Save to profile with timestamp
              const ref = doc(db, 'users', user.uid);
              await setDoc(ref, { 
                cvScore: newScore,
                cvScoreTimestamp: new Date()
              }, { merge: true });
              
              // Update local state
              setCvScore(newScore);
              setCvScoreTimestamp(new Date());
              setShowSuccess(true);
              setTimeout(() => setShowSuccess(false), 3000);
            } else {
              console.log('CV score unchanged, no update needed');
            }
          }
        }
      }
    } catch (err) {
      console.error('Manual CV score refresh failed:', err);
      setError('Failed to refresh CV score.');
    }
  };

  // Helper function to calculate GPA percentage
  const calculateGPAPercentage = (gpa: number, scale: string) => {
    if (scale === '100') {
      return Math.round(gpa);
    }
    if (scale === 'other') {
      return null; // Don't calculate percentage for other scales
    }
    
    const gpaValue = parseFloat(gpa.toString());
    if (isNaN(gpaValue) || gpaValue < 0) return 0;

    const maxScale = parseFloat(scale);
    
    let percentage: number;
    switch (scale) {
      case '4.0':
        percentage = (gpaValue / 4.0) * 100;
        break;
      case '5.0':
        percentage = (gpaValue / 5.0) * 100;
        break;
      case '7.0':
        percentage = (gpaValue / 7.0) * 100;
        break;
      case '9.0':
        percentage = (gpaValue / 9.0) * 100;
        break;
      case '10.0':
        percentage = (gpaValue / 10.0) * 100;
        break;
      default:
        percentage = gpaValue;
    }
    
    return Math.round(Math.min(percentage, 100));
  };

  // Helper function to check if GPA exceeds scale
  const isGPAValid = (gpa: string, scale: string) => {
    if (!gpa || !scale || scale === 'other') return true;
    
    const gpaValue = parseFloat(gpa);
    const maxScale = parseFloat(scale);
    
    // Check if GPA is a valid number
    if (isNaN(gpaValue)) return false;
    
    // For percentage scale, check 0-100 range
    if (scale === '100') {
      return gpaValue >= 0 && gpaValue <= 100;
    }
    
    // For other scales, check minimum of 0 and maximum of scale
    // But realistically, GPAs below 1.0 are unusual, so we'll flag them
    return gpaValue >= 0 && gpaValue <= maxScale;
  };

  // Helper function to check if GPA is unrealistically low
  const isGPARealisticallyValid = (gpa: string, scale: string) => {
    if (!gpa || !scale || scale === 'other') return true;
    
    const gpaValue = parseFloat(gpa);
    if (isNaN(gpaValue)) return false;
    
    // For percentage scale, minimum should be reasonable (at least 1%)
    if (scale === '100') {
      return gpaValue >= 1;
    }
    
    // For other scales, minimum should be at least equivalent to ~25% performance
    const maxScale = parseFloat(scale);
    const minimumGPA = maxScale * 0.25; // 25% of the scale
    
    return gpaValue >= minimumGPA;
  };

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-6 w-6 text-[var(--accent-blue)] animate-spin mx-auto mb-3" />
        <p className="text-sm text-[var(--text-muted)]">Loading...</p>
      </div>
    </div>
  );

  if (!user) return null;

  // Calculate profile completion
  const completionPercent = calculateProfileCompletion(formData as unknown as Record<string, unknown>);

  return (
    <div className="min-h-screen">
      <div className="page-container max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">Profile</h1>
          <p className="text-[var(--text-muted)] text-sm">Your career profile and Gradual rating</p>
          {!loading && (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-subtle)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${completionPercent}%`,
                    backgroundColor: completionPercent >= 80 ? 'var(--success)' : completionPercent >= 50 ? 'var(--accent-blue)' : 'var(--warning)',
                  }}
                />
              </div>
              <span className="text-xs font-medium text-[var(--text-muted)] shrink-0">{completionPercent}% complete</span>
            </div>
          )}
        </div>

        {/* Success Toast */}
        {showSuccess && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 surface-card-elevated px-5 py-2.5 rounded-xl text-sm font-medium text-[var(--success)]">
            Profile saved
          </div>
        )}

        {/* Tab Navigation */}
        {!loading && (
          <div className="mb-6">
            <div className="inline-flex surface-card-subtle rounded-lg p-1 gap-0.5">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'profile'
                    ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-sm)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <Target className="h-4 w-4 mr-2" />
                Scorecard
              </button>
              <button
                onClick={() => setActiveTab('edit')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'edit'
                    ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-sm)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {!loading && (
          <>
            {activeTab === 'profile' && (
              <GamifiedProfileDisplay
                formData={formData}
                cvScore={cvScore}
                pathProgresses={pathProgresses}
                onEditProfile={() => setActiveTab('edit')}
                onViewCV={() => setShowCVText(true)}
              />
            )}

            {activeTab === 'edit' && (
              <div className="max-w-3xl mx-auto">
                <div className="surface-card rounded-2xl overflow-hidden">
                  <div className="p-6 sm:p-8">
                    {error && (
                      <div className="mb-6 px-4 py-3 bg-[var(--danger-soft)] border border-[var(--danger)]/20 rounded-xl">
                        <p className="text-[var(--danger)] text-sm">{error}</p>
                      </div>
                    )}
                    
                    <div className="space-y-8">
                      {/* Personal Information */}
                      <div className="space-y-4">
                        <div className="flex items-center mb-1">
                          <User className="h-5 w-5 text-[var(--text-muted)] mr-2.5" />
                          <h2 className="text-base font-medium text-[var(--foreground)]">Personal Information</h2>
                        </div>
                        <div>
                          <label className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">
                            Full Name <span className="text-red-400">*</span>
                          </label>
                          <Input
                            className="bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:ring-[var(--accent-blue)]/20 rounded-xl h-11"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                          />
                        </div>
                        <div>
                          <label className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">
                            Bio
                          </label>
                          <textarea
                            className="w-full p-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:ring-[var(--accent-blue)]/20 resize-none text-sm"
                            rows={3}
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="A brief summary of your background and goals"
                          />
                        </div>
                        <div className="grid md:grid-cols-3 gap-3">
                          <div>
                            <label className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">
                              City <span className="text-red-400">*</span>
                            </label>
                            <Input
                              className="bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:ring-[var(--accent-blue)]/20 rounded-xl h-11"
                              name="city"
                              value={formData.city}
                              onChange={handleChange}
                              placeholder="Your city"
                            />
                          </div>
                          <div>
                            <label className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">
                              Country <span className="text-red-400">*</span>
                            </label>
                            <Input
                              className="bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:ring-[var(--accent-blue)]/20 rounded-xl h-11"
                              name="country"
                              value={formData.country}
                              onChange={handleChange}
                              placeholder="Your country"
                            />
                          </div>
                          <div>
                            <label className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">
                              Age
                            </label>
                            <Input
                              className="bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:ring-[var(--accent-blue)]/20 rounded-xl h-11"
                              name="age"
                              value={formData.age}
                              onChange={handleChange}
                              placeholder="Optional"
                              type="number"
                              min="0"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[var(--border)]" />

                      {/* Academic Information */}
                      <div className="space-y-4">
                        <div className="flex items-center mb-1">
                          <GraduationCap className="h-5 w-5 text-[var(--text-muted)] mr-2.5" />
                          <h2 className="text-base font-medium text-[var(--foreground)]">Academic Information</h2>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <label className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">
                              University <span className="text-red-400">*</span>
                            </label>
                            <Input
                              className="bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:ring-[var(--accent-blue)]/20 rounded-xl h-11"
                              name="university"
                              value={formData.university}
                              onChange={handleChange}
                              placeholder="Your university"
                              required
                            />
                          </div>
                          <div>
                            <label className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">
                              Degree <span className="text-red-400">*</span>
                            </label>
                            <Input
                              className="bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:ring-[var(--accent-blue)]/20 rounded-xl h-11"
                              name="degree"
                              value={formData.degree}
                              onChange={handleChange}
                              placeholder="e.g., Bachelor of Computer Science"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <label className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">
                              GPA <span className="text-red-400">*</span>
                            </label>
                            <div className="space-y-2.5">
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  className="bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:ring-[var(--accent-blue)]/20 rounded-xl h-11"
                                  name="gpa"
                                  value={formData.gpa}
                                  onChange={handleChange}
                                  placeholder="e.g., 3.7"
                                  required
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max={formData.gpaScale === '100' ? '100' : formData.gpaScale === 'other' ? undefined : formData.gpaScale}
                                />
                                <select
                                  className="bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--foreground)] focus:border-[var(--accent-blue)] rounded-xl px-3 py-2 text-sm"
                                  name="gpaScale"
                                  value={formData.gpaScale || '4.0'}
                                  onChange={handleChange}
                                >
                                  <option value="4.0" className="bg-[var(--surface)]">4.0 Scale</option>
                                  <option value="5.0" className="bg-[var(--surface)]">5.0 Scale</option>
                                  <option value="7.0" className="bg-[var(--surface)]">7.0 Scale</option>
                                  <option value="9.0" className="bg-[var(--surface)]">9.0 Scale</option>
                                  <option value="10.0" className="bg-[var(--surface)]">10.0 Scale</option>
                                  <option value="100" className="bg-[var(--surface)]">Percentage</option>
                                  <option value="other" className="bg-[var(--surface)]">Other</option>
                                </select>
                              </div>
                              <p className="text-xs text-[var(--text-muted)]">
                                4.0 (USA, Canada), 5.0 (Australia), 7.0 (Australia), 9.0 (NZ), 10.0 (Europe, India)
                              </p>
                              {(!isGPAValid(formData.gpa, formData.gpaScale) || !isGPARealisticallyValid(formData.gpa, formData.gpaScale)) && formData.gpa && (
                                <div className="bg-[var(--danger-soft)] border border-[var(--danger)]/20 rounded-xl p-3">
                                  <span className="text-[var(--danger)] text-sm">
                                    {!isGPAValid(formData.gpa, formData.gpaScale) ? (
                                      formData.gpaScale === '100' 
                                        ? `GPA (${formData.gpa}%) must be between 0 and 100.`
                                        : `GPA (${formData.gpa}) exceeds the ${formData.gpaScale} scale maximum.`
                                    ) : (
                                      `GPA (${formData.gpa}) seems unrealistically low for a ${formData.gpaScale} scale.`
                                    )}
                                  </span>
                                </div>
                              )}
                              {isGPAValid(formData.gpa, formData.gpaScale) && isGPARealisticallyValid(formData.gpa, formData.gpaScale) && formData.gpa && formData.gpaScale && formData.gpaScale !== 'other' && calculateGPAPercentage(parseFloat(formData.gpa) || 0, formData.gpaScale) !== null && (
                                <div className="bg-[var(--accent-blue-soft)] border border-[var(--accent-blue)]/20 rounded-xl p-3">
                                  <p className="text-[var(--accent-blue)] text-sm">
                                    Gradual reads this as <span className="font-semibold">{calculateGPAPercentage(parseFloat(formData.gpa) || 0, formData.gpaScale)}%</span> performance
                                  </p>
                                </div>
                              )}
                              {formData.gpaScale === 'other' && (
                                <div className="bg-[var(--warning-soft)] border border-[var(--warning)]/20 rounded-xl p-3">
                                  <p className="text-[var(--warning)] text-sm">
                                    Use percentage (0-100) for the most accurate suggestions.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">
                              Interests <span className="text-red-400">*</span>
                            </label>
                            <Input
                              className="bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:ring-[var(--accent-blue)]/20 rounded-xl h-11"
                              name="interests"
                              value={formData.interests}
                              onChange={handleChange}
                              placeholder="e.g., AI, Machine Learning, Web Dev"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[var(--border)]" />

                      {/* Industries & Portfolio */}
                      <div className="space-y-4">
                        <div className="flex items-center mb-1">
                          <Star className="h-5 w-5 text-[var(--text-muted)] mr-2.5" />
                          <h2 className="text-base font-medium text-[var(--foreground)]">Industries & Portfolio</h2>
                        </div>
                        <div>
                          <label className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">
                            Preferred Industries
                          </label>
                          <Input
                            className="bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:ring-[var(--accent-blue)]/20 rounded-xl h-11"
                            name="preferredIndustries"
                            value={formData.preferredIndustries}
                            onChange={handleChange}
                            placeholder="e.g., Software, AI, Finance"
                          />
                        </div>
                        <div>
                          <label className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">
                            Portfolio / LinkedIn / GitHub
                          </label>
                          <Input
                            className="bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:ring-[var(--accent-blue)]/20 rounded-xl h-11"
                            name="portfolioLinks"
                            value={formData.portfolioLinks}
                            onChange={handleChange}
                            placeholder="Paste links, comma separated"
                          />
                        </div>
                      </div>

                      <div className="border-t border-[var(--border)]" />

                      {/* CV Upload */}
                      <div className="space-y-4">
                        <div className="flex items-center mb-1">
                          <Upload className="h-5 w-5 text-[var(--text-muted)] mr-2.5" />
                          <h2 className="text-base font-medium text-[var(--foreground)]">CV Upload</h2>
                        </div>
                        
                        {formData.uploadedCVName ? (
                          <div className="flex items-center justify-between p-3.5 surface-card-subtle rounded-xl">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[var(--accent-blue-soft)] flex items-center justify-center shrink-0">
                                <Upload className="h-4 w-4 text-[var(--accent-blue)]" />
                              </div>
                              <span className="text-sm text-[var(--foreground)] truncate">{formData.uploadedCVName}</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="shrink-0 bg-transparent border-[var(--danger)]/20 text-[var(--danger)] hover:bg-[var(--danger-soft)] rounded-lg text-xs h-8"
                              onClick={handleRemoveCV}
                              disabled={removeLoading}
                            >
                              {removeLoading ? "..." : "Remove"}
                            </Button>
                          </div>
                        ) : (
                          <p className="text-[var(--text-muted)] text-sm">No CV uploaded yet.</p>
                        )}
                        {removeSuccess && (
                          <p className="text-[var(--success)] text-sm">{removeSuccess}</p>
                        )}
                        {cvScore && (
                          <div className="px-3.5 py-2.5 bg-[var(--success-soft)] border border-[var(--success)]/20 rounded-xl">
                            <span className="text-[var(--success)] text-sm">CV Score: <span className="font-semibold">{cvScore}/100</span></span>
                          </div>
                        )}
                        <div className="relative">
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={removeLoading}
                          />
                          <div className="border border-dashed border-[var(--border)] rounded-xl p-5 text-center hover:border-[var(--accent-blue)]/50 transition-colors duration-200">
                            <Upload className="h-5 w-5 text-[var(--text-muted)] mx-auto mb-2" />
                            <p className="text-[var(--text-muted)] text-sm">
                              {cvFile ? cvFile.name : 'Upload CV (PDF)'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="pt-2">
                        <Button
                          className="w-full h-11 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-strong)] text-white font-medium rounded-xl transition-all duration-200"
                          onClick={handleSave}
                          disabled={saving}
                        >
                          {saving ? (
                            <span className="flex items-center">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Saving...
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <Save className="h-4 w-4 mr-2" />
                              Save Profile
                            </span>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* CV Text Dialog */}
        <Dialog open={showCVText} onOpenChange={setShowCVText}>
          <Dialog.Content>
            <Dialog.Title className="text-[var(--foreground)] font-semibold text-lg">CV Text</Dialog.Title>
            <div className="max-h-96 overflow-y-auto whitespace-pre-wrap text-[var(--text-secondary)] surface-card-subtle p-4 rounded-lg text-sm leading-relaxed">
              {cvText || "No CV text saved."}
            </div>
            <Dialog.Close asChild>
              <Button className="mt-4" onClick={() => setShowCVText(false)}>Close</Button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog>
      </div>
    </div>
  );
}
