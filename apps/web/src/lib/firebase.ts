import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (getApps().length === 0) {
  const newApp = initializeApp(firebaseConfig);
  if (process.env.NEXT_PUBLIC_USE_EMULATOR === "true") {
    connectFirestoreEmulator(getFirestore(newApp), "127.0.0.1", 8080);
    connectFunctionsEmulator(getFunctions(newApp), "127.0.0.1", 5001);
  }
}

export const app = getApp();
export const db = getFirestore(app);
export const functions = getFunctions(app);
