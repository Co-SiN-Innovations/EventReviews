"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { initFirebase } from "@/lib/firebase-config"

export default function FirebaseInitializer({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Only initialize Firebase once in the browser
    if (typeof window !== "undefined" && !initialized) {
      try {
        console.log("Initializing Firebase in FirebaseInitializer")
        const { auth, db, storage } = initFirebase()
        if (auth && db && storage) {
          console.log("Firebase services initialized successfully")
        } else {
          console.warn("Some Firebase services failed to initialize")
        }
        setInitialized(true)
      } catch (err) {
        console.error("Error initializing Firebase:", err)
        // Still set initialized to true to render children even if there's an error
        setInitialized(true)
      }
    }
  }, [initialized])

  // Always render children
  return <>{children}</>
}

