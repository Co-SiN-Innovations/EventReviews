"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchIcon, CalendarIcon, StarIcon } from "@/components/icons"
import { getAllEvents, initializeEvents } from "@/lib/data"
import type { Event } from "@/lib/data"
import { EventCard } from "@/components/event-card"
import { NotificationToast } from "@/components/notification-toast"
import { getAllEvents as getFirebaseEvents } from "@/lib/firebase/events"

export default function UserEventsPage() {
  const [allEvents, setAllEvents] = useState<Event[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [favoriteEvents, setFavoriteEvents] = useState<Event[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const isFetchingRef = useRef(false)

  // Fetch events on component mount and when localStorage changes
  useEffect(() => {
    const fetchEvents = async () => {
      // Prevent concurrent fetches (fixes "Should not already be working" error)
      if (isFetchingRef.current) return

      isFetchingRef.current = true
      setIsLoading(true)

      try {
        // Initialize events from localStorage
        initializeEvents()

        // Get events from local storage
        const localAll = await getAllEvents()

        // Get events from Firebase
        let firebaseEvents: Event[] = []
        try {
          firebaseEvents = await getFirebaseEvents()
          console.log("Firebase events loaded:", firebaseEvents.length)
        } catch (error) {
          console.error("Error fetching Firebase events:", error)
        }

        // Merge events from both sources, prioritizing Firebase events
        // Use a Map to deduplicate by ID
        const eventMap = new Map<string, Event>()

        // Add local events first
        localAll.forEach((event) => {
          eventMap.set(event.id, event)
        })

        // Add Firebase events, which will overwrite local events with the same ID
        firebaseEvents.forEach((event) => {
          eventMap.set(event.id, event)
        })

        // Convert Map back to array
        const all = Array.from(eventMap.values())

        // Sort by creation date (newest first)
        all.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime()
          const dateB = new Date(b.createdAt || 0).getTime()
          return dateB - dateA
        })

        // Filter for upcoming events
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        const upcoming = all
          .filter((event) => {
            const eventDate = new Date(event.date)
            const eventDateStartOfDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
            return eventDateStartOfDay >= today
          })
          .sort((a, b) => {
            const dateA = new Date(a.date || 0).getTime()
            const dateB = new Date(b.date || 0).getTime()
            return dateA - dateB
          })

        // Get favorites
        const favorites = all.filter((event) => event.isFavorite)

        setAllEvents(all)
        setUpcomingEvents(upcoming)
        setFavoriteEvents(favorites)
      } catch (error) {
        console.error("Error fetching events:", error)
      } finally {
        setIsLoading(false)
        isFetchingRef.current = false
      }
    }

    fetchEvents()

    // Listen for storage events to update when events are added in other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "events" || e.key === "notifications") {
        fetchEvents()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // Also set up a polling mechanism to check for new events periodically
    const intervalId = setInterval(() => {
      fetchEvents()
    }, 30000) // Check every 30 seconds (increased from 10 to reduce potential race conditions)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(intervalId)
    }
  }, [])

  // Filter events based on search query
  const filteredAllEvents = allEvents.filter(
    (event) =>
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-orange">Explore Events</h1>
        <div className="relative w-full sm:w-64 md:w-80">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search events..."
            className="w-full pl-8 border-blue/30 focus-visible:ring-blue"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-lightgray dark:bg-accent">
          <TabsTrigger value="all" className="data-[state=active]:bg-orange data-[state=active]:text-white">
            All Events
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-orange data-[state=active]:text-white">
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="favorites" className="data-[state=active]:bg-orange data-[state=active]:text-white">
            Favorites
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue border-t-transparent rounded-full"></div>
            </div>
          ) : filteredAllEvents.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAllEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-lightgray/50 rounded-lg border border-gold/20 shadow-md">
              <CalendarIcon className="h-16 w-16 text-gold mb-4" />
              <h3 className="text-xl font-medium mb-2 text-blue">No events found</h3>
              <p className="text-muted-foreground max-w-md">
                {searchQuery
                  ? "No events match your search criteria. Try a different search term."
                  : "There are no events available at the moment. Check back later for new events."}
              </p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="upcoming" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue border-t-transparent rounded-full"></div>
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-lightgray/50 rounded-lg border border-gold/20 shadow-md">
              <CalendarIcon className="h-16 w-16 text-gold mb-4" />
              <h3 className="text-xl font-medium mb-2 text-blue">No upcoming events</h3>
              <p className="text-muted-foreground max-w-md">
                There are no upcoming events scheduled at the moment. Check back later for new events.
              </p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="favorites" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue border-t-transparent rounded-full"></div>
            </div>
          ) : favoriteEvents.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {favoriteEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-lightgray/50 rounded-lg border border-gold/20 shadow-md">
              <StarIcon className="h-16 w-16 text-gold mb-4" />
              <h3 className="text-xl font-medium mb-2 text-blue">No favorite events</h3>
              <p className="text-muted-foreground max-w-md">
                You haven't saved any events as favorites yet. Browse events and click the star icon to add them to your
                favorites.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Notification toast component */}
      <NotificationToast />
    </div>
  )
}

