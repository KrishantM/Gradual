// Opportunities Engine Types and Interfaces
// This file defines the data models for the Opportunities Engine
// NOTE: This is a mock-only implementation. Real data will be integrated from Firestore and external APIs later.

/**
 * Types of opportunities available in the system
 */
export type OpportunityType = 
  | 'job'           // Full-time or part-time employment
  | 'internship'     // Internship positions
  | 'club'          // University clubs and societies
  | 'volunteering'  // Volunteer opportunities
  | 'event'         // Events, workshops, hackathons
  | 'scholarship';  // Scholarships and grants

/**
 * Core opportunity data structure
 */
export interface Opportunity {
  id: string;
  title: string;
  description: string;
  type: OpportunityType;
  
  // Organization/Company information
  organization: string;
  organizationUrl?: string;
  
  // Location information
  location: string;
  isRemote?: boolean;
  city?: string;
  country?: string;
  
  // Timing information
  createdAt: string; // ISO date string
  expiresAt?: string; // ISO date string (for time-sensitive opportunities)
  deadline?: string; // ISO date string (for applications)
  startDate?: string; // ISO date string (for events, internships with start dates)
  endDate?: string; // ISO date string (for events, internships with end dates)
  
  // Categorization and matching
  tags: string[]; // Skills, interests, categories (e.g., ['javascript', 'react', 'web-development'])
  category?: string; // Primary category (e.g., 'Technology', 'Marketing', 'Engineering')
  
  // Additional details
  url: string; // Link to apply or learn more
  requirements?: string[]; // List of requirements
  benefits?: string[]; // List of benefits
  
  // Financial information (for jobs, internships, scholarships)
  salaryMin?: number;
  salaryMax?: number;
  currency?: string; // e.g., 'NZD', 'USD'
  
  // Source tracking
  source: string; // e.g., 'mock', 'adzuna', 'firestore', 'manual'
  
  // Computed matching score (set by matching engine)
  score?: number;
  
  // Additional metadata
  metadata?: Record<string, unknown>;
}

/**
 * Query input for the opportunities matching engine
 */
export interface OpportunityQuery {
  // User profile snapshot for matching
  userProfile: UserProfileSnapshot;
  
  // Filtering options
  types?: OpportunityType[]; // Filter by opportunity types
  location?: {
    city?: string;
    country?: string;
    allowRemote?: boolean; // Include remote opportunities
  };
  
  // Tag/skill matching
  requiredTags?: string[]; // Must have at least one of these tags
  preferredTags?: string[]; // Boost score if these tags match
  
  // Date filtering
  excludeExpired?: boolean; // Default: true
  minDate?: string; // ISO date string - opportunities created after this date
  maxDate?: string; // ISO date string - opportunities created before this date
  
  // Result limits
  limit?: number; // Maximum number of results (default: 20)
  minScore?: number; // Minimum match score to include (default: 0)
}

/**
 * Simplified user profile snapshot used for matching
 * This is a lightweight version of the full user profile
 */
export interface UserProfileSnapshot {
  // Basic information
  uid: string;
  university?: string;
  degree?: string;
  gpa?: number;
  
  // Interests and goals
  interests?: string; // Comma-separated or space-separated interests
  preferredIndustries?: string; // Comma-separated preferred industries
  bio?: string;
  goal?: string; // Career goal or objective
  
  // Location
  city?: string;
  country?: string;
  
  // Skills and tags (extracted from CV, profile, etc.)
  skills?: string[]; // List of skills
  tags?: string[]; // General tags for matching
  
  // Additional context
  age?: number;
  yearOfStudy?: number; // e.g., 1, 2, 3, 4 for undergraduate
}

/**
 * Result from the matching engine
 */
export interface OpportunityMatchResult {
  opportunities: Opportunity[];
  totalMatches: number;
  query: OpportunityQuery;
  metadata?: {
    executionTimeMs?: number;
    filtersApplied?: string[];
  };
}

