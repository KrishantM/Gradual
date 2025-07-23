"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const firebase_service_account_json_1 = __importDefault(require("./firebase-service-account.json"));
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)({
        credential: (0, app_1.cert)(firebase_service_account_json_1.default),
    });
}
const db = (0, firestore_1.getFirestore)();
async function cleanupExpiredJobs() {
    const now = new Date().toISOString();
    const snapshot = await db
        .collection('opportunities')
        .where('expiresAt', '<=', now)
        .get();
    if (snapshot.empty) {
        console.log('No expired jobs to delete.');
        return;
    }
    const batch = db.batch();
    snapshot.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`Deleted ${snapshot.size} expired jobs.`);
}
if (require.main === module) {
    cleanupExpiredJobs();
}
