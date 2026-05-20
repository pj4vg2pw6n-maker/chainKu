// This module must be the first import in admin.ts.
// It sets FIRESTORE_EMULATOR_HOST before firebase-admin initialises its
// Firestore client, which reads the var at construction time.
// K_SERVICE is injected by Cloud Run in production and is never present in
// the local Firebase Emulator Suite, so this is safe to ship to production.
if (process.env.FUNCTIONS_EMULATOR === "true" && !process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
}
