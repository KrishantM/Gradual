// Recruiter Authentication and Authorization Service
// This service handles recruiter verification, permissions, and data access

import { auth } from '../../lib/firebase-admin';
import { db } from '../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { RecruiterProfile, RecruiterPermissions } from '@/types/recruiter';

export class RecruiterAuthService {
  /**
   * Verify if a user is authorized as a recruiter
   */
  static async verifyRecruiter(token: string): Promise<{ recruiter: RecruiterProfile; permissions: RecruiterPermissions } | null> {
    try {
      // Verify the Firebase token
      const decodedToken = await auth.verifyIdToken(token);
      const uid = decodedToken.uid;
      
      // Check if user exists in recruiters collection
      const recruiterRef = db.collection('recruiters').doc(uid);
      const recruiterSnap = await recruiterRef.get();
      
      if (!recruiterSnap.exists) {
        console.log('RecruiterAuthService: No recruiter document found for user:', uid);
        return null;
      }
      
      const recruiterData = recruiterSnap.data();
      if (!recruiterData) {
        console.log('RecruiterAuthService: No recruiter data found');
        return null;
      }
      
      // Convert Firestore data to RecruiterProfile
      const recruiter: RecruiterProfile = {
        uid: uid,
        email: decodedToken.email || '',
        role: 'recruiter',
        createdAt: recruiterData.createdAt?.toDate() || new Date(),
        updatedAt: recruiterData.updatedAt?.toDate() || new Date(),
        companyName: recruiterData.companyName || '',
        companySize: recruiterData.companySize || 'small',
        industry: recruiterData.industry || '',
        companyWebsite: recruiterData.companyWebsite || '',
        companyLogo: recruiterData.companyLogo || '',
        fullName: recruiterData.fullName || '',
        jobTitle: recruiterData.jobTitle || '',
        department: recruiterData.department || '',
        phoneNumber: recruiterData.phoneNumber || '',
        linkedinProfile: recruiterData.linkedinProfile || '',
        subscriptionTier: recruiterData.subscriptionTier || 'free',
        subscriptionStatus: recruiterData.subscriptionStatus || 'active',
        subscriptionExpiresAt: recruiterData.subscriptionExpiresAt?.toDate(),
        maxStudentViews: recruiterData.maxStudentViews || 10,
        currentStudentViews: recruiterData.currentStudentViews || 0,
        canViewCVScores: recruiterData.canViewCVScores || false,
        canViewFullProfiles: recruiterData.canViewFullProfiles || false,
        canContactStudents: recruiterData.canContactStudents || false,
        canExportData: recruiterData.canExportData || false,
        canCreateShortlists: recruiterData.canCreateShortlists || false,
        canAccessAnalytics: recruiterData.canAccessAnalytics || false,
        lastLoginAt: recruiterData.lastLoginAt?.toDate(),
        totalLogins: recruiterData.totalLogins || 0,
        profileViewsToday: recruiterData.profileViewsToday || 0,
        profileViewsThisMonth: recruiterData.profileViewsThisMonth || 0,
        isVerified: recruiterData.isVerified || false,
        verificationMethod: recruiterData.verificationMethod,
        verificationDate: recruiterData.verificationDate?.toDate(),
      };
      
      // Generate permissions based on subscription tier
      const permissions: RecruiterPermissions = this.generatePermissions(recruiter);
      
      return { recruiter, permissions };
      
    } catch (error) {
      console.error('RecruiterAuthService: Error verifying recruiter:', error);
      return null;
    }
  }
  
  /**
   * Generate permissions based on subscription tier
   */
  static generatePermissions(recruiter: RecruiterProfile): RecruiterPermissions {
    const basePermissions: RecruiterPermissions = {
      canViewBasicProfiles: false,
      canViewCVScores: false,
      canViewFullCVs: false,
      canViewAchievements: false,
      canViewContactInfo: false,
      canCreateShortlists: false,
      canContactStudents: false,
      canExportProfiles: false,
      canShareShortlists: false,
      canViewAnalytics: false,
      canViewTrends: false,
      canExportAnalytics: false,
      maxDailyViews: 50,
      maxMonthlyContacts: 5,
      maxShortlists: 1,
      maxStudentsPerShortlist: 10,
    };
    
    switch (recruiter.subscriptionTier) {
      case 'free':
        return {
          ...basePermissions,
          canViewBasicProfiles: true,
          canViewCVScores: true,
          maxDailyViews: 50,
          maxShortlists: 1,
          maxMonthlyContacts: 0,
        };
        
      case 'basic':
        return {
          ...basePermissions,
          canViewBasicProfiles: true,
          canViewCVScores: true,
          canViewAchievements: true,
          canCreateShortlists: true,
          maxDailyViews: 50,
          maxShortlists: 5,
          maxMonthlyContacts: 10,
        };
        
      case 'premium':
        return {
          ...basePermissions,
          canViewBasicProfiles: true,
          canViewCVScores: true,
          canViewFullCVs: true,
          canViewAchievements: true,
          canViewContactInfo: true,
          canContactStudents: true,
          canCreateShortlists: true,
          canExportProfiles: true,
          maxDailyViews: 200,
          maxShortlists: 20,
          maxMonthlyContacts: 50,
        };
        
      case 'enterprise':
        return {
          ...basePermissions,
          canViewBasicProfiles: true,
          canViewCVScores: true,
          canViewFullCVs: true,
          canViewAchievements: true,
          canViewContactInfo: true,
          canContactStudents: true,
          canCreateShortlists: true,
          canExportProfiles: true,
          canShareShortlists: true,
          canViewAnalytics: true,
          canViewTrends: true,
          canExportAnalytics: true,
          maxDailyViews: 1000,
          maxShortlists: 100,
          maxMonthlyContacts: 500,
        };
        
      default:
        return basePermissions;
    }
  }
  
