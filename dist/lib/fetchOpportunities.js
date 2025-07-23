"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAndStoreAdzunaOpportunities = fetchAndStoreAdzunaOpportunities;
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: '.env.local' });
const firebase_service_account_json_1 = __importDefault(require("./firebase-service-account.json"));
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const node_fetch_1 = __importDefault(require("node-fetch"));
// Initialize Firebase Admin SDK
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)({
        credential: (0, app_1.cert)(firebase_service_account_json_1.default),
    });
}
const db = (0, firestore_1.getFirestore)();
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;
const COUNTRY = 'gb';
// Keywords and Locations to loop through
const KEYWORDS = ['intern', 'graduate'];
const LOCATIONS = ['Auckland', 'Wellington', 'Christchurch'];
async function fetchAdzunaJobs(query, location, resultsPerPage) {
    const url = `https://api.adzuna.com/v1/api/jobs/${COUNTRY}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=${resultsPerPage}&what=${encodeURIComponent(query)}${location ? `&where=${encodeURIComponent(location)}` : ''}`;
    const res = await (0, node_fetch_1.default)(url);
    if (!res.ok)
        throw new Error(`Failed to fetch ${query} jobs in ${location}`);
    const data = await res.json();
    return data.results;
}
function normalizeAdzunaJob(job) {
    return {
        source: 'adzuna',
        type: job.category?.label?.toLowerCase().includes('intern')
            ? 'internship'
            : 'job',
        title: job.title,
        description: job.description,
        location: job.location?.display_name || '',
        company: job.company?.display_name || '',
        url: job.redirect_url,
        created: job.created,
        salary_min: job.salary_min ?? null,
        salary_max: job.salary_max ?? null,
        category: job.category?.label || '',
        id: job.id,
        fetchedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
    };
}
async function storeOpportunities(opportunities) {
    const batch = db.batch();
    opportunities.forEach((opp) => {
        const ref = db.collection('opportunities').doc(opp.id);
        batch.set(ref, opp, { merge: true });
    });
    await batch.commit();
}
async function fetchAndStoreAdzunaOpportunities() {
    try {
        let allJobs = [];
        for (const keyword of KEYWORDS) {
            for (const location of LOCATIONS) {
                console.log(`Fetching jobs for "${keyword}" in "${location}"...`);
                const jobs = await fetchAdzunaJobs(keyword, location, 30);
                const normalized = jobs.map(normalizeAdzunaJob);
                allJobs.push(...normalized);
                console.log(`→ Added ${normalized.length} jobs.`);
            }
        }
        await storeOpportunities(allJobs);
        console.log(`✅ Stored ${allJobs.length} total Adzuna opportunities.`);
    }
    catch (err) {
        console.error('❌ Error fetching/storing Adzuna opportunities:', err);
    }
}
if (require.main === module) {
    fetchAndStoreAdzunaOpportunities();
}
