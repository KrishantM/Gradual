import admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const firestore = admin.firestore();
// Allow optional fields (e.g. PathwayStep.suggestions) to be stored as
// `undefined` instead of throwing — settings() must be called once before
// any read/write, and is a no-op if already configured to the same value.
try {
  firestore.settings({ ignoreUndefinedProperties: true });
} catch {
  /* settings already applied — safe to ignore on hot reload */
}

export const auth = admin.auth();
export const db = firestore;
