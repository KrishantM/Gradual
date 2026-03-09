// Recruiter Account Types and Interfaces
// This file defines the data models for recruiter accounts and their permissions

export interface RecruiterProfile {
  // Basic Information
  uid: string;
  email: string;
  role: 'recruiter';
  createdAt: Date;
  updatedAt: Date;
  
  // Company Information
  companyName: string;
  companySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  industry: string;
  companyWebsite?: string;
  companyLogo?: string;
  
  // Personal Information
  fullName: string;
  jobTitle: string;
  department: string;
  phoneNumber?: string;
  linkedinProfile?: string;
  
  // Subscription & Access
  subscriptionTier: 'free' | 'basic' | 'premium' | 'enterprise';
  subscriptionStatus: 'active' | 'inactive' | 'cancelled' | 'trial';
  subscriptionExpiresAt?: Date;
  maxStudentViews: number;
  currentStudentViews: number;
  
  // Permissions & Features
  canViewCVScores: boolean;
  canViewFullProfiles: boolean;
  canContactStudents: boolean;
  canExportData: boolean;
  canCreateShortlists: boolean;
  canAccessAnalytics: boolean;
  
  // Activity Tracking
  lastLoginAt?: Date;
  totalLogins: number;
  profileViewsToday: number;
  profileViewsThisMonth: number;
  
  // Verification Status
  isVerified: boolean;
  verificationMethod?: 'email' | 'phone' | 'company_email' | 'manual';
  verificationDate?: Date;
}

export interface StudentProfileView {
  // Limited student data that recruiters can access
  uid: string;
  fullName: string;
  university: string;
  degree: string;
  gpa: string;
  city: string;
  country: string;
  age: string;
  preferredIndustries: string;
  bio: string;
  portfolioLinks: string;
  
  // CV Information
  cvScore: number | null;
  cvScoreTimestamp?: Date;
  uploadedCVName?: string;
  cvText?: string; // Only for premium recruiters
  
  profileCompletion: number;
  
  // Privacy Settings
  isProfilePublic: boolean;
  allowRecruiterContact: boolean;
  lastUpdatedAt: Date;
}

export interface RecruiterShortlist {
  id: string;
  recruiterId: string;
  name: string;
  description?: string;
  studentIds: string[];
  createdAt: Date;
  updatedAt: Date;
  isShared: boolean;
  sharedWith?: string[]; // Other recruiter IDs
}

export interface RecruiterContact {
  id: string;
  recruiterId: string;
  studentId: string;
  message: string;
  contactMethod: 'email' | 'linkedin' | 'phone';
  status: 'pending' | 'sent' | 'responded' | 'declined';
  createdAt: Date;
  respondedAt?: Date;
  studentResponse?: string;
}

export interface RecruiterAnalytics {
  recruiterId: string;
  period: 'daily' | 'weekly' | 'monthly';
  date: Date;
  
  // Profile Views
  totalProfileViews: number;
  uniqueProfileViews: number;
  cvScoreViews: number;
  
  // Contact Activity
  contactsSent: number;
  contactsResponded: number;
  responseRate: number;
  
  // Shortlist Activity
  shortlistsCreated: number;
  studentsShortlisted: number;
  
  // Search Activity
  searchesPerformed: number;
  filtersUsed: string[];
}

export interface RecruiterSearchFilters {
  // Academic Filters
  universities?: string[];
  degrees?: string[];
  gpaMin?: number;
  gpaMax?: number;
  
  // Location Filters
  cities?: string[];
  countries?: string[];
  
  // CV Score Filters
  cvScoreMin?: number;
  cvScoreMax?: number;
  
  // Profile Completion
  minProfileCompletion?: number;
  
  // Industry Preferences
  preferredIndustries?: string[];
  
  // Age Range
  ageMin?: number;
  ageMax?: number;
  
  // Portfolio
  hasPortfolio?: boolean;
  
  // Activity
  lastActiveWithin?: number; // days
}

export interface RecruiterPermissions {
  // View Permissions
  canViewBasicProfiles: boolean;
  canViewCVScores: boolean;
  canViewFullCVs: boolean;
  canViewContactInfo: boolean;
  
  // Action Permissions
  canCreateShortlists: boolean;
  canContactStudents: boolean;
  canExportProfiles: boolean;
  canShareShortlists: boolean;
  
  // Analytics Permissions
  canViewAnalytics: boolean;
  canViewTrends: boolean;
  canExportAnalytics: boolean;
  
  // Limits
  maxDailyViews: number;
  maxMonthlyContacts: number;
  maxShortlists: number;
  maxStudentsPerShortlist: number;
}

// Subscription tier definitions
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    maxStudentViews: 10,
    maxMonthlyContacts: 5,
    maxShortlists: 2,
    maxStudentsPerShortlist: 10,
    features: ['basic_profile_view', 'cv_score_view']
  },
  basic: {
    name: 'Basic',
    maxStudentViews: 100,
    maxMonthlyContacts: 25,
    maxShortlists: 10,
    maxStudentsPerShortlist: 50,
    features: ['basic_profile_view', 'cv_score_view', 'shortlist_creation']
  },
  premium: {
    name: 'Premium',
    maxStudentViews: 500,
    maxMonthlyContacts: 100,
    maxShortlists: 25,
    maxStudentsPerShortlist: 100,
    features: ['full_profile_view', 'cv_score_view', 'shortlist_creation', 'student_contact', 'analytics']
  },
  enterprise: {
    name: 'Enterprise',
    maxStudentViews: -1, // unlimited
    maxMonthlyContacts: -1, // unlimited
    maxShortlists: -1, // unlimited
    maxStudentsPerShortlist: -1, // unlimited
    features: ['full_profile_view', 'cv_score_view', 'shortlist_creation', 'student_contact', 'analytics', 'data_export', 'api_access']
  }
} as const;

