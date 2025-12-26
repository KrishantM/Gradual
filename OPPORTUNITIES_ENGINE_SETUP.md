# Opportunities Engine - Setup Summary

## ✅ What Was Created

The foundation for the Opportunities Engine has been successfully created with the following components:

### 1. Shared Types (`src/types/opportunities.ts`)
- `Opportunity` - Core opportunity data structure
- `OpportunityType` - Types: 'job', 'internship', 'club', 'volunteering', 'event', 'scholarship'
- `OpportunityQuery` - Input to the matching engine
- `UserProfileSnapshot` - Simplified user profile for matching
- `OpportunityMatchResult` - Result from the matching engine

### 2. Mock Data (`src/lib/opportunities-engine/mock-data.ts`)
- **18 sample opportunities** covering all types:
  - 3 jobs
  - 2 internships
  - 3 clubs
  - 3 volunteering opportunities
  - 4 events
  - 3 scholarships
- All opportunities include realistic data (locations, tags, descriptions, etc.)
- Functions to retrieve mock data: `getMockOpportunities()`, `getMockOpportunitiesByType()`

### 3. Matching Engine (`src/lib/opportunities-engine/matching-engine.ts`)
- Core matching logic with weighted scoring:
  - Skill overlap (35%)
  - Tag overlap (25%)
  - Location match (20%)
  - Goal alignment (10%)
  - Recency (10%)
- Filtering by type, location, tags, dates, expiration
- Main function: `matchOpportunities(query: OpportunityQuery)`

### 4. API Endpoint (`src/app/api/opportunities-engine/match/route.ts`)
- **POST** `/api/opportunities-engine/match` - Match opportunities
- **GET** `/api/opportunities-engine/match` - API documentation
- Firebase authentication required
- Follows existing project conventions

### 5. Documentation (`src/lib/opportunities-engine/README.md`)
- Complete usage guide
- API documentation
- Integration points for real data
- Examples and testing instructions

## 🚀 How to Test the API

### 1. Get a Firebase Token

You'll need a valid Firebase ID token. In your frontend code:

```typescript
const user = firebase.auth().currentUser;
const token = await user.getIdToken();
```

### 2. Make a POST Request

```typescript
const response = await fetch('/api/opportunities-engine/match', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
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
    types: ['job', 'internship'],  // Optional: filter by types
    location: {
      city: 'Auckland',
      allowRemote: true
    },
    limit: 10
  })
});

const result = await response.json();
console.log(result.opportunities); // Ranked opportunities with scores
```

### 3. View API Documentation

```bash
curl http://localhost:3000/api/opportunities-engine/match
```

Or visit in browser: `http://localhost:3000/api/opportunities-engine/match`

## 📁 File Structure

```
src/
├── types/
│   └── opportunities.ts                    # Shared TypeScript types
├── lib/
│   └── opportunities-engine/
│       ├── mock-data.ts                    # Mock opportunity dataset (18 items)
│       ├── matching-engine.ts              # Core matching and scoring logic
│       └── README.md                        # Detailed documentation
└── app/
    └── api/
        └── opportunities-engine/
            └── match/
                └── route.ts                # API endpoint
```

## 🔄 Integration Points for Real Data

### Replace Mock Data Source

**File:** `src/lib/opportunities-engine/mock-data.ts`

**Current:** Returns in-memory mock data via `getMockOpportunities()`

**Future:** Replace with:
1. **Firestore queries** for user-submitted opportunities
2. **External API calls** (Adzuna, etc.) for jobs
3. **University API integration** for clubs and events
4. **Scholarship database queries**

**Example future implementation:**
```typescript
export async function getOpportunities(): Promise<Opportunity[]> {
  const [firestoreOpps, adzunaJobs, clubData] = await Promise.all([
    fetchFromFirestore('opportunities'),
    fetchAdzunaJobs(),
    fetchUniversityClubs()
  ]);
  return [...firestoreOpps, ...adzunaJobs, ...clubData];
}
```

Then update `matching-engine.ts` to use the async function:
```typescript
// In matchOpportunities function:
let opportunities = await getOpportunities(); // Instead of getMockOpportunities()
```

### Enhance Matching Logic

**File:** `src/lib/opportunities-engine/matching-engine.ts`

**Current:** Basic weighted scoring algorithm

**Future enhancements:**
- Machine learning-based scoring
- User feedback integration (track clicks, applications, saves)
- Personalized weights based on user behavior
- A/B testing framework

## 🎯 Key Features

✅ **Modular Architecture** - Easy to extend and modify
✅ **Type-Safe** - Full TypeScript support
✅ **Mock Data** - 18 realistic sample opportunities
✅ **Flexible Filtering** - By type, location, tags, dates
✅ **Weighted Scoring** - Multi-factor matching algorithm
✅ **Authentication** - Firebase token-based security
✅ **Well Documented** - Comprehensive README and inline comments
✅ **No Breaking Changes** - Completely isolated from existing code

## ⚠️ Important Notes

1. **Mock-Only Implementation**: All data is currently in-memory mock data. Real data integration is marked with `TODO` comments.

2. **Separate from Existing Route**: The new engine is at `/api/opportunities-engine/match`, separate from the existing `/api/opportunities` route. No conflicts.

3. **Authentication Required**: All requests require a valid Firebase Bearer token.

4. **Score Range**: Opportunities are scored 0-100 and sorted by score (highest first).

5. **Default Behavior**: 
   - `excludeExpired: true` (default)
   - `limit: 20` (default, max: 100)
   - `minScore: 0` (default)

## 📝 Next Steps

1. **Test the API** using the examples above
2. **Integrate with Frontend** - Add UI components to display matched opportunities
3. **Add Real Data Sources** - Replace mock data with Firestore/external APIs
4. **Enhance Scoring** - Add ML-based personalization
5. **Add Caching** - Implement Redis or similar for performance
6. **Add Analytics** - Track matching performance and user engagement

## 🔍 Example Response

```json
{
  "opportunities": [
    {
      "id": "mock-job-1",
      "title": "Software Engineer - Graduate Program",
      "type": "job",
      "organization": "TechCorp NZ",
      "location": "Auckland, New Zealand",
      "score": 87,
      ...
    },
    ...
  ],
  "totalMatches": 12,
  "query": { ... },
  "metadata": {
    "executionTimeMs": 15,
    "filtersApplied": ["types: job, internship", "location: city: Auckland, remote: allowed"]
  }
}
```

## 🛠️ Development

All files are ready to use. The engine is fully functional with mock data and can be tested immediately. When ready to integrate real data, follow the integration points outlined in `src/lib/opportunities-engine/README.md`.

---

**Status**: ✅ Complete and ready for testing
**Mock Data**: ✅ 18 opportunities across all types
**API**: ✅ Fully functional with authentication
**Documentation**: ✅ Complete

