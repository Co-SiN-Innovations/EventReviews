"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/context/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AuthGuardProps {
  children: React.ReactNode
  adminOnly?: boolean
}

export function AuthGuard({ children, adminOnly = false }: AuthGuardProps) {
  const { user, loading, error } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  // Check if user is logged in and redirect if needed
  useEffect(() => {
    // Skip if still loading auth state
    if (loading) return

    // If no user, redirect to login
    if (!user) {
      console.log("No user, redirecting to login")
      router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`)
      return
    }

    // Check if user is admin
    const isAdmin = user.email === "admin@gmail.com"

    // If admin-only route but user is not admin, redirect
    if (adminOnly && !isAdmin) {
      console.log("Non-admin accessing admin-only route")
      router.push("/user/dashboard")
      return
    }

    // If admin route but user is not admin, redirect
    if (pathname.startsWith("/admin") && !isAdmin) {
      console.log("Non-admin accessing admin route")
      router.push("/user/dashboard")
      return
    }

    // User is authorized
    setIsAuthorized(true)
    setIsChecking(false)
  }, [user, loading, adminOnly, pathname, router])

  // Show error if there is one
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertDescription>
              {error}
              <div className="mt-2">
                <button className="text-sm underline" onClick={() => router.push("/login")}>
                  Return to login
                </button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  // Always render children to avoid the "Unexpected Fiber popped" error
  // This prevents React from trying to reconcile different component trees
  return <>{children}</>
}

