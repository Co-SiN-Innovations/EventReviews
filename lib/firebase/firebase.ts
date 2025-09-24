// This file is now just a re-export of Firebase services
// We're initializing Firebase directly in the components that need it

import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getApps, initializeApp } from "firebase/app"

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyABo6cHxE0j37NQtVnQI4MREoP6xJqUgEs",
  authDomain: "eventreview-bf129.firebaseapp.com",
  projectId: "eventreview-bf129",
  storageBucket: "eventreview-bf129.appspot.com",
  messagingSenderId: "977520446670",
  appId: "1:977520446670:web:dc50913006485b7cc3d49f",
  measurementId: "G-W2K63NT0W9",
}

// Initialize Firebase only in browser environment
let auth
let db
let storage

if (typeof window !== "undefined") {
  // Initialize Firebase if not already initialized
  if (!getApps().length) {
    initializeApp(firebaseConfig)
  }

  // Initialize services
  auth = getAuth()
  db = getFirestore()
  storage = getStorage()
}

export { auth, db, storage, onAuthStateChanged }

