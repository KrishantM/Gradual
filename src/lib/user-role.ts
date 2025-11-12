// User Role Detection and Routing Helper
// This file helps determine user roles and provides appropriate routing

import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

export interface UserRole {
  role: 'student' | 'recruiter';
  profileComplete: boolean;
  redirectPath: string;
}

export class UserRoleService {
  /**
   * Determine user role and appropriate redirect path
   */
  static async getUserRole(user: User): Promise<UserRole> {
    try {
      console.log('UserRoleService: Checking role for user:', user.email, user.uid);
      
      // Check user's role from the users collection first
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        console.log('UserRoleService: Found user data:', JSON.stringify(userData, null, 2));
        console.log('UserRoleService: User role from document:', userData.role);
        
        // If user has role 'recruiter', they should go to recruiter dashboard
        if (userData.role === 'recruiter') {
          console.log('UserRoleService: Detected recruiter role');
          return {
            role: 'recruiter',
            profileComplete: true, // We'll check this in the recruiter dashboard
            redirectPath: '/recruiter-dashboard'
          };
        }
        
        console.log('UserRoleService: Detected student role');
        // Otherwise, treat as student
        return {
          role: 'student',
          profileComplete: this.isStudentProfileComplete(userData),
          redirectPath: '/dashboard'
        };
      }
      
      console.log('UserRoleService: No user document found, checking recruiter collection');
      
      // If no user document exists, check if they're a recruiter
      try {
        const recruiterRef = doc(db, 'recruiters', user.uid);
        const recruiterSnap = await getDoc(recruiterRef);
        
        if (recruiterSnap.exists()) {
          const recruiterData = recruiterSnap.data();
          console.log('UserRoleService: Found recruiter data:', recruiterData);
          return {
            role: 'recruiter',
            profileComplete: this.isRecruiterProfileComplete(recruiterData),
            redirectPath: '/recruiter-dashboard'
          };
        }
      } catch (recruiterError) {
        console.log('UserRoleService: Could not check recruiter status:', recruiterError);
      }
      
      console.log('UserRoleService: Defaulting to student role');
      // Default to student if no role is found
      return {
        role: 'student',
        profileComplete: false,
        redirectPath: '/dashboard'
      };
      
    } catch (error) {
      console.error('Error determining user role:', error);
      // Default to student on error
      return {
        role: 'student',
        profileComplete: false,
        redirectPath: '/dashboard'
      };
    }
  }
  
  /**
   * Check if recruiter profile is complete
   */
  static isRecruiterProfileComplete(recruiterData: any): boolean {
    const requiredFields = [
      'companyName',
      'fullName',
      'jobTitle',
      'department',
      'industry'
    ];
    
    return requiredFields.every(field => 
      recruiterData[field] && recruiterData[field].toString().trim() !== ''
    );
  }
  
  /**
   * Check if student profile is complete
   */
  static isStudentProfileComplete(userData: any): boolean {
    const requiredFields = [
      'fullName',
      'university',
      'degree',
      'gpa',
      'city',
      'country'
    ];
    
    return requiredFields.every(field => 
      userData[field] && userData[field].toString().trim() !== ''
    );
  }
  
  /**
   * Get appropriate dashboard path based on user role
   */
  static async getDashboardPath(user: User): Promise<string> {
    const userRole = await this.getUserRole(user);
    return userRole.redirectPath;
  }
  
  /**
   * Check if user has access to a specific route
   */
  static async canAccessRoute(user: User, route: string): Promise<boolean> {
    const userRole = await this.getUserRole(user);
    
    // Define route access rules
    const routeAccess = {
      '/dashboard': ['student'],
      '/recruiter-dashboard': ['recruiter'],
      '/profile': ['student'],
      '/recruiter-profile': ['recruiter'],
      '/cvscore': ['student'],
      '/suggestions': ['student'],
      '/tracker': ['student'],
    };
    
    const allowedRoles = routeAccess[route as keyof typeof routeAccess];
    return allowedRoles ? allowedRoles.includes(userRole.role) : true;
  }
}
