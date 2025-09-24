"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { SiteFooter } from "@/components/site-footer"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoaderIcon } from "@/components/icons"
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase-config"

export default function RegisterPage() {
  const router = useRouter()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [firebaseReady, setFirebaseReady] = useState(false)

  // Check if Firebase auth is ready
  useEffect(() => {
    const auth = getFirebaseAuth()
    const db = getFirebaseDb()

    if (auth && db) {
      setFirebaseReady(true)
    } else {
      // Try again after a short delay
      const timer = setTimeout(() => {
        const retryAuth = getFirebaseAuth()
        const retryDb = getFirebaseDb()
        if (retryAuth && retryDb) {
          setFirebaseReady(true)
        } else {
          setError("Failed to initialize authentication. Please refresh the page.")
        }
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [])

  // Update the handleSubmit function to ensure all necessary user data is stored
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    // Validate password strength
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (!firebaseReady) {
      setError("Authentication service is not ready. Please refresh the page.")
      return
    }

    setIsLoading(true)

    try {
      // Get Firebase services
      const auth = getFirebaseAuth()
      const db = getFirebaseDb()

      if (!auth || !db) {
        throw new Error("Firebase services are not available")
      }

      const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth")
      const { doc, setDoc, serverTimestamp } = await import("firebase/firestore")

      console.log("Starting registration process...")
      const fullName = `${firstName} ${lastName}`.trim()

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      console.log("User created successfully:", user.uid)

      // Update profile with display name
      await updateProfile(user, {
        displayName: fullName,
      })

      // Create user document in Firestore with all necessary fields for admin dashboard
      await setDoc(doc(db, "users", user.uid), {
        name: fullName,
        email,
        avatar: null,
        status: "active",
        joinedAt: serverTimestamp(),
        reviewCount: 0,
        eventsAttended: 0,
        location: "",
        role: email.includes("admin") ? "admin" : "user", // Set admin role for admin emails
        lastLogin: serverTimestamp(),
        // Add additional fields that might be useful for the admin dashboard
        registrationDate: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        isVerified: false,
        favoriteEvents: [],
        attendedEvents: [],
      })

      console.log("User document created in Firestore")
      setSuccess(true)

      // Navigate after a short delay
      setTimeout(() => {
        const isAdmin = email.includes("admin")
        window.location.href = isAdmin ? "/admin/dashboard" : "/user/dashboard"
      }, 1500)
    } catch (err: any) {
      console.error("Registration error details:", {
        code: err.code,
        message: err.message,
        stack: err.stack,
      })

      // Provide more specific error messages based on Firebase error codes
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please login instead.")
      } else if (err.code === "auth/invalid-email") {
        setError("Please provide a valid email address.")
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please use at least 6 characters.")
      } else if (err.code === "auth/configuration-not-found") {
        setError("Authentication service is not properly configured. Please contact support.")
      } else if (err.code === "auth/operation-not-allowed") {
        setError("Email/password accounts are not enabled in Firebase Console.")
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
        <Card className="w-full max-w-md border-secondary shadow-lg">
          <CardHeader className="space-y-1 bg-secondary text-secondary-foreground rounded-t-md">
            <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
            <CardDescription className="text-secondary-foreground/90">
              Enter your information to create an account
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
                <Alert className="bg-green-50 border-green-200 text-green-800">
                  <AlertDescription>Account created successfully! Redirecting...</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="border-secondary/30 focus-visible:ring-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="border-secondary/30 focus-visible:ring-secondary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-secondary/30 focus-visible:ring-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-secondary/30 focus-visible:ring-secondary"
                />
                <p className="text-xs text-muted-foreground">Password must be at least 6 characters</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="border-secondary/30 focus-visible:ring-secondary"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col">
              <Button
                type="submit"
                className="w-full bg-secondary hover:bg-secondary/90 shadow-md"
                disabled={isLoading || !firebaseReady}
              >
                {isLoading ? (
                  <>
                    <LoaderIcon className="mr-2 h-4 w-4" />
                    Creating account...
                  </>
                ) : !firebaseReady ? (
                  <>
                    <LoaderIcon className="mr-2 h-4 w-4" />
                    Initializing...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-semibold underline-offset-4 hover:underline">
                  Login
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