  /**
   * Check if recruiter can view more students
   * DISABLED FOR TESTING - Always returns true
   */
  static async canViewMoreStudents(uid: string): Promise<boolean> {
    // DISABLED FOR TESTING - Always allow viewing
    console.log('Daily view limits disabled for testing');
    return true;
    
    // Original logic commented out for testing
    /*
    try {
      const recruiterRef = db.collection('recruiters').doc(uid);
      const recruiterSnap = await recruiterRef.get();
      
      if (!recruiterSnap.exists) {
        return false;
      }
      
      const recruiterData = recruiterSnap.data();
      const currentViews = recruiterData?.currentStudentViews || 0;
      const maxViews = recruiterData?.maxStudentViews || 50; // Increased default limit
      const lastResetDate = recruiterData?.lastViewResetDate;
      
      // Reset daily views if it's a new day
      const today = new Date().toDateString();
      if (!lastResetDate || lastResetDate !== today) {
        await recruiterRef.update({
          currentStudentViews: 0,
          lastViewResetDate: today,
          updatedAt: new Date(),
        });
        return true; // Allow viewing after reset
      }
      
      return currentViews < maxViews;
    } catch (error) {
      console.error('Error checking student view limit:', error);
      return true; // Allow viewing on error to prevent blocking
    }
    */
  }
  
  /**
   * Increment student view count
   * DISABLED FOR TESTING - No-op function
   */
  static async incrementStudentViews(uid: string): Promise<void> {
    // DISABLED FOR TESTING - Do nothing
    console.log('View count increment disabled for testing');
    return;
    
    // Original logic commented out for testing
    /*
    try {
      const recruiterRef = db.collection('recruiters').doc(uid);
      await recruiterRef.update({
        currentStudentViews: FieldValue.increment(1),
        profileViewsToday: FieldValue.increment(1),
        profileViewsThisMonth: FieldValue.increment(1),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error incrementing student views:', error);
    }
    */
  }
  
  /**
   * Get student profiles for recruiter with filters
   */
  static async getStudentProfilesForRecruiter(
    uid: string, 
    filters: any = {}, 
    limit: number = 20
  ): Promise<any[]> {
    try {
      // Check if recruiter can view more students
      const canView = await this.canViewMoreStudents(uid);
      if (!canView) {
        throw new Error('Daily view limit exceeded');
      }
      
      // Query students collection with filters
      const studentsQuery = db.collection('users').limit(limit);
      
      // Apply filters if provided
      if (filters) {
        // This would need to be implemented with proper Firestore queries
        // For now, we'll return a basic query
      }
      
      const studentsSnap = await studentsQuery.get();
      const students: any[] = [];
      
      studentsSnap.forEach(doc => {
        const data = doc.data();
        // Only return limited data for recruiters
        students.push({
          uid: doc.id,
          fullName: data.fullName || '',
          university: data.university || '',
          degree: data.degree || '',
          city: data.city || '',
          country: data.country || '',
          bio: data.bio || '',
          cvScore: data.cvScore || null,
          achievements: data.achievements || null,
          lastUpdatedAt: data.updatedAt || data.createdAt,
        });
      });
      
      // Increment view count
      await this.incrementStudentViews(uid);
      
      return students;
    } catch (error) {
      console.error('Error getting students for recruiter:', error);
      throw error;
    }
  }
  
  /**
   * Update recruiter profile
   */
  static async updateRecruiterProfile(uid: string, profileData: any): Promise<void> {
    try {
      const recruiterRef = db.collection('recruiters').doc(uid);
      await recruiterRef.update({
        ...profileData,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating recruiter profile:', error);
      throw error;
    }
  }
  
  /**
   * Reset daily view count for a recruiter (utility method)
   */
  static async resetDailyViews(uid: string): Promise<void> {
    try {
      const recruiterRef = db.collection('recruiters').doc(uid);
      await recruiterRef.update({
        currentStudentViews: 0,
        lastViewResetDate: new Date().toDateString(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error resetting daily views:', error);
      throw error;
    }
  }

  /**
   * Create recruiter profile
   */
  static async createRecruiterProfile(uid: string, email: string, profileData: any): Promise<void> {
    try {
      const recruiterRef = db.collection('recruiters').doc(uid);
      await recruiterRef.set({
        uid: uid,
        email: email,
        role: 'recruiter',
        createdAt: new Date(),
        updatedAt: new Date(),
        subscriptionTier: 'free',
        subscriptionStatus: 'active',
        maxStudentViews: 50,
        currentStudentViews: 0,
        canViewCVScores: true,
        canViewFullProfiles: false,
        canContactStudents: false,
        canExportData: false,
        canCreateShortlists: false,
        canAccessAnalytics: false,
        totalLogins: 0,
        profileViewsToday: 0,
        profileViewsThisMonth: 0,
        isVerified: false,
        ...profileData,
      });
    } catch (error) {
      console.error('Error creating recruiter profile:', error);
      throw error;
    }
  }
}