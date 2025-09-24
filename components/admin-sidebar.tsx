"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CalendarIcon,
  HomeIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MessageSquareIcon,
  PlusCircleIcon,
  SettingsIcon,
  UserIcon,
} from "@/components/icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useState, useEffect } from "react"
import { getFirebaseAuth } from "@/lib/firebase-config"

export function AdminSidebar() {
  const pathname = usePathname()
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    const auth = getFirebaseAuth()
    if (auth && auth.currentUser) {
      setUserData({
        name: auth.currentUser.displayName || "Admin",
        email: auth.currentUser.email,
        role: "admin",
      })
    }
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
      href: "/admin/dashboard",
      active: pathname === "/admin/dashboard",
    },
    {
      label: "Events",
      icon: CalendarIcon,
      href: "/admin/events",
      active: pathname === "/admin/events",
    },
    {
      label: "Create Event",
      icon: PlusCircleIcon,
      href: "/admin/events/create",
      active: pathname === "/admin/events/create",
    },
    {
      label: "Reviews",
      icon: MessageSquareIcon,
      href: "/admin/reviews",
      active: pathname === "/admin/reviews",
    },
    {
      label: "Users",
      icon: UserIcon,
      href: "/admin/users",
      active: pathname === "/admin/users",
    },
    {
      label: "Settings",
      icon: SettingsIcon,
      href: "/admin/settings",
      active: pathname === "/admin/settings",
    },
  ]

  return (
    <div className="flex h-full flex-col border-r bg-white dark:bg-darkpurple">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 bg-brightpurple text-primary-foreground">
        <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
          <HomeIcon className="h-6 w-6" />
          <span>Admin Portal</span>
        </Link>
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
              {route.label}
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
          <div className="text-sm font-medium">{userData?.name || "Admin"}</div>
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

