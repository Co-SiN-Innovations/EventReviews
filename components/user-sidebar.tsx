"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BellIcon,
  CalendarIcon,
  HomeIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MessageSquareIcon,
  SettingsIcon,
  StarIcon,
  UserIcon,
  TicketIcon,
} from "@/components/icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { NotificationDropdown } from "@/components/notification-dropdown"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { getFirebaseAuth } from "@/lib/firebase-config"
import { getUnreadNotificationCount } from "@/lib/data"

export function UserSidebar() {
  const pathname = usePathname()
  const [userData, setUserData] = useState<any>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const auth = getFirebaseAuth()
    if (auth && auth.currentUser) {
      setUserData({
        name: auth.currentUser.displayName || "User",
        email: auth.currentUser.email,
        role: "user",
      })
    }

    // Simplified notification count - don't wait for it to load
    const fetchUnreadCount = async () => {
      try {
        const count = await getUnreadNotificationCount("current-user")
        setUnreadCount(count)
      } catch (error) {
        console.error("Error fetching notification count:", error)
      }
    }

    fetchUnreadCount()
  }, [])

  const handleSignOut = async () => {
    try {
      const auth = getFirebaseAuth()
      if (auth) {
        const { signOut } = await import("firebase/auth")
        await signOut(auth)
        // Use window.location for a hard redirect to avoid React context issues
        window.location.href = "/login"
      }
    } catch (error) {
      console.error("Error signing out:", error)
      // Still redirect even if there's an error
      window.location.href = "/login"
    }
  }

  const routes = [
    {
      label: "Dashboard",
      icon: LayoutDashboardIcon,
      href: "/user/dashboard",
      active: pathname === "/user/dashboard",
    },
    {
      label: "Events",
      icon: CalendarIcon,
      href: "/user/events",
      active: pathname === "/user/events",
    },
    {
      label: "Tickets",
      icon: TicketIcon,
      href: "/user/tickets",
      active: pathname === "/user/tickets",
    },
    {
      label: "Calendar",
      icon: CalendarIcon,
      href: "/user/calendar",
      active: pathname === "/user/calendar",
    },
    {
      label: "My Reviews",
      icon: MessageSquareIcon,
      href: "/user/reviews",
      active: pathname === "/user/reviews",
    },
    {
      label: "Favorites",
      icon: StarIcon,
      href: "/user/favorites",
      active: pathname === "/user/favorites",
    },
    {
      label: "Profile",
      icon: UserIcon,
      href: "/user/profile",
      active: pathname === "/user/profile",
    },
    {
      label: "Notifications",
      icon: BellIcon,
      href: "/user/notifications",
      active: pathname === "/user/notifications",
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      label: "Settings",
      icon: SettingsIcon,
      href: "/user/settings",
      active: pathname === "/user/settings",
    },
  ]

  return (
    <div className="flex h-full flex-col border-r bg-white dark:bg-mediumpurple">
      <div className="flex h-14 items-center justify-between border-b px-4 lg:h-[60px] lg:px-6 bg-secondary text-secondary-foreground">
        <Link href="/user/dashboard" className="flex items-center gap-2 font-semibold">
          <HomeIcon className="h-6 w-6" />
          <span>User Portal</span>
        </Link>
        <NotificationDropdown />
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-brightpurple",
                route.active && "bg-brightpurple/10 text-brightpurple font-semibold",
              )}
            >
              <route.icon className="h-4 w-4" />
              <span className="flex-1">{route.label}</span>
              {route.badge && <Badge className="bg-orange text-white">{route.badge > 99 ? "99+" : route.badge}</Badge>}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <div className="mb-4 px-3 py-2">
          <div className="text-sm font-medium">{userData?.name || "User"}</div>
          <div className="text-xs text-muted-foreground truncate">{userData?.email}</div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 border-brightpurple text-brightpurple hover:bg-brightpurple/10"
          onClick={handleSignOut}
        >
          <LogOutIcon className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}

