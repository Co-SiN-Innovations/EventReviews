import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

// Your Firebase configuration - updated with your provided config
const firebaseConfig = {
  apiKey: "AIzaSyBc2aUWU3g9pbSn-gzR1TV1AXb7tjRZmMw",
  authDomain: "final-2a2e0.firebaseapp.com",
  projectId: "final-2a2e0",
  storageBucket: "final-2a2e0.firebasestorage.app",
  messagingSenderId: "73362565669",
  appId: "1:73362565669:web:bc2eaec27f564f006b2dcc",
  measurementId: "G-2XZ1MLRDB2",
}

// Initialize Firebase
let app
let auth
let db
let storage

// Only initialize in browser environment
if (typeof window !== "undefined") {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig)
  } else {
    app = getApp()
  }

  // Initialize Firebase services
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)
}

export { app, auth, db, storage }

