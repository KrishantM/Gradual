"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAndStoreAdzunaOpportunities = fetchAndStoreAdzunaOpportunities;
var app_1 = require("firebase-admin/app");
var firestore_1 = require("firebase-admin/firestore");
var node_fetch_1 = require("node-fetch");
// Initialize Firebase Admin SDK (ensure you have service account credentials in your env)
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)({
        credential: (0, app_1.cert)(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
    });
}
var db = (0, firestore_1.getFirestore)();
// Adzuna API credentials from environment variables
var ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
var ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;
var COUNTRY = 'gb'; // Change as needed
// Fetch jobs/internships from Adzuna
function fetchAdzunaJobs() {
    return __awaiter(this, arguments, void 0, function (query, location, resultsPerPage) {
        var url, res, data;
        if (query === void 0) { query = 'intern'; }
        if (location === void 0) { location = ''; }
        if (resultsPerPage === void 0) { resultsPerPage = 20; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = "https://api.adzuna.com/v1/api/jobs/".concat(COUNTRY, "/search/1?app_id=").concat(ADZUNA_APP_ID, "&app_key=").concat(ADZUNA_APP_KEY, "&results_per_page=").concat(resultsPerPage, "&what=").concat(encodeURIComponent(query)).concat(location ? "&where=".concat(encodeURIComponent(location)) : '');
                    return [4 /*yield*/, (0, node_fetch_1.default)(url)];
                case 1:
                    res = _a.sent();
                    if (!res.ok)
                        throw new Error('Failed to fetch from Adzuna');
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _a.sent();
                    return [2 /*return*/, data.results];
            }
        });
    });
}
// Normalize Adzuna job data to our Firestore schema
function normalizeAdzunaJob(job) {
    var _a, _b, _c, _d;
    return {
        source: 'adzuna',
        type: ((_b = (_a = job.category) === null || _a === void 0 ? void 0 : _a.label) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes('intern')) ? 'internship' : 'job',
        title: job.title,
        description: job.description,
        location: job.location.display_name,
        company: ((_c = job.company) === null || _c === void 0 ? void 0 : _c.display_name) || '',
        url: job.redirect_url,
        created: job.created,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        category: ((_d = job.category) === null || _d === void 0 ? void 0 : _d.label) || '',
        id: job.id,
        // Add more fields as needed
        fetchedAt: new Date().toISOString(),
    };
}
// Store opportunities in Firestore
function storeOpportunities(opportunities) {
    return __awaiter(this, void 0, void 0, function () {
        var batch;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    batch = db.batch();
                    opportunities.forEach(function (opp) {
                        var ref = db.collection('opportunities').doc(opp.id);
                        batch.set(ref, opp, { merge: true });
                    });
                    return [4 /*yield*/, batch.commit()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Main function to fetch and store Adzuna jobs/internships
function fetchAndStoreAdzunaOpportunities() {
    return __awaiter(this, void 0, void 0, function () {
        var jobs, normalized, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetchAdzunaJobs('intern', '', 30)];
                case 1:
                    jobs = _a.sent();
                    normalized = jobs.map(normalizeAdzunaJob);
                    return [4 /*yield*/, storeOpportunities(normalized)];
                case 2:
                    _a.sent();
                    console.log("Stored ".concat(normalized.length, " Adzuna opportunities."));
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    console.error('Error fetching/storing Adzuna opportunities:', err_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Run manually if called directly
if (require.main === module) {
    fetchAndStoreAdzunaOpportunities();
}
// To extend: Add more fetchers for other APIs or scrapers and call them here. 
