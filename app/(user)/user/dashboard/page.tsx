"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, MessageSquare, Star, ChevronRight } from "lucide-react"
import { getUpcomingEvents } from "@/lib/firebase/events"
import { getUserReviews } from "@/lib/firebase/reviews"
import { getUserFavoriteEvents } from "@/lib/firebase/user-events"
import { useAuth } from "@/lib/context/auth-context"
import type { Event } from "@/lib/data"

export default function UserDashboard() {
  const { user } = useAuth()
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [reviewsCount, setReviewsCount] = useState(0)
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch upcoming events, reviews count, and favorites count on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return

      try {
        setIsLoading(true)
        setError(null)

        // Fetch upcoming events - get all events without limiting
        const events = await getUpcomingEvents()
        setUpcomingEvents(events)

        // Fetch user reviews to get the count
        const reviews = await getUserReviews(user.uid)
        setReviewsCount(reviews.length)

        // Fetch user favorite events to get the count
        const favoriteEventIds = await getUserFavoriteEvents(user.uid)
        setFavoritesCount(favoriteEventIds.length)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setError("Failed to load dashboard data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    if (user?.uid) {
      fetchData()
    }
  }, [user?.uid])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">User Dashboard</h1>
        <Link href="/user/events">
          <Button className="gap-2 shadow-md hover:shadow-lg transition-shadow">
            <Calendar className="h-4 w-4" />
            Browse Events
          </Button>
        </Link>
      </div>

      {error && <div className="bg-destructive/10 text-destructive p-4 rounded-md">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-primary/20 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{isLoading ? "..." : upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground">Events in the next 30 days</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{isLoading ? "..." : reviewsCount}</div>
            <p className="text-xs text-muted-foreground">Reviews you've submitted</p>
          </CardContent>
        </Card>

        <Link href="/user/favorites" className="block">
          <Card className="border-primary/20 shadow-md hover:shadow-lg transition-shadow h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favorite Events</CardTitle>
              <Star className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{isLoading ? "..." : favoritesCount}</div>
              <p className="text-xs text-muted-foreground">Events you've saved</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Events happening soon</CardDescription>
          </div>
          <Link href="/user/events">
            <Button variant="outline" size="sm" className="gap-1">
              View All <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Calendar className="h-8 w-8 animate-spin text-primary mr-2" />
              <span>Loading events...</span>
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {/* Display ALL upcoming events without limiting */}
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-4 hover:bg-muted/50 p-2 rounded-md transition-colors"
                >
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                    <Image
                      src={event.image || "/placeholder.svg?height=64&width=64"}
                      alt={event.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium leading-none">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.date).toLocaleDateString()} • {event.location}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <Link href={`/user/events/${event.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No upcoming events</p>
              <p className="text-xs text-muted-foreground mt-1">Check back later for new events</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

