# Opportunities Engine

This is the foundation for the Opportunities Engine in the Gradual platform. It provides a modular system for matching students with various types of opportunities including jobs, internships, clubs, volunteering, events, and scholarships.

## ✅ Current Status: Live Data Integration

**The Opportunities Engine now integrates live data from multiple sources:**
- ✅ Firestore database (user-submitted and stored opportunities)
- ✅ Adzuna API (live job listings)
- ✅ Mock data (fallback when no real data available)

**New Features:**
- ✅ AI-powered opportunity insights
- ✅ Multiple discovery modes (For You, Explore, Trending, Hidden Gems, etc.)
- ✅ Real-time data aggregation from multiple sources
- ✅ Opportunity deduplication and quality scoring

## Architecture

```
src/
├── types/
│   └── opportunities.ts              # Shared TypeScript types
├── lib/
│   └── opportunities-engine/
│       ├── mock-data.ts              # Mock opportunity dataset (fallback)
│       ├── matching-engine.ts        # Core matching and scoring logic
│       ├── matching-engine-helpers.ts # Helper functions for scoring
│       ├── insights-generator.ts      # AI-powered insights generator
│       ├── discovery-modes.ts         # Multiple discovery modes
│       ├── data-fetchers/
│       │   ├── firestore-fetcher.ts   # Firestore data source
│       │   ├── adzuna-fetcher.ts      # Adzuna API integration
│       │   └── opportunity-aggregator.ts # Aggregates from all sources
│       └── README.md                  # This file
└── app/
    └── api/
        └── opportunities-engine/
            ├── match/
            │   └── route.ts           # API endpoint for matching
            └── insights/
                └── route.ts          # API endpoint for insights
```

## Components

### 1. Types (`src/types/opportunities.ts`)

Defines the core data structures:
- `Opportunity` - Core opportunity data structure
- `OpportunityType` - Types: 'job', 'internship', 'club', 'volunteering', 'event', 'scholarship'
- `OpportunityQuery` - Input to the matching engine
- `UserProfileSnapshot` - Simplified user profile for matching
- `OpportunityMatchResult` - Result from the matching engine

### 2. Data Fetchers (`src/lib/opportunities-engine/data-fetchers/`)

**Firestore Fetcher** (`firestore-fetcher.ts`):
- Fetches opportunities from Firestore `opportunities` collection
- Supports filtering by type, location, date ranges
- Handles expired opportunity filtering
- Extracts tags and location data automatically

**Adzuna Fetcher** (`adzuna-fetcher.ts`):
- Fetches live job listings from Adzuna API
- Transforms Adzuna format to Opportunity format
- Extracts location, salary, and category data
- Handles API errors gracefully

**Opportunity Aggregator** (`opportunity-aggregator.ts`):
- Combines opportunities from all sources
- Deduplicates based on title and organization
- Falls back to mock data if no real data available
- Provides statistics about available opportunities

### 3. Mock Data (`src/lib/opportunities-engine/mock-data.ts`)

Contains 18 sample opportunities covering all types (used as fallback):
- 3 jobs
- 2 internships
- 3 clubs
- 3 volunteering opportunities
- 4 events
- 3 scholarships

### 4. Matching Engine (`src/lib/opportunities-engine/matching-engine.ts`)

Core matching logic that:
- Filters opportunities based on query criteria
- Scores each opportunity using multiple factors:
  - Skill overlap (35%)
  - Tag overlap (25%)
  - Location match (20%)
  - Goal alignment (10%)
  - Recency (10%)
- Sorts by score and returns ranked results

### 5. Insights Generator (`src/lib/opportunities-engine/insights-generator.ts`)

Generates AI-powered insights about opportunities:
- **Match Explanation**: Why an opportunity matches the user
- **Skill Gap Analysis**: Identifies missing skills and how to acquire them
- **Career Path Insight**: Shows how opportunity fits into career progression
- **Application Readiness**: Assesses how ready the user is to apply
- **Similar Opportunities**: Finds related opportunities

