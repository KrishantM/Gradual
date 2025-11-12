'use client';

/**
 * Recruiter Profile Page
 * 
 * This page allows recruiters to view and update their profile information
 * including company details, personal information, and preferences.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
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
  ArrowLeft,
  Crown,
  Shield,
  Calendar,
  Award
} from 'lucide-react';
import { RecruiterProfile } from '@/types/recruiter';

export default function RecruiterProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [recruiterProfile, setRecruiterProfile] = useState<RecruiterProfile | null>(null);
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
  
  // Load recruiter profile data
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    
    const loadRecruiterProfile = async () => {
      try {
        setLoading(true);
        
        // Verify recruiter status and get profile
        const token = await user.getIdToken();
        const response = await fetch('/api/recruiter/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Not authorized as recruiter');
        }
        
        const data = await response.json();
        setRecruiterProfile(data.recruiter);
        
        // Populate form with existing data
        setFormData(prev => ({
          ...prev,
          companyName: data.recruiter.companyName || '',
          companySize: data.recruiter.companySize || 'small',
          industry: data.recruiter.industry || '',
          companyWebsite: data.recruiter.companyWebsite || '',
          fullName: data.recruiter.fullName || '',
          jobTitle: data.recruiter.jobTitle || '',
          department: data.recruiter.department || '',
          phoneNumber: data.recruiter.phoneNumber || '',
          linkedinProfile: data.recruiter.linkedinProfile || '',
        }));
        
      } catch (err: any) {
        setError('Failed to load recruiter profile: ' + err.message);
        console.error('Error loading recruiter profile:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadRecruiterProfile();
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
          <p className="text-white">Loading recruiter profile...</p>
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
            <h2 className="text-2xl font-bold text-white mb-2">Profile Updated!</h2>
            <p className="text-gray-300 mb-6">Your recruiter profile has been successfully updated.</p>
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/recruiter-dashboard')}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center space-x-2">
              <Crown className="h-8 w-8 text-yellow-400" />
              <h1 className="text-3xl font-bold text-white">Recruiter Profile</h1>
            </div>
          </div>
          
          {recruiterProfile && (
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                {recruiterProfile.subscriptionTier.toUpperCase()}
              </span>
              <span className="text-gray-300 text-sm">
                {recruiterProfile.companyName}
              </span>
            </div>
          )}
        </div>
        
        {/* Profile Overview */}
        {recruiterProfile && (
          <Card className="bg-white/5 border-white/10 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Profile Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-300">
                    <Calendar className="h-4 w-4 mr-2" />
                    Member since: {new Date(recruiterProfile.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <Award className="h-4 w-4 mr-2" />
                    Status: {recruiterProfile.isVerified ? 'Verified' : 'Pending Verification'}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-300">
                    <Users className="h-4 w-4 mr-2" />
                    Views this month: {recruiterProfile.profileViewsThisMonth}
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Total logins: {recruiterProfile.totalLogins}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-300">
                    <Crown className="h-4 w-4 mr-2" />
                    Subscription: {recruiterProfile.subscriptionTier}
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <Mail className="h-4 w-4 mr-2" />
                    Email: {recruiterProfile.email}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
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
                Update Profile
              </>
            )}
          </Button>
        </div>
        
        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            * Required fields. Changes will be reflected immediately in your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
