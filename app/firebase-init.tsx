"use client"

import type React from "react"

import { useEffect, useState, createContext, useContext } from "react"
import { initializeApp, getApps } from "firebase/app"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

// Firebase configuration - updated with your provided config
const firebaseConfig = {
  apiKey: "AIzaSyBc2aUWU3g9pbSn-gzR1TV1AXb7tjRZmMw",
  authDomain: "final-2a2e0.firebaseapp.com",
  projectId: "final-2a2e0",
  storageBucket: "final-2a2e0.firebasestorage.app",
  messagingSenderId: "73362565669",
  appId: "1:73362565669:web:bc2eaec27f564f006b2dcc",
  measurementId: "G-2XZ1MLRDB2",
}

// Firebase services
let app
let auth
let db
let storage

// Initialize Firebase
if (typeof window !== "undefined" && !getApps().length) {
  try {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)
    console.log("Firebase initialized successfully")
  } catch (error) {
    console.error("Firebase initialization error:", error)
  }
}

// Firebase context
type FirebaseContextType = {
  auth: any
  db: any
  storage: any
  user: any
  loading: boolean
  error: string | null
}

const FirebaseContext = createContext<FirebaseContextType>({
  auth: null,
  db: null,
  storage: null,
  user: null,
  loading: true,
  error: null,
})

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Check if Firebase is initialized
    if (!auth) {
      setError("Firebase authentication is not available")
      setLoading(false)
      return
    }

    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        console.log("Auth state changed:", user ? `User: ${user.email}` : "No user")
        setUser(user)
        setLoading(false)
      },
      (error) => {
        console.error("Auth state error:", error)
        setError(error.message)
        setLoading(false)
      },
    )

    // Clean up
    return () => unsubscribe()
  }, [])

  return (
    <FirebaseContext.Provider
      value={{
        auth,
        db,
        storage,
        user,
        loading,
        error,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  )
}

export function useFirebase() {
  return useContext(FirebaseContext)
}

