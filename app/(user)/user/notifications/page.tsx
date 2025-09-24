"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BellIcon, CalendarIcon, CheckIcon, MessageSquareIcon } from "@/components/icons"
import { getUserNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "@/lib/data"
import type { Notification } from "@/lib/data"
import { useSearchParams } from "next/navigation"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const searchParams = useSearchParams()
  const highlightId = searchParams.get("highlight")

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true)
      try {
        // Get the current authenticated user
        const { getFirebaseAuth } = await import("@/lib/firebase-config")
        const auth = getFirebaseAuth()

        let userId = "current-user" // Fallback ID

        if (auth && auth.currentUser) {
          userId = auth.currentUser.uid
        }

        const userNotifications = await getUserNotifications(userId)
        setNotifications(userNotifications)
        setIsLoading(false)

        // Auto-mark notifications as read when viewed
        const unreadNotifications = userNotifications.filter((n) => !n.read)
        if (unreadNotifications.length > 0) {
          // Mark all as read after a short delay to ensure the user has seen them
          const timeoutId = setTimeout(() => {
            handleMarkAllAsRead()
          }, 3000) // 3 seconds delay

          return () => clearTimeout(timeoutId)
        }
      } catch (error) {
        console.error("Error fetching notifications:", error)
        setIsLoading(false)
      }
    }

    fetchNotifications()

    // Listen for storage events to update when notifications are added in other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "notifications") {
        fetchNotifications()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  // If a specific notification is highlighted, mark it as read
  useEffect(() => {
    if (highlightId && notifications.length > 0) {
      const notification = notifications.find((n) => n.id === highlightId)
      if (notification && !notification.read) {
        handleMarkAsRead(highlightId)
      }
    }
  }, [highlightId, notifications])

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId)

    // Update local state
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
  }

  const handleMarkAllAsRead = async () => {
    try {
      // Get the current authenticated user
      const { getFirebaseAuth } = await import("@/lib/firebase-config")
      const auth = getFirebaseAuth()

      let userId = "current-user" // Fallback ID

      if (auth && auth.currentUser) {
        userId = auth.currentUser.uid
      }

      await markAllNotificationsAsRead(userId)

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (error) {
      console.error("Error marking all as read:", error)
    }
  }

  const unreadNotifications = notifications.filter((n) => !n.read)
  const eventNotifications = notifications.filter((n) => n.type === "event")
  const systemNotifications = notifications.filter((n) => n.type === "system")
  const reviewNotifications = notifications.filter((n) => n.type === "review")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Notifications</h1>
        {unreadNotifications.length > 0 && (
          <Button
            variant="outline"
            className="gap-2 border-blue text-blue hover:bg-blue/10"
            onClick={handleMarkAllAsRead}
          >
            <CheckIcon className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all" className="relative">
            All
            {notifications.length > 0 && (
              <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-xs">{notifications.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread" className="relative">
            Unread
            {unreadNotifications.length > 0 && (
              <span className="ml-2 rounded-full bg-orange text-white px-1.5 py-0.5 text-xs">
                {unreadNotifications.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="events" className="relative">
            Events
            {eventNotifications.length > 0 && (
              <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-xs">{eventNotifications.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="system" className="relative">
            System
            {systemNotifications.length > 0 && (
              <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-xs">{systemNotifications.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="reviews" className="relative">
            Reviews
            {reviewNotifications.length > 0 && (
              <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-xs">{reviewNotifications.length}</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <NotificationList
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            isLoading={isLoading}
            highlightId={highlightId}
          />
        </TabsContent>

        <TabsContent value="unread" className="mt-4">
          <NotificationList
            notifications={unreadNotifications}
            onMarkAsRead={handleMarkAsRead}
            isLoading={isLoading}
            emptyMessage="No unread notifications"
            highlightId={highlightId}
          />
        </TabsContent>

        <TabsContent value="events" className="mt-4">
          <NotificationList
            notifications={eventNotifications}
            onMarkAsRead={handleMarkAsRead}
            isLoading={isLoading}
            emptyMessage="No event notifications"
            highlightId={highlightId}
          />
        </TabsContent>

        <TabsContent value="system" className="mt-4">
          <NotificationList
            notifications={systemNotifications}
            onMarkAsRead={handleMarkAsRead}
            isLoading={isLoading}
            emptyMessage="No system notifications"
            highlightId={highlightId}
          />
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          <NotificationList
            notifications={reviewNotifications}
            onMarkAsRead={handleMarkAsRead}
            isLoading={isLoading}
            emptyMessage="No review notifications"
            highlightId={highlightId}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface NotificationListProps {
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  isLoading: boolean
  emptyMessage?: string
  highlightId?: string | null
}

function NotificationList({
  notifications,
  onMarkAsRead,
  isLoading,
  emptyMessage = "No notifications",
  highlightId,
}: NotificationListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-pulse text-center">
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BellIcon className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">{emptyMessage}</h3>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          isHighlighted={notification.id === highlightId}
        />
      ))}
    </div>
  )
}

interface NotificationCardProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  isHighlighted?: boolean
}

function NotificationCard({ notification, onMarkAsRead, isHighlighted = false }: NotificationCardProps) {
  const [highlight, setHighlight] = useState(isHighlighted)

  // Scroll to and highlight the notification if it's highlighted
  useEffect(() => {
    if (isHighlighted) {
      // Find the element and scroll to it
      const element = document.getElementById(`notification-${notification.id}`)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" })

        // Mark as read when highlighted
        if (!notification.read) {
          onMarkAsRead(notification.id)
        }
      }

      // Remove highlight after animation completes
      const timer = setTimeout(() => {
        setHighlight(false)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isHighlighted, notification.id, notification.read, onMarkAsRead])

  const getIcon = () => {
    switch (notification.type) {
      case "event":
        return <CalendarIcon className="h-6 w-6 text-blue" />
      case "review":
        return <MessageSquareIcon className="h-6 w-6 text-orange" />
      case "system":
      default:
        return <BellIcon className="h-6 w-6 text-gold" />
    }
  }

  // Format the message to preserve line breaks
  const formattedMessage = notification.message.split("\n").map((line, index) => (
    <p key={index} className="text-sm text-muted-foreground mt-1">
      {line}
    </p>
  ))

  return (
    <Card
      id={`notification-${notification.id}`}
      className={`border-l-4 ${!notification.read ? "border-l-blue" : "border-l-transparent"} 
                 hover:shadow-md transition-shadow
                 ${highlight ? "ring-2 ring-primary ring-offset-2 animate-pulse" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            {getIcon()}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className={`font-medium ${!notification.read ? "text-blue" : ""}`}>{notification.title}</h3>
                <div className="mt-1 space-y-0.5">{formattedMessage}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-blue hover:text-blue"
                  onClick={() => onMarkAsRead(notification.id)}
                >
                  Mark as read
                </Button>
              )}
            </div>
            {notification.actionUrl && (
              <div className="mt-3">
                <Link href={notification.actionUrl}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      if (!notification.read) {
                        onMarkAsRead(notification.id)
                      }
                    }}
                  >
                    View Details
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