### 6. Discovery Modes (`src/lib/opportunities-engine/discovery-modes.ts`)

Multiple ways to discover opportunities:
- **For You**: Personalized recommendations (default)
- **Explore**: Serendipitous discovery with diverse results
- **Trending**: Popular recent opportunities
- **Hidden Gems**: Under-discovered high-match opportunities
- **Career Path**: Opportunities building toward career goal
- **Skill Builder**: Opportunities for skill development
- **Location Scout**: Location-based discovery
- **Deadline Approaching**: Time-sensitive opportunities

### 7. API Endpoints

#### Match Endpoint (`src/app/api/opportunities-engine/match/route.ts`)

**Endpoint:** `POST /api/opportunities-engine/match`

**Authentication:** Requires Firebase Bearer token

**Request Body:**
```typescript
{
  userProfile: {
    uid: string (required),
    university?: string,
    degree?: string,
    gpa?: number,
    interests?: string,
    preferredIndustries?: string,
    bio?: string,
    goal?: string,
    city?: string,
    country?: string,
    skills?: string[],
    tags?: string[],
    age?: number,
    yearOfStudy?: number
  },
  types?: OpportunityType[],           // Filter by types
  location?: {
    city?: string,
    country?: string,
    allowRemote?: boolean
  },
  requiredTags?: string[],             // Must have at least one
  preferredTags?: string[],            // Boost score
  excludeExpired?: boolean,             // Default: true
  minDate?: string,                     // ISO date
  maxDate?: string,                     // ISO date
  limit?: number,                       // Default: 20, max: 100
  minScore?: number                     // Default: 0
}
```

**Response:**
```typescript
{
  opportunities: Opportunity[],         // Ranked by score
  totalMatches: number,
  query: OpportunityQuery,
  metadata?: {
    executionTimeMs?: number,
    filtersApplied?: string[]
  }
}
```

## Usage Examples

### Basic Example

```typescript
const response = await fetch('/api/opportunities-engine/match', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${firebaseToken}`
  },
  body: JSON.stringify({
    userProfile: {
      uid: 'user123',
      university: 'University of Auckland',
      degree: 'Computer Science',
      city: 'Auckland',
      country: 'New Zealand',
      skills: ['javascript', 'react', 'python'],
      interests: 'web development, machine learning',
      goal: 'Become a full-stack developer'
    },
    limit: 10
  })
});

