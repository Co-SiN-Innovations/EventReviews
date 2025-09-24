"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { User } from "firebase/auth"
import { onAuthStateChanged } from "firebase/auth"
import { getFirebaseServices } from "@/lib/firebase-config"
// Add this import at the top of the file
import { updateUserLastSeen } from "@/lib/firebase/auth-utils"
import { getDoc, doc, setDoc, serverTimestamp } from "firebase/firestore"

type AuthContextType = {
  user: User | null
  userData: any | null
  loading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  error: null,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Set up auth state listener
  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    // Add console logging to debug the auth context
    // Find the AuthProvider component and add these logs:

    // Inside the useEffect that sets up the auth state observer
    console.log("Setting up auth state observer")
    const { auth, db } = getFirebaseServices()

    if (!auth) {
      console.error("Auth is not initialized")
      setError("Authentication service is not available")
      setLoading(false)
      return
    }

    // Set up auth state observer
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setLoading(true)

      if (authUser) {
        try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, "users", authUser.uid))

          if (userDoc.exists()) {
            const userData = userDoc.data()
            setUser({
              uid: authUser.uid,
              email: authUser.email,
              ...userData,
            })

            // Update lastSeen timestamp
            updateUserLastSeen(authUser.uid)
          } else {
            // Create new user document if it doesn't exist
            const newUser = {
              uid: authUser.uid,
              email: authUser.email,
              name: authUser.displayName || "User",
              role: "user",
              status: "active",
              createdAt: serverTimestamp(),
              lastSeen: serverTimestamp(),
            }

            await setDoc(doc(db, "users", authUser.uid), newUser)
            setUser(newUser)
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          setUser(null)
        }
      } else {
        setUser(null)
      }

      setLoading(false)
    })

    // Clean up subscription
    return () => unsubscribe()
  }, [])

  // Add a new useEffect to update lastSeen periodically while the user is active
  useEffect(() => {
    if (!user?.uid) return

    // Update lastSeen on initial load
    updateUserLastSeen(user.uid)

    // Set up interval to update lastSeen every 5 minutes while user is active
    const intervalId = setInterval(
      () => {
        updateUserLastSeen(user.uid)
      },
      5 * 60 * 1000,
    ) // 5 minutes

    // Set up activity listeners to update lastSeen on user interaction
    const activityEvents = ["mousedown", "keydown", "touchstart", "scroll"]
    let timeout

    const handleActivity = () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        if (user?.uid) {
          updateUserLastSeen(user.uid)
        }
      }, 1000) // Debounce to prevent too many updates
    }

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity)
    })

    return () => {
      clearInterval(intervalId)
      clearTimeout(timeout)
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [user?.uid])

  const value = {
    user,
    userData,
    loading,
    error,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

