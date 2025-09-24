"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { getUnreadNotificationCount } from "@/lib/data"

interface NotificationBadgeProps {
  className?: string
}

export function NotificationBadge({ className }: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        // Get the current authenticated user
        const { getFirebaseAuth } = await import("@/lib/firebase-config")
        const auth = getFirebaseAuth()

        let userId = "current-user" // Fallback ID

        if (auth && auth.currentUser) {
          userId = auth.currentUser.uid
        }

        const count = await getUnreadNotificationCount(userId)
        setUnreadCount(count)
      } catch (error) {
        console.error("Error fetching unread count:", error)
      }
    }

    fetchUnreadCount()

    // Listen for storage events to update when notifications change
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "notifications") {
        fetchUnreadCount()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // Also set up a polling mechanism to check for new notifications periodically
    const intervalId = setInterval(fetchUnreadCount, 30000) // Check every 30 seconds

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(intervalId)
    }
  }, [])

  if (unreadCount === 0) return null

  return <Badge className={`bg-orange text-white ${className}`}>{unreadCount > 99 ? "99+" : unreadCount}</Badge>
}

