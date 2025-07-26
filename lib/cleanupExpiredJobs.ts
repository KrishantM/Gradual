import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY!.replace(/\\n/g, '\n')
);


if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount as any),
  });
}

const db = getFirestore();

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
