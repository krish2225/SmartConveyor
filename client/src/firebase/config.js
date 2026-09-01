/**
 * SmartConveyor - Firebase Client Configuration
 * File: client/src/firebase/config.js
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoSmartConveyorKey_NMDC_SIH26008",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "smartconveyor-nmdc.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "smartconveyor-nmdc",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "smartconveyor-nmdc.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "998271625341",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:998271625341:web:a1b2c3d4e5f6"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, firebaseConfig };
