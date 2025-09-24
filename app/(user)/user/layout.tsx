"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { UserSidebar } from "@/components/user-sidebar"
import { SiteFooter } from "@/components/site-footer"
import { NotificationToast } from "@/components/notification-toast"
import { LoaderIcon } from "@/components/icons"
import { getFirebaseAuth } from "@/lib/firebase-config"
import ActivityTracker from "@/components/activity-tracker"

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get Firebase auth
    const auth = getFirebaseAuth()

    if (!auth) {
      console.error("Auth is not initialized")
      setError("Authentication service is not available")
      setLoading(false)
      return
    }

    // Check if user is logged in
    const unsubscribe = auth.onAuthStateChanged(
      (currentUser) => {
        if (currentUser) {
          setUser(currentUser)
        } else {
          // Redirect to login if not authenticated
          window.location.href = "/login"
          return
        }
        setLoading(false)
      },
      (authError) => {
        console.error("Auth error:", authError)
        setError(authError.message)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-destructive/15 text-destructive p-4 rounded-md max-w-md">
          <h2 className="font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button
            onClick={() => (window.location.href = "/login")}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
          >
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <UserSidebar />
      <div className="flex flex-col">
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">{children}</main>
        <ActivityTracker />
        <SiteFooter />
      </div>
      <NotificationToast />
    </div>
  )
}

