const COMPLETION_FIELDS = [
  'fullName',
  'university',
  'degree',
  'gpa',
  'interests',
  'city',
  'country',
  'bio',
  'preferredIndustries',
  'portfolioLinks',
  'uploadedCVName',
] as const;

/**
 * Calculate profile completion percentage based on 11 core fields.
 * Works with any object shape (Firestore doc, formData, etc.)
 */
export function calculateProfileCompletion(profile: Record<string, unknown>): number {
  if (!profile) return 0;
  const filled = COMPLETION_FIELDS.filter((f) => {
    const v = profile[f];
    return v != null && String(v).trim() !== '';
  }).length;
  return Math.round((filled / COMPLETION_FIELDS.length) * 100);
}
