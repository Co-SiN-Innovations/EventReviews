"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { SiteFooter } from "@/components/site-footer"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoaderIcon } from "@/components/icons"
import { getAuth, sendPasswordResetEmail } from "firebase/auth"
import { getApps, initializeApp } from "firebase/app"

// Define Firebase config directly in this file to ensure it's available
const firebaseConfig = {
  apiKey: "AIzaSyABo6cHxE0j37NQtVnQI4MREoP6xJqUgEs",
  authDomain: "eventreview-bf129.firebaseapp.com",
  projectId: "eventreview-bf129",
  storageBucket: "eventreview-bf129.appspot.com",
  messagingSenderId: "977520446670",
  appId: "1:977520446670:web:dc50913006485b7cc3d49f",
  measurementId: "G-W2K63NT0W9",
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [firebaseReady, setFirebaseReady] = useState(false)

  // Initialize Firebase directly
  useEffect(() => {
    if (typeof window === "undefined") return

    // Initialize Firebase if not already initialized
    if (!getApps().length) {
      console.log("Initializing Firebase in forgot password page")
      initializeApp(firebaseConfig)
      setFirebaseReady(true)
    } else {
      console.log("Firebase already initialized in forgot password page")
      setFirebaseReady(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsLoading(true)

    if (!firebaseReady) {
      setError("Authentication service is initializing. Please try again in a moment.")
      setIsLoading(false)
      return
    }

    try {
      const auth = getAuth()
      await sendPasswordResetEmail(auth, email)
      setSuccess(true)
    } catch (err: any) {
      console.error("Password reset error:", err)

      if (err.code === "auth/user-not-found") {
        // For security reasons, don't reveal if the email exists or not
        setSuccess(true) // Still show success to prevent email enumeration
      } else if (err.code === "auth/invalid-email") {
        setError("Please provide a valid email address.")
      } else if (err.code === "auth/configuration-not-found") {
        setError("Authentication service is not properly configured. Please try again later.")
      } else {
        setError(err.message || "An unexpected error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-dots">
        <Card className="w-full max-w-md border-primary shadow-lg">
          <CardHeader className="space-y-1 bg-primary text-primary-foreground rounded-t-md">
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription className="text-primary-foreground/90">
              Enter your email to receive a password reset link
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <AlertDescription>
                    Password reset email sent. Please check your inbox and follow the instructions.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-primary/30 focus-visible:ring-primary"
                  disabled={success}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col">
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 shadow-md"
                disabled={isLoading || success || !firebaseReady}
              >
                {isLoading ? (
                  <>
                    <LoaderIcon className="mr-2 h-4 w-4" />
                    Sending...
                  </>
                ) : !firebaseReady ? (
                  <>
                    <LoaderIcon className="mr-2 h-4 w-4" />
                    Initializing...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
              <div className="mt-4 text-center text-sm">
                <Link href="/login" className="text-primary font-semibold underline-offset-4 hover:underline">
                  Back to Login
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
      <SiteFooter />
    </div>
  )
}

