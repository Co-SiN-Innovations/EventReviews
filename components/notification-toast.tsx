"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { BellIcon } from "@/components/icons"
import { getUserNotifications, markNotificationAsRead } from "@/lib/data"
import type { Notification } from "@/lib/data"

export function NotificationToast() {
  const router = useRouter()

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const checkForNewNotifications = async () => {
      try {
        // Get the current authenticated user
        const { getFirebaseAuth } = await import("@/lib/firebase-config")
        const auth = getFirebaseAuth()

        let userId = "current-user" // Fallback ID

        if (auth && auth.currentUser) {
          userId = auth.currentUser.uid
        }

        const notifications = await getUserNotifications(userId)

        // Get the most recent unread notification
        const latestUnread = notifications
          .filter((n) => !n.read)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

        if (latestUnread) {
          // Check if this notification was created in the last 5 seconds
          const notificationTime = new Date(latestUnread.createdAt).getTime()
          const currentTime = new Date().getTime()
          const timeDiff = currentTime - notificationTime

          // Only show toast for very recent notifications (within 5 seconds)
          if (timeDiff < 5000) {
            showNotificationToast(latestUnread)
          }
        }

        // Check again after 10 seconds
        timeoutId = setTimeout(checkForNewNotifications, 10000)
      } catch (error) {
        console.error("Error checking for new notifications:", error)
        // Still set up the next check even if there's an error
        timeoutId = setTimeout(checkForNewNotifications, 10000)
      }
    }

    // Initial check
    checkForNewNotifications()

    // Set up storage event listener to check when notifications are added
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "notifications") {
        checkForNewNotifications()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [router])

  // Enhance the notification toast to show more detailed information
  const showNotificationToast = (notification: Notification) => {
    // Format the message to display properly in the toast
    // Show first two lines for preview
    const formattedMessage =
      notification.message.split("\n").slice(0, 2).join("\n") +
      (notification.message.split("\n").length > 2 ? "..." : "")

    // Create action element instead of passing an object
    const actionElement = notification.actionUrl ? (
      <div
        className="cursor-pointer underline text-blue-500"
        onClick={() => {
          markNotificationAsRead(notification.id)
          router.push(notification.actionUrl!)
        }}
      >
        View Details
      </div>
    ) : undefined

    toast({
      title: notification.title,
      description: formattedMessage,
      // Pass the action element directly instead of an object
      action: actionElement,
      icon: <BellIcon className="h-5 w-5 text-blue" />,
      duration: 8000, // Increased duration to give users more time to read
    })
  }

  return null // This component doesn't render anything
}

