import admin from 'firebase-admin';

if (!admin.apps.length) {
  // Trim leading/trailing whitespace before parsing. Env values pasted through
  // some dashboards (e.g. Vercel) can pick up a U+FEFF byte-order mark, which
  // JSON.parse rejects with "Unexpected token" at build time. trim() removes a
  // leading BOM (U+FEFF is ECMAScript whitespace) along with stray newlines.
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY!.trim();
  const serviceAccount = JSON.parse(raw);
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