const result = await response.json();
console.log(result.opportunities); // Ranked opportunities
```

### Filter by Type

```typescript
const response = await fetch('/api/opportunities-engine/match', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${firebaseToken}`
  },
  body: JSON.stringify({
    userProfile: { uid: 'user123', /* ... */ },
    types: ['job', 'internship'],  // Only jobs and internships
    limit: 5
  })
});
```

### Location Filtering

```typescript
const response = await fetch('/api/opportunities-engine/match', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${firebaseToken}`
  },
  body: JSON.stringify({
    userProfile: { uid: 'user123', /* ... */ },
    location: {
      city: 'Auckland',
      allowRemote: true  // Include remote opportunities
    }
  })
});
```

### Tag-Based Filtering

```typescript
const response = await fetch('/api/opportunities-engine/match', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${firebaseToken}`
  },
  body: JSON.stringify({
    userProfile: { uid: 'user123', /* ... */ },
    requiredTags: ['javascript', 'react'],  // Must have at least one
    preferredTags: ['full-stack', 'node.js']  // Boost score
  })
});
```

## Testing

### Using cURL

```bash
curl -X POST http://localhost:3000/api/opportunities-engine/match \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{
    "userProfile": {
      "uid": "test-user-123",
      "university": "University of Auckland",
      "degree": "Computer Science",
      "city": "Auckland",
      "country": "New Zealand",
      "skills": ["javascript", "react", "python"],
      "interests": "web development, machine learning"
    },
    "limit": 10
  }'
```

### Using the GET Endpoint for Documentation

```bash
curl http://localhost:3000/api/opportunities-engine/match
```

This returns API documentation and example usage.

## Integration Points for Real Data

### 1. Replace Mock Data Source

**File:** `src/lib/opportunities-engine/mock-data.ts`

**Current:** Returns in-memory mock data

**TODO:** Replace `getMockOpportunities()` with:
- Firestore queries for user-submitted opportunities
- External API calls (Adzuna, etc.) for jobs
- University API integration for clubs and events
- Scholarship database queries

**Example:**
```typescript
// Future implementation
export async function getOpportunities(): Promise<Opportunity[]> {
  const [firestoreOpps, adzunaJobs, clubData] = await Promise.all([
    fetchFromFirestore(),
    fetchAdzunaJobs(),
    fetchUniversityClubs()
  ]);
  return [...firestoreOpps, ...adzunaJobs, ...clubData];
}
```

### 2. Enhance Matching Logic

**File:** `src/lib/opportunities-engine/matching-engine.ts`

**Current:** Basic scoring algorithm

**Future Enhancements:**
- Machine learning-based scoring
- User feedback integration (click-through rates, applications)
- Personalized weights based on user behavior
- A/B testing framework

### 3. Add Caching

**Future:** Add Redis or similar caching layer for:
- Frequently queried opportunities
- User profile snapshots
- Pre-computed scores

### 4. Add Real-time Updates

**Future:** Use Firestore real-time listeners to:
- Update opportunities as they're added/modified
- Invalidate cache when data changes
- Push updates to connected clients

## Scoring Algorithm Details

The matching engine uses a weighted scoring system:

1. **Skill Overlap (35%)**: Matches user skills with opportunity tags
2. **Tag Overlap (25%)**: Matches tags from profile (interests, industries, degree) with opportunity tags
3. **Location Match (20%)**: Scores based on city/country matching and remote options
4. **Goal Alignment (10%)**: Checks if opportunity aligns with user's stated goal
5. **Recency (10%)**: More recent opportunities score higher

Scores range from 0-100, with opportunities sorted by score (highest first).

#### Insights Endpoint (`src/app/api/opportunities-engine/insights/route.ts`)

**Endpoint:** `POST /api/opportunities-engine/insights`

**Authentication:** Requires Firebase Bearer token

**Request Body:**
```typescript
{
  opportunity: Opportunity,        // The opportunity to analyze
  userProfile: UserProfileSnapshot, // User profile for matching
  query?: OpportunityQuery         // Optional query context
}
```

**Response:**
```typescript
{
  insights: OpportunityInsight[],  // Array of insights
  matchScore: number,              // Calculated match score
  opportunity: {
    id: string,
    title: string,
    type: OpportunityType
  }
}
```

**Example:**
```typescript
const response = await fetch('/api/opportunities-engine/insights', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${firebaseToken}`
  },
  body: JSON.stringify({
    opportunity: { /* opportunity object */ },
    userProfile: { /* user profile */ }
  })
});

const { insights, matchScore } = await response.json();
```

## Future Enhancements

- [x] Real data integration (Firestore, external APIs) ✅
- [x] AI-powered insights ✅
- [x] Multiple discovery modes ✅
- [ ] Advanced filtering (salary range, date ranges, etc.)
- [ ] User feedback loop (track clicks, applications, saves)
- [ ] Machine learning-based personalization
- [ ] Caching layer for performance
- [ ] Real-time updates via WebSockets
- [ ] Analytics and insights dashboard
- [ ] Batch matching for multiple users
- [ ] Opportunity comparison feature
- [ ] Journey tracking (saved → applied → interview → offer)

## Notes

- The engine is designed to be modular and extensible
- All mock data is clearly marked with `source: 'mock'`
- The API follows existing Gradual conventions (Firebase auth, error handling)
- No existing functionality is affected - this is a new, isolated system

