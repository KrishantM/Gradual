export type OpportunityType =
  | 'job'
  | 'internship'
  | 'club'
  | 'volunteering'
  | 'event'
  | 'scholarship'
  | 'competition';

export type LocationType = 'onsite' | 'remote' | 'hybrid';
export type OpportunityStatus = 'active' | 'expired' | 'closed' | 'draft';
export type ApplicationType = 'external' | 'email' | 'inApp' | 'none';

export interface OpportunityDates {
  posted?: string;
  deadline?: string;
  startDate?: string;
  endDate?: string;
  expiresAt?: string;
}

export interface OpportunityCompensation {
  type?: 'paid' | 'unpaid' | 'stipend' | 'scholarship';
  currency?: string;
  amount?: number;
  salaryMin?: number;
  salaryMax?: number;
  description?: string;
}

export interface OpportunityEligibility {
  yearOfStudy?: number[];
  degrees?: string[];
  studyLevel?: string[];
  citizenship?: string[];
  gpaMin?: number;
  citizenshipRequired?: boolean;
  ageRange?: { min?: number; max?: number };
  note?: string;
  other?: string[];
}

export interface OpportunityValidation {
  isVerified: boolean;
  verifiedAt?: string;
  trustScore: number;
  flags?: string[];
  lastChecked?: string;
}

export interface Opportunity {
  id: string;
  type: OpportunityType;
  source: string;
  sourceId?: string;
  sourceUrl?: string;
  canonicalUrl?: string;

  title: string;
  organization: string;
  organizationUrl?: string;
  summary?: string;
  description: string;

  location: string;
  locationType?: LocationType;
  isRemote?: boolean;
  city?: string;
  country?: string;
  region?: string;

  tags: string[];
  categoryTags?: string[];
  skills?: string[];
  industries?: string[];
  category?: string;

  eligibility?: OpportunityEligibility;
  requirements?: string[];

  dates?: OpportunityDates;
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string;
  deadline?: string;
  startDate?: string;
  endDate?: string;

  compensation?: OpportunityCompensation;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  benefits?: string[];

  applicationType?: ApplicationType;
  url: string;

  status?: OpportunityStatus;

  matchScore?: number;
  matchReasons?: string[];
  score?: number;

  validation?: OpportunityValidation;

  rawSourceData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface OpportunityQuery {
  userProfile: UserProfileSnapshot;
  types?: OpportunityType[];
  location?: {
    city?: string;
    country?: string;
    allowRemote?: boolean;
  };
  requiredTags?: string[];
  preferredTags?: string[];
  excludeExpired?: boolean;
  minDate?: string;
  maxDate?: string;
  limit?: number;
  minScore?: number;
}

export interface UserProfileSnapshot {
  uid: string;
  university?: string;
  degree?: string;
  gpa?: number;
  interests?: string;
  preferredIndustries?: string;
  bio?: string;
  goal?: string;
  city?: string;
  country?: string;
  skills?: string[];
  tags?: string[];
  age?: number;
  yearOfStudy?: number;
  workRights?: string;
}

export interface OpportunityMatchResult {
  opportunities: Opportunity[];
  totalMatches: number;
  query: OpportunityQuery;
  metadata?: {
    executionTimeMs?: number;
    filtersApplied?: string[];
  };
}
