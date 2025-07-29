require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fetchOpportunitiesEfficient() {
  try {
    console.log('🚀 Starting opportunity fetch...\n');
    
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    
    if (!appId || !appKey) {
      console.error('❌ Adzuna credentials not found in environment variables');
      return;
    }
    
    const allOpportunities = [];
    
    // Simple queries for NZ market
    const queries = ['intern', 'graduate', 'entry level', 'junior', 'student'];
    const locations = ['', 'Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga', 'Dunedin'];
    
    console.log('📊 Fetching from Adzuna...');
    console.log(`   Queries: ${queries.join(', ')}`);
    console.log(`   Locations: ${locations.join(', ')}`);
    console.log('');
    
    // Fetch from Adzuna
    for (const query of queries) {
      for (const location of locations) {
        try {
          const url = `https://api.adzuna.com/v1/api/jobs/nz/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=20&what=${encodeURIComponent(query)}${location ? `&where=${encodeURIComponent(location)}` : ''}`;
          
          const response = await fetch(url);
          const data = await response.json();
          
          if (data.results) {
            const opportunities = data.results.map(job => ({
              id: job.id || `adzuna_${Date.now()}_${Math.random()}`,
              title: job.title || '',
              description: job.description || '',
              location: job.location?.display_name || '',
              company: job.company?.display_name || '',
              url: job.redirect_url || '',
              type: job.category?.label?.toLowerCase().includes('intern') ? 'internship' : 'job',
              category: job.category?.label || '',
              created: job.created || new Date().toISOString(),
              salary_min: job.salary_min || null,
              salary_max: job.salary_max || null,
              source: 'adzuna',
              fetchedAt: new Date().toISOString(),
            }));
            
            allOpportunities.push(...opportunities);
            console.log(`✅ ${query}${location ? ` in ${location}` : ''}: ${opportunities.length} opportunities`);
          }
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`❌ Error fetching ${query}${location ? ` in ${location}` : ''}:`, error.message);
        }
      }
    }
    
    // Remove duplicates
    const uniqueOpportunities = removeDuplicates(allOpportunities);
    
    // Store in Firestore
    if (uniqueOpportunities.length > 0) {
      const batch = db.batch();
      
      uniqueOpportunities.forEach(opportunity => {
        const docRef = db.collection('opportunities').doc(opportunity.id);
        batch.set(docRef, opportunity);
      });
      
      await batch.commit();
      console.log(`\n💾 Stored ${uniqueOpportunities.length} unique opportunities in Firestore`);
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 FETCH SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total opportunities: ${uniqueOpportunities.length}`);
    console.log(`Adzuna opportunities: ${uniqueOpportunities.length}`);
    
    return uniqueOpportunities;
    
  } catch (err) {
    console.error('❌ Error in fetch:', err);
    throw err;
  }
}

function removeDuplicates(opportunities) {
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

// Run the function
fetchOpportunitiesEfficient()
  .then(() => {
    console.log('\n✅ Fetch completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fetch failed:', error);
    process.exit(1);
  }); 