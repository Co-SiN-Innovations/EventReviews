"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchIcon, PlusIcon, CalendarIcon } from "@/components/icons"
import { getAllEvents, initializeEvents } from "@/lib/data"
import type { Event } from "@/lib/data"
import { EventCard } from "@/components/event-card"
import { getAllEvents as getFirebaseEvents } from "@/lib/firebase/events"

export default function AdminEventsPage() {
  const [allEvents, setAllEvents] = useState<Event[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const isFetchingRef = useRef(false)

  // Fetch events on component mount
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

        setAllEvents(all)
        setUpcomingEvents(upcoming)
      } catch (error) {
        console.error("Error fetching events:", error)
      } finally {
        setIsLoading(false)
        isFetchingRef.current = false
      }
    }

    fetchEvents()

    // Set up a polling mechanism to check for new events periodically
    const intervalId = setInterval(() => {
      fetchEvents()
    }, 30000) // Check every 30 seconds

    return () => {
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
        <h1 className="text-3xl font-bold text-blue">Manage Events</h1>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64 md:w-80">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search events..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Link href="/admin/events/create" passHref>
            <Button className="w-full sm:w-auto bg-blue hover:bg-blue/90">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Events</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue border-t-transparent rounded-full"></div>
            </div>
          ) : filteredAllEvents.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAllEvents.map((event) => (
                <EventCard key={event.id} event={event} isAdmin={true} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
              <CalendarIcon className="h-16 w-16 text-blue mb-4" />
              <h3 className="text-xl font-medium mb-2">No events found</h3>
              <p className="text-muted-foreground max-w-md">
                {searchQuery
                  ? "No events match your search criteria. Try a different search term."
                  : "There are no events available. Click 'Create Event' to add a new event."}
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
                <EventCard key={event.id} event={event} isAdmin={true} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
              <CalendarIcon className="h-16 w-16 text-blue mb-4" />
              <h3 className="text-xl font-medium mb-2">No upcoming events</h3>
              <p className="text-muted-foreground max-w-md">
                There are no upcoming events scheduled. Click 'Create Event' to add a new event.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

