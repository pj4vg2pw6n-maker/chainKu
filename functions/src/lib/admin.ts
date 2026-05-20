import "./emulatorSetup"; // must be first: sets FIRESTORE_EMULATOR_HOST before firebase-admin loads
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const db = admin.firestore();
export { admin };
