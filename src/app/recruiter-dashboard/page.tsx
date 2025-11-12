'use client';

/**
 * Recruiter Dashboard
 * 
 * This page provides recruiters with tools to:
 * 1. Browse and filter student profiles
 * 2. View CV scores and achievements
 * 3. Create and manage shortlists
 * 4. Contact students (with proper permissions)
 * 5. View analytics and insights
 * 
 * Security Features:
 * - Role-based access control
 * - Rate limiting for profile views
 * - Subscription-based feature access
 * - Privacy-respecting data filtering
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Filter, 
  Users, 
  Star, 
  Mail, 
  Bookmark, 
  TrendingUp,
  Eye,
  Download,
  Settings,
  Crown,
  Shield,
  Target,
  GraduationCap,
  MapPin,
  Calendar,
  Award,
  BarChart3,
  LogOut,
  User
} from 'lucide-react';
import { RecruiterProfile, RecruiterPermissions, StudentProfileView } from '@/types/recruiter';

export default function RecruiterDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  
  // State management
  const [recruiterProfile, setRecruiterProfile] = useState<RecruiterProfile | null>(null);
  const [permissions, setPermissions] = useState<RecruiterPermissions | null>(null);
  const [students, setStudents] = useState<StudentProfileView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'browse' | 'shortlists' | 'contacts' | 'analytics'>('browse');
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    universities: [] as string[],
    degrees: [] as string[],
    cvScoreMin: 0,
    cvScoreMax: 100,
    cities: [] as string[],
    countries: [] as string[],
    minAchievements: 0,
    hasPortfolio: false,
  });
  
  // Shortlist state
  const [shortlists, setShortlists] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  
  // Load students with current filters
  const loadStudents = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/recruiter/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          search: searchQuery,
          filters: filters,
          limit: 20
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to load students');
      }
      
      const data = await response.json();
      setStudents(data.students);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to load students:', err);
    }
  }, [user, searchQuery, filters]);
  
  // Load recruiter profile and permissions
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    
    const loadRecruiterData = async () => {
      try {
        setLoading(true);
        
        // Verify recruiter status
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
        setPermissions(data.permissions);
        
        // Check if recruiter profile is complete, if not redirect to onboarding
        if (!data.recruiter.companyName || !data.recruiter.fullName || !data.recruiter.jobTitle) {
          router.push('/recruiter-onboarding');
          return;
        }
        
        // Load initial student data
        await loadStudents();
        
      } catch (err: any) {
        setError(err.message);
        console.error('Failed to load recruiter data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadRecruiterData();
  }, [user, authLoading, router, loadStudents]);
  
  // Handle search
  const handleSearch = () => {
    loadStudents();
  };
  
  // Handle student selection for shortlisting
  const toggleStudentSelection = (studentId: string) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudents(newSelection);
  };
  
  // Create shortlist
  const createShortlist = async (name: string) => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/recruiter/shortlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name,
          studentIds: Array.from(selectedStudents)
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create shortlist');
      }
      
      // Clear selection and reload shortlists
      setSelectedStudents(new Set());
      await loadShortlists();
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  // Load shortlists
  const loadShortlists = async () => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/recruiter/shortlists', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load shortlists');
      }
      
      const data = await response.json();
      setShortlists(data.shortlists);
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  // Contact student
  const contactStudent = async (studentId: string, message: string) => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/recruiter/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: studentId,
          message: message,
          contactMethod: 'email'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send contact message');
      }
      
      alert('Contact message sent successfully!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/'); // Redirect to landing page
    } catch (err: any) {
      setError('Failed to logout: ' + err.message);
    }
  };

  // Handle profile access
  const handleProfileAccess = () => {
    router.push('/recruiter-profile');
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading recruiter dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
              <p className="text-gray-300 mb-4">{error}</p>
              <Button onClick={() => router.push('/dashboard')} className="w-full">
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Crown className="h-8 w-8 text-yellow-400" />
                <h1 className="text-2xl font-bold text-white">Recruiter Dashboard</h1>
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
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-white font-medium">{recruiterProfile?.fullName}</p>
                <p className="text-gray-300 text-sm">{recruiterProfile?.jobTitle}</p>
              </div>
              <Button
                variant="outline"
                onClick={handleProfileAccess}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/pricing')}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Crown className="h-4 w-4 mr-2" />
                Pricing
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-red-500/50 text-red-300 hover:bg-red-500/20 hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 mt-6">
          {[
            { id: 'browse', label: 'Browse Students', icon: Users },
            { id: 'shortlists', label: 'Shortlists', icon: Bookmark },
            { id: 'contacts', label: 'Contacts', icon: Mail },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'browse' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  Search & Filter Students
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by name, university, degree..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                    />
                  </div>
                  <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      CV Score Range
                    </label>
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.cvScoreMin}
                        onChange={(e) => setFilters(prev => ({ ...prev, cvScoreMin: parseInt(e.target.value) || 0 }))}
                        className="bg-white/10 border-white/20 text-white"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.cvScoreMax}
                        onChange={(e) => setFilters(prev => ({ ...prev, cvScoreMax: parseInt(e.target.value) || 100 }))}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      University
                    </label>
                    <Input
                      placeholder="Filter by university..."
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Location
                    </label>
                    <Input
                      placeholder="Filter by city/country..."
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Student Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map((student) => (
                <Card key={student.uid} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{student.fullName}</h3>
                        <p className="text-gray-300 text-sm">{student.university}</p>
                        <p className="text-gray-400 text-sm">{student.degree}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleStudentSelection(student.uid)}
                          className={`border-white/20 ${
                            selectedStudents.has(student.uid)
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'text-white hover:bg-white/10'
                          }`}
                        >
                          <Bookmark className="h-4 w-4" />
                        </Button>
                        {permissions?.canContactStudents && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => contactStudent(student.uid, 'Hello! I would like to discuss opportunities with you.')}
                            className="border-white/20 text-white hover:bg-white/10"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-300">
                        <MapPin className="h-4 w-4 mr-2" />
                        {student.city}, {student.country}
                      </div>
                      
                      {permissions?.canViewCVScores && student.cvScore && (
                        <div className="flex items-center text-sm text-gray-300">
                          <Star className="h-4 w-4 mr-2 text-yellow-400" />
                          CV Score: {student.cvScore}/100
                        </div>
                      )}
                      
                      {permissions?.canViewAchievements && student.achievements && (
                        <div className="flex items-center text-sm text-gray-300">
                          <Award className="h-4 w-4 mr-2 text-purple-400" />
                          {student.achievements.unlocked} achievements
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm text-gray-300">
                        <Calendar className="h-4 w-4 mr-2" />
                        Updated {new Date(student.lastUpdatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {student.bio && (
                      <p className="text-gray-400 text-sm mt-3 line-clamp-2">
                        {student.bio}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {students.length === 0 && (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No students found</h3>
                  <p className="text-gray-300">Try adjusting your search criteria or filters.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {activeTab === 'shortlists' && (
          <div className="space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center">
                    <Bookmark className="h-5 w-5 mr-2" />
                    Shortlists
                  </div>
                  {selectedStudents.size > 0 && (
                    <Button
                      onClick={() => {
                        const name = prompt('Enter shortlist name:');
                        if (name) createShortlist(name);
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Create Shortlist ({selectedStudents.size})
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">Shortlist management features will be implemented here.</p>
              </CardContent>
            </Card>
          </div>
        )}
        
        {activeTab === 'contacts' && (
          <div className="space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Contact History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">Contact management features will be implemented here.</p>
              </CardContent>
            </Card>
          </div>
        )}
        
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Analytics Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">Analytics features will be implemented here.</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
