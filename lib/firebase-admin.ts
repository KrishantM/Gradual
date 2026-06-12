import admin from 'firebase-admin';

if (!admin.apps.length) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (raw) {
    // trim() strips a leading BOM (U+FEFF is ECMAScript whitespace) / stray
    // newlines that dashboard-pasted env values can carry, which would
    // otherwise make JSON.parse throw "Unexpected token" at build time.
    const serviceAccount = JSON.parse(raw.trim());
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // No service-account credential in this environment (e.g. a Vercel Preview
    // deploy that wasn't granted the secret). Initialise a bare app so that
    // importing this module during `next build` page-data collection does not
    // crash the build. Any firebase-admin call still fails at request time —
    // which is fine, since credential-less environments don't serve real data.
    console.warn(
      '[firebase-admin] FIREBASE_SERVICE_ACCOUNT_KEY not set — initialising without credentials.'
    );
    admin.initializeApp();
  }
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
