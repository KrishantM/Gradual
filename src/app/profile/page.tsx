'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '../../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { User, GraduationCap, BookOpen, Star, Save, Upload, Loader2 } from 'lucide-react';
import { Dialog } from "@/components/ui/dialog" // If you have a dialog/modal component

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
          setFormData(prev => ({ ...prev, ...snap.data() }));
          setCvText(snap.data().cvText || "");
        }
      } catch (err) {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user, authLoading, router]);

  const handleChange = (e: any) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
    } catch (err) {
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
        },
        { merge: true }
      );
      setCvFile(null);
      setCvText("");
      setRemoveSuccess("CV removed successfully.");
      setTimeout(() => setRemoveSuccess(""), 3000);
    } catch (err) {
      setError('Failed to remove CV.');
    } finally {
      setRemoveLoading(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-4" />
        <p className="text-gray-300">Authenticating...</p>
      </div>
    </div>
  );
  
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="mb-6">
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                Your <span className="text-blue-400">Profile</span>
              </h1>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Complete your profile to get personalized career suggestions and insights
              </p>
              <p className="text-gray-400 text-sm italic mt-2">
                Academic information is required for career suggestions. For the latest updates to your profile (such as CV changes), please refresh the page after saving.
              </p>
            </div>
          </div>

          {/* Success Popup */}
          {showSuccess && (
            <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg shadow-lg text-base font-semibold animate-fade-in-out">
              Profile saved successfully!
            </div>
          )}

          <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
            <CardContent className="p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-400">{error}</p>
                </div>
              )}
              
              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-4" />
                  <p className="text-gray-300">Loading your profile...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <div className="flex items-center mb-4">
                      <User className="h-6 w-6 text-blue-400 mr-3" />
                      <h2 className="text-xl font-semibold text-white">Personal Information</h2>
                    </div>
                    <div>
                      <label className="block mb-2 font-medium text-blue-300">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <Input
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 font-medium text-blue-300">
                        Bio
                      </label>
                      <textarea
                        className="w-full p-4 rounded-lg bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 resize-none"
                        rows={3}
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Describe your passions, interests, and background... (optional)"
                      />
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block mb-2 font-medium text-blue-300">
                          City <span className="text-red-400">*</span>
                        </label>
                        <Input
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="Your city"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 font-medium text-blue-300">
                          Country <span className="text-red-400">*</span>
                        </label>
                        <Input
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          placeholder="Your country"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 font-medium text-blue-300">
                          Age
                        </label>
                        <Input
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                          name="age"
                          value={formData.age}
                          onChange={handleChange}
                          placeholder="Your age (optional)"
                          type="number"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Academic Information */}
                  <div className="space-y-4">
                    <div className="flex items-center mb-4">
                      <GraduationCap className="h-6 w-6 text-blue-400 mr-3" />
                      <h2 className="text-xl font-semibold text-white">Academic Information</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2 font-medium text-blue-300">
                          University <span className="text-red-400">*</span>
                        </label>
                        <Input
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                          name="university"
                          value={formData.university}
                          onChange={handleChange}
                          placeholder="Your university or institution"
                          required
                        />
                      </div>
                      <div>
                        <label className="block mb-2 font-medium text-blue-300">
                          Degree <span className="text-red-400">*</span>
                        </label>
                        <Input
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                          name="degree"
                          value={formData.degree}
                          onChange={handleChange}
                          placeholder="e.g., Bachelor of Computer Science"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2 font-medium text-blue-300">
                          GPA <span className="text-red-400">*</span>
                        </label>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
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
                              className="bg-white/10 border-white/20 text-white focus:border-blue-400 focus:ring-blue-400/20 rounded-lg px-3 py-2"
                              name="gpaScale"
                              value={formData.gpaScale || '4.0'}
                              onChange={handleChange}
                            >
                              <option value="4.0" className="bg-gray-800">4.0 Scale</option>
                              <option value="5.0" className="bg-gray-800">5.0 Scale</option>
                              <option value="7.0" className="bg-gray-800">7.0 Scale</option>
                              <option value="9.0" className="bg-gray-800">9.0 Scale</option>
                              <option value="10.0" className="bg-gray-800">10.0 Scale</option>
                              <option value="100" className="bg-gray-800">Percentage</option>
                              <option value="other" className="bg-gray-800">Other</option>
                            </select>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Common scales: 4.0 (USA, Canada), 5.0 (Monash), 7.0 (Queensland), 9.0 (Auckland), 10.0 (Europe)
                          </div>
                          {(!isGPAValid(formData.gpa, formData.gpaScale) || !isGPARealisticallyValid(formData.gpa, formData.gpaScale)) && formData.gpa && (
                            <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-3">
                              <div className="flex items-center mb-1">
                                <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
                                <span className="text-red-400 text-sm font-medium">Invalid GPA</span>
                              </div>
                              <div className="text-red-300 text-sm">
                                {!isGPAValid(formData.gpa, formData.gpaScale) ? (
                                  formData.gpaScale === '100' 
                                    ? `Your GPA (${formData.gpa}%) must be between 0 and 100.`
                                    : `Your GPA (${formData.gpa}) exceeds the maximum for a ${formData.gpaScale} scale.`
                                ) : (
                                  formData.gpaScale === '100'
                                    ? `Your GPA (${formData.gpa}%) seems unrealistically low. Please enter a valid percentage.`
                                    : `Your GPA (${formData.gpa}) seems unrealistically low for a ${formData.gpaScale} scale. Please verify your GPA.`
                                )}
                              </div>
                            </div>
                          )}
                          {isGPAValid(formData.gpa, formData.gpaScale) && isGPARealisticallyValid(formData.gpa, formData.gpaScale) && formData.gpa && formData.gpaScale && formData.gpaScale !== 'other' && calculateGPAPercentage(parseFloat(formData.gpa) || 0, formData.gpaScale) !== null && (
                            <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3">
                              <div className="flex items-center mb-2">
                                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                                <span className="text-blue-300 text-sm font-medium">Gradual understands your GPA as:</span>
                              </div>
                              <div className="text-white font-semibold">
                                {calculateGPAPercentage(parseFloat(formData.gpa) || 0, formData.gpaScale)}% performance
                              </div>
                              <div className="text-gray-300 text-xs mt-1">
                                This helps us give you accurate career suggestions based on your academic performance level.
                              </div>
                            </div>
                          )}
                          {formData.gpaScale === 'other' && (
                            <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-3">
                              <p className="text-yellow-300 text-sm">
                                Please contact support or provide your GPA as a percentage (0-100) for the most accurate suggestions.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block mb-2 font-medium text-blue-300">
                          Interests <span className="text-red-400">*</span>
                        </label>
                        <Input
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                          name="interests"
                          value={formData.interests}
                          onChange={handleChange}
                          placeholder="e.g., AI, Machine Learning, Web Development"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Industries/Fields & Portfolio */}
                  <div className="space-y-4">
                    <div className="flex items-center mb-4">
                      <Star className="h-6 w-6 text-blue-400 mr-3" />
                      <h2 className="text-xl font-semibold text-white">Industries & Portfolio</h2>
                    </div>
                    <div>
                      <label className="block mb-2 font-medium text-blue-300">
                        Preferred Industries/Fields
                      </label>
                      <Input
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                        name="preferredIndustries"
                        value={formData.preferredIndustries}
                        onChange={handleChange}
                        placeholder="e.g., Software, AI, Finance (comma separated)"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 font-medium text-blue-300">
                        Portfolio/LinkedIn/GitHub Links
                      </label>
                      <Input
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                        name="portfolioLinks"
                        value={formData.portfolioLinks}
                        onChange={handleChange}
                        placeholder="Paste links, separated by commas"
                      />
                    </div>
                  </div>

                  {/* CV Upload */}
                  <div className="space-y-4">
                    <div className="flex items-center mb-4">
                      <Upload className="h-6 w-6 text-blue-400 mr-3" />
                      <h2 className="text-xl font-semibold text-white">CV Upload</h2>
                    </div>
                    
                    <div className="mb-4">
                      {formData.uploadedCVName ? (
                        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-2">
                          <span className="text-blue-300 font-medium">Saved CV:</span>
                          <span className="text-white font-semibold">{formData.uploadedCVName}</span>
                          <Button
                            variant="outline"
                            className="mt-2 md:mt-0 bg-red-500/10 border-red-400 text-red-400 hover:bg-red-500/20 hover:text-white transition-all duration-300"
                            onClick={handleRemoveCV}
                            disabled={removeLoading}
                          >
                            {removeLoading ? "Removing..." : "Remove CV"}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No CV currently saved.</span>
                      )}
                      {removeSuccess && (
                        <div className="text-green-400 text-sm mt-2">{removeSuccess}</div>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={removeLoading}
                      />
                      <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-blue-400/50 transition-colors duration-300">
                        <Upload className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                        <p className="text-gray-300">
                          {cvFile ? cvFile.name : 'Click to upload your CV (PDF)'}
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                          {cvFile ? 'File selected' : 'Drag and drop or click to browse'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {cvText && formData.uploadedCVName && (
                    <Button
                      className="mt-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-2 rounded-lg"
                      onClick={() => setShowCVText(true)}
                    >
                      View Saved CV
                    </Button>
                  )}
                  <Dialog open={showCVText} onOpenChange={setShowCVText}>
                    <Dialog.Content>
                      <Dialog.Title>Extracted CV Text</Dialog.Title>
                      <div className="max-h-96 overflow-y-auto whitespace-pre-wrap text-gray-800 bg-white p-4 rounded-lg">
                        {cvText || "No CV text saved."}
                      </div>
                      <Dialog.Close asChild>
                        <Button className="mt-4" onClick={() => setShowCVText(false)}>Close</Button>
                      </Dialog.Close>
                    </Dialog.Content>
                  </Dialog>

                  {/* Save Button */}
                  <div className="pt-6">
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <div className="flex items-center">
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Saving...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Save className="h-5 w-5 mr-2" />
                          Save Profile
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
