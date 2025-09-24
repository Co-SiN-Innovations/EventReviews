"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { SiteFooter } from "@/components/site-footer"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoaderIcon } from "@/components/icons"
import { getFirebaseAuth } from "@/lib/firebase-config"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const returnUrl = searchParams.get("returnUrl") || ""

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [firebaseReady, setFirebaseReady] = useState(false)

  // Check if Firebase auth is ready
  useEffect(() => {
    const auth = getFirebaseAuth()
    if (auth) {
      setFirebaseReady(true)
    } else {
      // Try again after a short delay
      const timer = setTimeout(() => {
        const retryAuth = getFirebaseAuth()
        if (retryAuth) {
          setFirebaseReady(true)
        } else {
          setError("Failed to initialize authentication. Please refresh the page.")
        }
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [])

  const handleDemoLogin = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    setSuccess(false)

    if (!firebaseReady) {
      setError("Authentication service is not ready. Please refresh the page.")
      setIsLoading(false)
      return
    }

    try {
      const auth = getFirebaseAuth()
      if (!auth) {
        throw new Error("Authentication service is not available")
      }

      const { signInWithEmailAndPassword } = await import("firebase/auth")

      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log("User signed in successfully:", userCredential.user.uid)

      // Show success message
      setSuccess(true)

      // Determine if user is admin based on email
      const isAdmin = email === "admin@gmail.com"

      // Navigate after a short delay
      setTimeout(() => {
        window.location.href = isAdmin ? "/admin/dashboard" : returnUrl || "/user/dashboard"
      }, 1000)
    } catch (err: any) {
      console.error("Login error:", err)

      // Provide more specific error messages
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("Invalid email or password. Please try again or register a new account.")
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed login attempts. Please try again later or reset your password.")
      } else if (err.code === "auth/user-disabled") {
        setError("This account has been disabled. Please contact support.")
      } else {
        setError(err.message || "Failed to sign in")
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
            <CardTitle className="text-2xl font-bold">Login</CardTitle>
            <CardDescription className="text-primary-foreground/90">
              Enter your credentials to access your account
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
                  <AlertDescription>Login successful! Redirecting...</AlertDescription>
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
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-sm text-primary underline-offset-4 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-primary/30 focus-visible:ring-primary"
                />
              </div>

              <div className="text-sm text-muted-foreground p-3 bg-secondary/10 rounded-md border border-secondary/30">
                <p className="font-semibold text-foreground">Demo credentials:</p>
                <div className="mt-2 space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleDemoLogin("admin@gmail.com", "qwertyui")}
                  >
                    Login as Admin
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleDemoLogin("user@example.com", "password")}
                  >
                    Login as User
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col">
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 shadow-md"
                disabled={isLoading || !firebaseReady}
              >
                {isLoading ? (
                  <>
                    <LoaderIcon className="mr-2 h-4 w-4" />
                    Logging in...
                  </>
                ) : !firebaseReady ? (
                  <>
                    <LoaderIcon className="mr-2 h-4 w-4" />
                    Initializing...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-secondary font-semibold underline-offset-4 hover:underline">
                  Sign up
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

