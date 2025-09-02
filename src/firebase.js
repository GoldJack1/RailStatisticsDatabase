import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyD0-OjpeptPX5zG1x0411nkP0cdQq5oWXc",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "rail-statistics.firebaseapp.com",
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || "https://rail-statistics-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "rail-statistics",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "rail-statistics.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "998967146702",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:998967146702:web:deea56da65d25bc92ff89f",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-VT13N64VR2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Storage and get a reference to the service
export const storage = getStorage(app);

export default app;
