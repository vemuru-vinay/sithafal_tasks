// src/services/firebase.js
// ─────────────────────────────────────────────────────────
// SETUP INSTRUCTIONS:
//  1. Go to https://console.firebase.google.com
//  2. Create a new project called "SchoolPass"
//  3. Add a Web app to the project
//  4. Copy your firebaseConfig values below
//  5. Enable Authentication → Email/Password
//  6. Enable Firestore Database (start in test mode)
//  7. Enable Cloud Messaging for push notifications
// ─────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// ── REPLACE THESE WITH YOUR FIREBASE PROJECT VALUES ──────
const firebaseConfig = {
  apiKey: "AIzaSyA_Z2oyR29fqknjwDMa-ly4kB-5vhjjgjE",
  authDomain: "school-pass-82ac4.firebaseapp.com",
  projectId: "school-pass-82ac4",
  storageBucket: "school-pass-82ac4.firebasestorage.app",
  messagingSenderId: "314347181663",
  appId: "1:314347181663:web:152bec0183d8df0d876dea"
};
// ─────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;