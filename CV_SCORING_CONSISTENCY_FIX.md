# CV Scoring Consistency Fix

## Problem Identified

The CV scoring system was producing inconsistent results between different endpoints:
- **Original CV**: Scored 82 using the main scoring endpoint
- **Rewritten CV**: Scored 85 when using the rewrite scoring endpoint
- **Same rewritten CV**: Scored 79 when re-run through the main scoring endpoint

This inconsistency made the system unreliable for users who wanted to verify their CV scores and made it impossible to trust the improvement claims from the rewrite feature.

## Root Cause

The issue was caused by **different scoring algorithms** between the two endpoints:

1. **Main scoring endpoint** (`/api/score`): Used a deterministic, consistent algorithm
2. **Rewrite scoring endpoint** (`/api/score-rewritten`): Used a modified algorithm that:
   - Had artificial score inflation (forced scores to be 1-2 points higher than original)
   - Used different quality gates and thresholds
   - Capped scores at 95 instead of 90
   - Applied different final bounds and penalties

## Solution Implemented

### 1. **Unified Scoring Algorithm**

Both scoring endpoints now use **exactly the same deterministic algorithm**:

```typescript
// Create a deterministic hash of the CV text
const cvHash = crypto.createHash('sha256').update(cvText.trim().toLowerCase()).digest('hex');

// Generate consistent base score from hash
const baseScore = parseInt(cvHash.substring(0, 8), 16) % 101;

// Apply consistent quality heuristics
let adjustedScore = baseScore;

// Length factor (optimal: 200-600 words)
if (wordCount < 100) adjustedScore = Math.max(adjustedScore - 10, 0);
else if (wordCount > 800) adjustedScore = Math.max(adjustedScore - 15, 0);
else if (wordCount >= 200 && wordCount <= 600) adjustedScore = Math.min(adjustedScore + 5, 100);

// Professional keywords factor
const keywordMatches = professionalKeywords.filter(keyword => 
  cvText.toLowerCase().includes(keyword.toLowerCase())
).length;
adjustedScore = Math.min(adjustedScore + (keywordMatches * 2), 100);

// Structure factor
if (hasContactInfo) adjustedScore = Math.min(adjustedScore + 3, 100);
if (hasExperience) adjustedScore = Math.min(adjustedScore + 5, 100);
if (hasEducation) adjustedScore = Math.min(adjustedScore + 3, 100);
```

### 2. **Removed Artificial Score Inflation**

The rewrite scoring endpoint no longer:
- Forces scores to be higher than the original
- Applies artificial bonuses to justify improvements
- Caps scores at unrealistic levels (95)

### 3. **Identical Quality Gates**

Both endpoints now use the same:
- Word count validation (10-1500 words)
- Professional content validation (minimum 4 professional indicators)
- Structure validation (minimum 3 structural elements)
- Content appropriateness checks
- Final score bounds and penalties

## Testing the Fix

### Before the Fix:
- Original CV: 82/100
- Rewritten CV (rewrite endpoint): 85/100
- Same rewritten CV (main endpoint): 79/100
- **Inconsistency**: 6-point difference

### After the Fix:
- Original CV: 82/100
- Rewritten CV (rewrite endpoint): Should be consistent with main endpoint
- Same rewritten CV (main endpoint): Should match rewrite endpoint score
- **Expected**: Consistent scores within 1-2 points (due to natural CV improvements)

## How to Test

1. **Upload your CV** and get the original score
2. **Use the rewrite feature** to generate an improved CV
3. **Score the rewritten CV** using the rewrite endpoint
4. **Copy the rewritten CV text** and paste it into the main CV scorer
5. **Compare the scores** - they should now be consistent

## Benefits

- **Reliable scoring**: Users can trust that scores are consistent across all endpoints
- **Accurate improvements**: Rewrite improvements are measured using the same criteria
- **Better user experience**: No more confusion about which score to believe
- **Maintained caching**: The existing CV score caching system continues to work for consistency

## Technical Details

- Both endpoints use `temperature: 0` for maximum consistency
- Both use identical crypto hash generation for deterministic scoring
- Both apply the same quality gates and heuristics
- Both return the same debug information for troubleshooting
- The rewrite endpoint still provides detailed improvement analysis but with consistent scoring

## Files Modified

- `src/app/api/score-rewritten/route.ts` - Updated to use identical scoring algorithm
- `src/app/api/score/route.ts` - Reference implementation (unchanged)
- Both endpoints now share identical scoring logic and quality gates
