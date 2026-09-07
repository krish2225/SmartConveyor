/**
 * SmartConveyor - Firebase Client Configuration
 * Project: ConveyorBelt-PdM (SIH 2026)
 * Region: asia-south1 (Mumbai)
 * File: client/src/firebase/config.js
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAm3BqAwmWBz__C7SAKOhDhADxiVDE38No",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "conveyorbelt-pdm.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "conveyorbelt-pdm",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "conveyorbelt-pdm.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "442274925279",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:442274925279:web:afea81ae499e7315e5376a"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, firebaseConfig };
