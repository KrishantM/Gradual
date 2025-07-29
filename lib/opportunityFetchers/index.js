const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fetch = require('node-fetch');

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
  });
}
const db = getFirestore();

// Base Opportunity Fetcher Class
class BaseOpportunityFetcher {
  constructor(name, config = {}) {
    this.name = name;
    this.config = config;
    this.rateLimitDelay = config.rateLimitDelay || 1000; // 1 second default
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  cleanFirestoreFields(obj) {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanFirestoreFields(item));
    }
    
    if (typeof obj === 'object') {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        // Skip fields that start with __ (Firestore reserved)
        if (!key.startsWith('__')) {
          cleaned[key] = this.cleanFirestoreFields(value);
        }
      }
      return cleaned;
    }
    
    return obj;
  }

  async fetchWithRetry(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) {
          return await response.json();
        }
        if (response.status === 429) { // Rate limited
          await this.delay(this.rateLimitDelay * (i + 1));
          continue;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.delay(1000 * (i + 1));
      }
    }
  }

  // Normalize opportunity data to unified format
  normalizeOpportunity(rawData, source) {
    // Clean the data to remove Firestore reserved fields recursively
    const cleanData = this.cleanFirestoreFields(rawData);
    
    return {
      id: cleanData.id || cleanData.job_id || cleanData.external_id || `${source}_${Date.now()}_${Math.random()}`,
      title: cleanData.title || cleanData.job_title || cleanData.name || '',
      description: cleanData.description || cleanData.summary || cleanData.job_description || '',
      location: cleanData.location || cleanData.city || cleanData.place || '',
      company: cleanData.company || cleanData.employer || cleanData.organization || '',
      url: cleanData.url || cleanData.apply_url || cleanData.link || '',
      type: this.determineType(cleanData),
      category: cleanData.category || cleanData.industry || cleanData.sector || '',
      created: cleanData.created || cleanData.posted_date || cleanData.date_posted || new Date().toISOString(),
      salary_min: cleanData.salary_min || cleanData.min_salary || null,
      salary_max: cleanData.salary_max || cleanData.max_salary || null,
      source: source,
      fetchedAt: new Date().toISOString(),
    };
  }

  determineType(rawData) {
    const title = (rawData.title || '').toLowerCase();
    const description = (rawData.description || '').toLowerCase();
    
    if (title.includes('intern') || description.includes('intern') || 
        title.includes('internship') || description.includes('internship')) {
      return 'internship';
    }
    return 'job';
  }

  async storeOpportunities(opportunities) {
    const batch = db.batch();
    opportunities.forEach((opp) => {
      const ref = db.collection('opportunities').doc(opp.id);
      batch.set(ref, opp, { merge: true });
    });
    await batch.commit();
  }

  async fetchOpportunities() {
    throw new Error('fetchOpportunities must be implemented by subclass');
  }
}

// Adzuna Fetcher (NZ/AU focused)
class AdzunaFetcher extends BaseOpportunityFetcher {
  constructor() {
    super('adzuna', { rateLimitDelay: 1000 });
    this.appId = process.env.ADZUNA_APP_ID;
    this.appKey = process.env.ADZUNA_APP_KEY;
    this.country = 'nz'; // New Zealand focus
  }

  async fetchOpportunities(query = 'intern', location = '', resultsPerPage = 20) {
    if (!this.appId || !this.appKey) {
      console.warn('Adzuna credentials not configured');
      return [];
    }

    try {
      const url = `https://api.adzuna.com/v1/api/jobs/${this.country}/search/1?app_id=${this.appId}&app_key=${this.appKey}&results_per_page=${resultsPerPage}&what=${encodeURIComponent(query)}${location ? `&where=${encodeURIComponent(location)}` : ''}`;
      
      const data = await this.fetchWithRetry(url);
      const opportunities = (data.results || []).map(job => {
        return this.normalizeOpportunity(job, 'adzuna');
      });
      
      console.log(`Fetched ${opportunities.length} opportunities from Adzuna`);
      return opportunities;
    } catch (error) {
      console.error('Adzuna fetch error:', error);
      return [];
    }
  }
}

// Note: Removed individual API fetchers to keep it simple
// Focus on Adzuna + TheirStack for NZ/AU market

// Main fetcher orchestrator
class OpportunityFetcherOrchestrator {
  constructor() {
    this.fetchers = {
      adzuna: new AdzunaFetcher()
    };
    
    // Import config to check enabled sources
    const { getEnabledSources } = require('./config');
    this.enabledSources = getEnabledSources();
  }

  async fetchAllOpportunities(queries = ['intern', 'graduate', 'entry level'], locations = ['']) {
    const allOpportunities = [];
    
    for (const [source, fetcher] of Object.entries(this.fetchers)) {
      // Skip disabled sources
      if (!this.enabledSources.includes(source)) {
        console.log(`⏭️  Skipping ${source} (disabled in config)`);
        continue;
      }
      
      try {
        console.log(`Fetching from ${source}...`);
        
        for (const query of queries) {
          for (const location of locations) {
            const opportunities = await fetcher.fetchOpportunities(query, location, 10);
            allOpportunities.push(...opportunities);
            
            // Rate limiting between requests
            await fetcher.delay(fetcher.rateLimitDelay);
          }
        }
      } catch (error) {
        console.error(`Error fetching from ${source}:`, error);
      }
    }

    // Remove duplicates based on title and company
    const uniqueOpportunities = this.removeDuplicates(allOpportunities);
    
    // Store in Firestore
    if (uniqueOpportunities.length > 0) {
      await this.fetchers.adzuna.storeOpportunities(uniqueOpportunities);
      console.log(`Stored ${uniqueOpportunities.length} unique opportunities`);
    }

    return uniqueOpportunities;
  }

  removeDuplicates(opportunities) {
    const seen = new Set();
    return opportunities.filter(opp => {
      // Ensure opp is an object with required properties
      if (!opp || typeof opp !== 'object') {
        return false;
      }
      
      const title = String(opp.title || '').toLowerCase();
      const company = String(opp.company || '').toLowerCase();
      const key = `${title}_${company}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  async fetchFromSource(source, query = 'intern', location = '', limit = 20) {
    const fetcher = this.fetchers[source];
    if (!fetcher) {
      throw new Error(`Unknown source: ${source}`);
    }

    const opportunities = await fetcher.fetchOpportunities(query, location, limit);
    if (opportunities.length > 0) {
      await fetcher.storeOpportunities(opportunities);
    }

    return opportunities;
  }
}

// Export for use in other files
module.exports = {
  BaseOpportunityFetcher,
  AdzunaFetcher,
  OpportunityFetcherOrchestrator
};

// Run if called directly
if (require.main === module) {
  const orchestrator = new OpportunityFetcherOrchestrator();
  orchestrator.fetchAllOpportunities()
    .then(opportunities => {
      console.log(`Total opportunities fetched: ${opportunities.length}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Error in main execution:', error);
      process.exit(1);
    });
} 