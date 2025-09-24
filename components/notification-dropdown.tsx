"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { BellIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/data"
import type { Notification } from "@/lib/data"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch notifications when dropdown is opened
  useEffect(() => {
    if (isOpen && !isLoading) {
      const fetchNotifications = async () => {
        try {
          setIsLoading(true)
          // In a real app, we would get the current user ID from auth
          const userId = "current-user"
          const userNotifications = await getUserNotifications(userId)
          setNotifications(userNotifications)
          setUnreadCount(userNotifications.filter((n) => !n.read).length)
        } catch (error) {
          console.error("Error fetching notifications:", error)
        } finally {
          setIsLoading(false)
        }
      }

      fetchNotifications()
    }
  }, [isOpen, isLoading])

  // Handle marking a notification as read
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id)

      // Update local state
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }

    setIsOpen(false)
  }

  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    // In a real app, we would get the current user ID from auth
    const userId = "current-user"
    await markAllNotificationsAsRead(userId)

    // Update local state
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[1.25rem] h-5 bg-orange text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-blue hover:text-blue"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="py-4 px-2 text-center text-muted-foreground">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="py-4 px-2 text-center text-muted-foreground">No notifications yet</div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex flex-col items-start p-3 cursor-pointer",
                  !notification.read && "bg-muted/50",
                  notification.type === "review" && "border-l-2 border-primary",
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">{notification.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 whitespace-normal">
                  {notification.message.split("\n\n")[0]}
                </p>
                {notification.type === "review" && (
                  <Button variant="link" className="p-0 h-auto mt-1 text-xs text-primary">
                    View and respond
                  </Button>
                )}
              </DropdownMenuItem>
            ))}
          </div>
        )}

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <Link href="/user/notifications" className="block">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-center text-blue"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Button>
            </Link>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

