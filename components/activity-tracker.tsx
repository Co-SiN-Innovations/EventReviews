"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/context/auth-context"
import { updateLastSeen } from "@/lib/firebase/auth"

// This component tracks user activity and updates the lastSeen timestamp
export default function ActivityTracker() {
  const { user } = useAuth()

  useEffect(() => {
    // Only track activity if a user is logged in
    if (!user) return

    // Update lastSeen when component mounts (user loads a page)
    const updateTimestamp = async () => {
      await updateLastSeen(user.uid)
    }
    updateTimestamp()

    // Set up event listeners to track user activity
    const activityEvents = ["mousedown", "keydown", "scroll", "touchstart"]
    let activityTimeout: NodeJS.Timeout | null = null

    const handleUserActivity = () => {
      // Debounce the updates to avoid too many writes to Firebase
      if (activityTimeout) {
        clearTimeout(activityTimeout)
      }

      activityTimeout = setTimeout(() => {
        updateLastSeen(user.uid)
      }, 60000) // Update at most once per minute when active
    }

    // Add event listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity)
    })

    // Set up periodic updates even if user is idle but page is open
    const intervalId = setInterval(() => {
      updateLastSeen(user.uid)
    }, 300000) // Update every 5 minutes if page is open

    // Clean up
    return () => {
      if (activityTimeout) {
        clearTimeout(activityTimeout)
      }
      clearInterval(intervalId)
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity)
      })
    }
  }, [user])

  // This is a utility component that doesn't render anything
  return null
}

