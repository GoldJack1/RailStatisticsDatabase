import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD0-OjpeptPX5zG1x0411nkP0cdQq5oWXc",
  authDomain: "rail-statistics.firebaseapp.com",
  databaseURL: "https://rail-statistics-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "rail-statistics",
  storageBucket: "rail-statistics.firebasestorage.app",
  messagingSenderId: "998967146702",
  appId: "1:998967146702:web:deea56da65d25bc92ff89f",
  measurementId: "G-VT13N64VR2"
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
