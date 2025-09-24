"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { NotificationDropdown } from "@/components/notification-dropdown"
import { UserNav } from "@/components/user-nav"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { getAllReviews } from "@/lib/data"

export function AdminHeader() {
  const pathname = usePathname()
  const [newReviewsCount, setNewReviewsCount] = useState(0)

  // Check for new reviews
  useEffect(() => {
    const checkForNewReviews = async () => {
      try {
        // Get all reviews
        const reviews = await getAllReviews()

        // Get seen reviews from localStorage
        let seenReviews: string[] = []
        if (typeof window !== "undefined") {
          const storedSeenReviews = localStorage.getItem("admin-seen-reviews")
          if (storedSeenReviews) {
            try {
              seenReviews = JSON.parse(storedSeenReviews)
            } catch (error) {
              console.error("Error parsing seen reviews:", error)
            }
          }
        }

        // Count new reviews
        const newReviews = reviews.filter((review) => !seenReviews.includes(review.id))
        setNewReviewsCount(newReviews.length)
      } catch (error) {
        console.error("Error checking for new reviews:", error)
      }
    }

    // Check immediately and then every minute
    checkForNewReviews()
    const intervalId = setInterval(checkForNewReviews, 60000)

    return () => clearInterval(intervalId)
  }, [])

  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4 md:px-6">
        <div className="ml-auto flex items-center space-x-4">
          <Link href="/admin/reviews">
            <Button variant="ghost" className="relative">
              Reviews
              {newReviewsCount > 0 && (
                <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[1.25rem] h-5 bg-primary text-primary-foreground">
                  {newReviewsCount > 99 ? "99+" : newReviewsCount}
                </Badge>
              )}
            </Button>
          </Link>
          <NotificationDropdown />
          <UserNav
            user={{
              name: "Admin User",
              email: "admin@example.com",
              image: "/placeholder.svg?height=32&width=32",
            }}
          />
        </div>
      </div>
    </header>
  )
}

