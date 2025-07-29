import admin from 'firebase-admin';
import { getEnabledSources } from './config.js';

// Base class for all opportunity fetchers
class BaseOpportunityFetcher {
  constructor(source, config = {}) {
    this.source = source;
    this.rateLimitDelay = config.rateLimitDelay || 1000;
    this.maxRetries = config.maxRetries || 3;
    
    // Initialize Firebase Admin if not already done
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    this.db = admin.firestore();
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchWithRetry(url, options = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'User-Agent': 'Gradual-Opportunity-Fetcher/1.0',
            ...options.headers
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt} failed for ${url}: ${error.message}`);
        
        if (attempt < this.maxRetries) {
          await this.delay(this.rateLimitDelay * attempt);
        }
      }
    }
    
    throw lastError;
  }

  // Recursively clean Firestore reserved fields (starting with __)
  cleanFirestoreFields(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanFirestoreFields(item));
    }
    
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (!key.startsWith('__')) {
        cleaned[key] = this.cleanFirestoreFields(value);
      }
    }
    return cleaned;
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

  determineType(data) {
    const title = (data.title || '').toLowerCase();
    const description = (data.description || '').toLowerCase();
    const category = (data.category || '').toLowerCase();
    
    if (title.includes('intern') || description.includes('intern') || category.includes('intern')) {
      return 'internship';
    }
    
    return 'job';
  }

  async storeOpportunities(opportunities) {
    const batch = this.db.batch();
    opportunities.forEach((opp) => {
      const ref = this.db.collection('opportunities').doc(opp.id);
      batch.set(ref, opp, { merge: true });
    });
    await batch.commit();
  }

  async fetchOpportunities(query = 'intern', location = '', resultsPerPage = 20) {
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

// Orchestrator to manage multiple fetchers
class OpportunityFetcherOrchestrator {
  constructor() {
    this.fetchers = {
      adzuna: new AdzunaFetcher(),
    };
    
    this.enabledSources = getEnabledSources();
  }

  removeDuplicates(opportunities) {
    const seen = new Set();
    return opportunities.filter(opp => {
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

export { BaseOpportunityFetcher, AdzunaFetcher, OpportunityFetcherOrchestrator }; 