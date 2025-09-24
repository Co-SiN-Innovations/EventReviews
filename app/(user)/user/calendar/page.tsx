"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoaderIcon } from "@/components/icons"
import { EventCalendar } from "@/components/event-calendar"
import { getAllEvents, initializeEvents } from "@/lib/data"
import type { Event } from "@/lib/data"

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [view, setView] = useState<"month" | "week" | "agenda">("month")

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true)

        // Initialize events from localStorage
        initializeEvents()

        // Get all events
        const allEvents = await getAllEvents()

        // Try to get events from Firebase if available
        try {
          const { getAllEvents: getFirebaseEvents } = await import("@/lib/firebase/events")
          const firebaseEvents = await getFirebaseEvents()

          // Merge events from both sources, prioritizing Firebase events
          const eventMap = new Map<string, Event>()

          // Add local events first
          allEvents.forEach((event) => {
            eventMap.set(event.id, event)
          })

          // Add Firebase events, which will overwrite local events with the same ID
          firebaseEvents.forEach((event) => {
            eventMap.set(event.id, event)
          })

          // Convert Map back to array
          setEvents(Array.from(eventMap.values()))
        } catch (error) {
          console.error("Error fetching Firebase events:", error)
          setEvents(allEvents)
        }
      } catch (error) {
        console.error("Error fetching events:", error)
        setEvents([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-orange">Event Calendar</h1>
        <Tabs value={view} onValueChange={(v) => setView(v as "month" | "week" | "agenda")}>
          <TabsList>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoaderIcon className="h-8 w-8 animate-spin text-primary mr-2" />
          <span>Loading calendar...</span>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0 sm:p-6">
            <EventCalendar events={events} view={view} isAdmin={false} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

