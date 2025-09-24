"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/context/auth-context"
import { getFavoriteEvents } from "@/lib/firebase/events"
import { EventCard } from "@/components/event-card"
import { Button } from "@/components/ui/button"
import { Star, Loader2 } from "lucide-react"
import Link from "next/link"
import type { Event } from "@/lib/data"

export default function FavoritesPage() {
  const { user } = useAuth()
  const [favoriteEvents, setFavoriteEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFavoriteEvents = async () => {
      if (!user?.uid) return

      try {
        setIsLoading(true)
        const events = await getFavoriteEvents(user.uid)
        setFavoriteEvents(events)
      } catch (error) {
        console.error("Error fetching favorite events:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user?.uid) {
      fetchFavoriteEvents()
    } else {
      setIsLoading(false)
    }
  }, [user?.uid])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>Loading your favorite events...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <h1 className="text-2xl font-bold">Sign in to view your favorites</h1>
        <p>You need to be signed in to view your favorite events.</p>
        <Link href="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Favorite Events</h1>
        <Link href="/user/events">
          <Button variant="outline">Browse All Events</Button>
        </Link>
      </div>

      {favoriteEvents.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favoriteEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Star className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No favorite events yet</h2>
          <p className="text-muted-foreground max-w-md mb-6">
            When you find events you're interested in, click the star icon to add them to your favorites for easy
            access.
          </p>
          <Link href="/user/events">
            <Button>Browse Events</Button>
          </Link>
        </div>
      )}
    </div>
  )
}

