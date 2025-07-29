// Configuration for all opportunity sources
const config = {
  // Adzuna Configuration (NZ/AU focused)
  adzuna: {
    enabled: true, // Re-enabled with fixed field cleaning
    rateLimitDelay: 1000, // 1 second between requests
    country: 'nz', // New Zealand focus
    maxResultsPerQuery: 20,
    queries: ['intern', 'graduate', 'entry level', 'junior', 'student'],
    locations: ['', 'Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga', 'Dunedin']
  },

  // Global settings
  global: {
    maxTotalOpportunities: 1000, // Maximum opportunities to store per run
    duplicateRemoval: true, // Remove duplicates based on title + company
    cleanupOldOpportunities: true, // Remove opportunities older than 60 days
    cleanupDaysThreshold: 60,
    retryAttempts: 3,
    retryDelay: 1000
  }
};

// Helper function to get enabled sources
function getEnabledSources() {
  return Object.entries(config)
    .filter(([key, value]) => key !== 'global' && value.enabled)
    .map(([key]) => key);
}

// Required environment variables for each source
const requiredCredentials = {
  adzuna: ['ADZUNA_APP_ID', 'ADZUNA_APP_KEY'],
  firebase: ['FIREBASE_SERVICE_ACCOUNT_KEY']
};

export { config, getEnabledSources, requiredCredentials }; 