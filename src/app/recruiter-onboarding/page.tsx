'use client';

/**
 * Recruiter Onboarding Page
 * 
 * This page allows new recruiters to complete their profile setup
 * with company information, personal details, and preferences.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  Users, 
  Briefcase,
  Save,
  Loader2,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export default function RecruiterOnboarding() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    // Company Information
    companyName: '',
    companySize: 'small' as 'startup' | 'small' | 'medium' | 'large' | 'enterprise',
    industry: '',
    companyWebsite: '',
    
    // Personal Information
    fullName: '',
    jobTitle: '',
    department: '',
    phoneNumber: '',
    linkedinProfile: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Load existing recruiter data
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    
    const loadRecruiterData = async () => {
      try {
        setLoading(true);
        
        const recruiterRef = doc(db, 'recruiters', user.uid);
        const recruiterSnap = await getDoc(recruiterRef);
        
        if (recruiterSnap.exists()) {
          const data = recruiterSnap.data();
          setFormData(prev => ({
            ...prev,
            ...data
          }));
          
          // If profile is already complete, redirect to dashboard
          if (data.companyName && data.fullName && data.jobTitle && data.department && data.industry) {
            router.push('/recruiter-dashboard');
            return;
          }
        }
        
      } catch (err: any) {
        setError('Failed to load recruiter data');
        console.error('Error loading recruiter data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadRecruiterData();
  }, [user, authLoading, router]);
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    setError('');
    
    try {
      // Validate required fields
      if (!formData.companyName || !formData.fullName || !formData.jobTitle || !formData.department || !formData.industry) {
        setError('Please fill in all required fields');
        return;
      }
      
      // Use API endpoint to update profile
      const token = await user.getIdToken();
      const response = await fetch('/api/recruiter/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      
      setSuccess(true);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/recruiter-dashboard');
      }, 2000);
      
    } catch (err: any) {
      setError('Failed to save profile: ' + err.message);
      console.error('Error saving recruiter profile:', err);
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading onboarding...</p>
        </div>
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Profile Complete!</h2>
            <p className="text-gray-300 mb-6">Your recruiter profile has been successfully created.</p>
            <div className="animate-pulse">
              <p className="text-blue-300">Redirecting to dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Building className="h-12 w-12 text-blue-400 mr-4" />
            <h1 className="text-4xl font-bold text-white">Complete Your Recruiter Profile</h1>
          </div>
          <p className="text-gray-300 text-lg">
            Set up your recruiter account to start connecting with talented students
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Company Information */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Company Name *
                </label>
                <Input
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="Enter your company name"
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Company Size *
                </label>
                <select
                  value={formData.companySize}
                  onChange={(e) => handleInputChange('companySize', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="startup" className="bg-gray-800 text-white">Startup (1-10 employees)</option>
                  <option value="small" className="bg-gray-800 text-white">Small (11-50 employees)</option>
                  <option value="medium" className="bg-gray-800 text-white">Medium (51-200 employees)</option>
                  <option value="large" className="bg-gray-800 text-white">Large (201-1000 employees)</option>
                  <option value="enterprise" className="bg-gray-800 text-white">Enterprise (1000+ employees)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Industry *
                </label>
                <Input
                  value={formData.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  placeholder="e.g., Technology, Finance, Healthcare"
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Company Website
                </label>
                <Input
                  value={formData.companyWebsite}
                  onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                  placeholder="https://www.company.com"
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Personal Information */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <User className="h-5 w-5 mr-2" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name *
                </label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Enter your full name"
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Job Title *
                </label>
                <Input
                  value={formData.jobTitle}
                  onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                  placeholder="e.g., Senior Recruiter, Talent Acquisition Manager"
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Department *
                </label>
                <Input
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  placeholder="e.g., Human Resources, Talent Acquisition"
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number
                </label>
                <Input
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  LinkedIn Profile
                </label>
                <Input
                  value={formData.linkedinProfile}
                  onChange={(e) => handleInputChange('linkedinProfile', e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-300">{error}</p>
          </div>
        )}
        
        {/* Save Button */}
        <div className="mt-8 text-center">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Saving Profile...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Complete Profile
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </div>
        
        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            * Required fields. You can update this information later in your profile settings.
          </p>
        </div>
      </div>
    </div>
  );
}
