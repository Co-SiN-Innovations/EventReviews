"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { initFirebase } from "@/lib/firebase-config"

export function Providers({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false)

  // Initialize Firebase once at the top level
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      console.log("Initializing Firebase in Providers")
      initFirebase()
      setInitialized(true)
    } catch (err) {
      console.error("Error initializing Firebase:", err)
    }
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      {children}
      <Toaster />
    </ThemeProvider>
  )
}

