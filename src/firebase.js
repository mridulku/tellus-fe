// src/firebase.js

import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";




// Use your actual public Firebase config object here:
const firebaseConfig = {
  apiKey: "AIzaSyDj47a5iodjbLBDmmJOo4lk1u9zuqjiyL8",
  authDomain: "comm-app-ff74b.firebaseapp.com",
  projectId: "comm-app-ff74b",
  // Updated storageBucket from ".appspot.com" to ".firebasestorage.app"
  storageBucket: "comm-app-ff74b.firebasestorage.app",
  messagingSenderId: "269808731820",
  appId: "1:269808731820:web:ac58f7218008179bd9c109",
  measurementId: "G-T6BYFQTPHQ",
};

// 1) Initialize the client app
const app = initializeApp(firebaseConfig);

// 2) Initialize Storage (so you can upload files from the client)
export const storage = getStorage(app);
export const auth = getAuth(app);

// If you need other Firebase services (Firestore, Auth, etc.), import and export them here too:
// import { getFirestore } from "firebase/firestore";
// export const db = getFirestore(app);


// 1) Initialize the Firebase App

// 2) Initialize Storage (for file uploads)

// 3) Initialize Auth (for user login)

// 4) Initialize Firestore (for database)
export const db = getFirestore(app);