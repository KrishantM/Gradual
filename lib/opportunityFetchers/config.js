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

// Helper function to get source config
function getSourceConfig(source) {
  return config[source] || null;
}

// Helper function to get global config
function getGlobalConfig() {
  return config.global;
}

// Helper function to validate API credentials
function validateCredentials() {
  const requiredCredentials = {
    adzuna: ['ADZUNA_APP_ID', 'ADZUNA_APP_KEY']
  };

  const missingCredentials = {};
  const enabledSources = getEnabledSources();

  enabledSources.forEach(source => {
    const required = requiredCredentials[source] || [];
    const missing = required.filter(cred => !process.env[cred]);
    
    if (missing.length > 0) {
      missingCredentials[source] = missing;
    }
  });

  return {
    isValid: Object.keys(missingCredentials).length === 0,
    missingCredentials
  };
}

module.exports = {
  config,
  getEnabledSources,
  getSourceConfig,
  getGlobalConfig,
  validateCredentials
}; 