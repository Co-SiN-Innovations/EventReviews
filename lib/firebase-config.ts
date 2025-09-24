import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

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

// Initialize Firebase only once using a singleton pattern
let firebaseApp
let firebaseAuth
let firebaseDb
let firebaseStorage

export function getFirebaseApp() {
  if (typeof window === "undefined") return null

  if (!firebaseApp) {
    try {
      if (!getApps().length) {
        firebaseApp = initializeApp(firebaseConfig)
      } else {
        firebaseApp = getApp()
      }
    } catch (error) {
      console.error("Error initializing Firebase app:", error)
      return null
    }
  }

  return firebaseApp
}

export function getFirebaseAuth() {
  if (typeof window === "undefined") return null

  if (!firebaseAuth) {
    const app = getFirebaseApp()
    if (!app) return null

    try {
      firebaseAuth = getAuth(app)
    } catch (error) {
      console.error("Error initializing Firebase auth:", error)
      return null
    }
  }

  return firebaseAuth
}

export function getFirebaseDb() {
  if (typeof window === "undefined") return null

  if (!firebaseDb) {
    const app = getFirebaseApp()
    if (!app) return null

    try {
      firebaseDb = getFirestore(app)
    } catch (error) {
      console.error("Error initializing Firebase firestore:", error)
      return null
    }
  }

  return firebaseDb
}

export function getFirebaseStorage() {
  if (typeof window === "undefined") return null

  if (!firebaseStorage) {
    const app = getFirebaseApp()
    if (!app) return null

    try {
      firebaseStorage = getStorage(app)
    } catch (error) {
      console.error("Error initializing Firebase storage:", error)
      return null
    }
  }

  return firebaseStorage
}

// Initialize Firebase on import in client environments
if (typeof window !== "undefined") {
  getFirebaseApp()
  getFirebaseAuth()
  getFirebaseDb()
  getFirebaseStorage()
}

// Export a simple function to get all services at once
export function getFirebaseServices() {
  return {
    app: getFirebaseApp(),
    auth: getFirebaseAuth(),
    db: getFirebaseDb(),
    storage: getFirebaseStorage(),
  }
}

export const initFirebase = () => {
  getFirebaseApp()
  getFirebaseAuth()
  getFirebaseDb()
  getFirebaseStorage()
  return {
    auth: getFirebaseAuth(),
    db: getFirebaseDb(),
    storage: getFirebaseStorage(),
  }
}

