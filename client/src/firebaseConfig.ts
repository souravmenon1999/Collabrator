// src/firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAnalytics, FirebaseAnalytics } from 'firebase/analytics'; // Import types for analytics
import { getMessaging, FirebaseMessaging } from 'firebase/messaging'; // Import types for messaging
// import { getDatabase, FirebaseDatabase } from 'firebase/database'; // Import getDatabase and Database type from firebase/database

import { getFirestore, FirebaseFirestore } from 'firebase/firestore'; // Import Firestore

// Define a type for your Firebase config object
interface firebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string; // measurementId is optional
}


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const firebaseApp = initializeApp(firebaseConfig);
const analytics: FirebaseAnalytics | undefined = getAnalytics(firebaseApp); // Explicitly type analytics (can be undefined)
const messaging: FirebaseMessaging = getMessaging(firebaseApp);    // Explicitly type messaging
// const db: FirebaseDatabase = getDatabase(firebaseApp); // Initialize Firebase Database and explicitly type it


const db: FirebaseFirestore = getFirestore(firebaseApp); // Initialize Firestore and explicitly type it

export default firebaseApp;
export { messaging, analytics, db }; // Export db along with other modules