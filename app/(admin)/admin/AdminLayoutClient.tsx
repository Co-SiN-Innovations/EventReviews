"use client"

import type React from "react"
import { Suspense } from "react"
import { useEffect, useState } from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminHeader } from "@/components/admin-header"
import { Toaster } from "@/components/ui/toaster"
import { LoaderIcon } from "@/components/icons"
import { getFirebaseAuth } from "@/lib/firebase-config"

export default function AdminLayoutClient({
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
          // Check if user is admin
          if (currentUser.email !== "admin@gmail.com") {
            console.log("Non-admin accessing admin route")
            window.location.href = "/user/dashboard"
            return
          }
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
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1">
        <Suspense fallback={<div className="p-4">Loading header...</div>}>
          <AdminHeader />
        </Suspense>
        <main className="p-6 md:p-8 pt-6">
          <Suspense fallback={<div className="p-4">Loading content...</div>}>{children}</Suspense>
        </main>
        <Toaster />
      </div>
    </div>
  )
}

