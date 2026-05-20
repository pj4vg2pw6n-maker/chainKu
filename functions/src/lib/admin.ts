import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const db = admin.firestore();
export { admin };

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
if (emulatorHost) {
  db.settings({ host: emulatorHost, ssl: false });
}
