import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const USE_EMULATOR = process.env.NEXT_PUBLIC_USE_EMULATOR === "true";

if (getApps().length === 0) {
  const newApp = initializeApp(firebaseConfig);

  // App Check with reCAPTCHA Enterprise: only in browser, only outside emulator.
  // In the emulator, App Check tokens are never issued and requireAppCheck() skips
  // enforcement (FUNCTIONS_EMULATOR=true), so we don't initialize here.
  if (!USE_EMULATOR && typeof window !== "undefined") {
    const recaptchaKey = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_RECAPTCHA_KEY;
    if (recaptchaKey) {
      initializeAppCheck(newApp, {
        provider: new ReCaptchaEnterpriseProvider(recaptchaKey),
        isTokenAutoRefreshEnabled: true,
      });
    }
  }

  if (USE_EMULATOR) {
    connectFirestoreEmulator(getFirestore(newApp), "127.0.0.1", 8080);
    connectFunctionsEmulator(getFunctions(newApp, "europe-west1"), "127.0.0.1", 5001);
  }
}

export const app = getApp();
export const db = getFirestore(app);
export const functions = getFunctions(app, "europe-west1");
