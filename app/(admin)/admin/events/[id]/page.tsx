import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getEventById } from "@/lib/firebase/events"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteEvent } from "@/lib/actions"
import { CalendarIcon, Clock, MapPin, Users, Pencil, Trash2 } from "lucide-react"
import { formatDate } from "@/lib/utils"

// Loading component for the event details
function EventDetailsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-20" />
      </div>
      <Skeleton className="h-[300px] w-full" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

// Event details component
async function EventDetails({ id }: { id: string }) {
  const event = await getEventById(id)

  if (!event) {
    notFound()
  }

  const isUpcoming = new Date(event.date) >= new Date()

  // Handle event deletion
  async function handleDeleteEvent() {
    "use server"

    try {
      const result = await deleteEvent(id)
      if (result) {
        // Redirect to events list after successful deletion
        return { success: true, redirect: "/admin/events" }
      } else {
        return { success: false, error: "Failed to delete event" }
      }
    } catch (error) {
      console.error("Error deleting event:", error)
      return { success: false, error: "An error occurred while deleting the event" }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <div className="flex space-x-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/events/${id}/edit`} className="flex items-center gap-1">
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="flex items-center gap-1">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this event?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the event and remove it from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <form action={handleDeleteEvent}>
                  <AlertDialogAction type="submit" className="bg-destructive text-destructive-foreground">
                    Delete
                  </AlertDialogAction>
                </form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="relative aspect-video overflow-hidden rounded-lg">
        <img
          src={event.image || "/placeholder.svg?height=400&width=800"}
          alt={event.title}
          className="object-cover w-full h-full"
        />
        <div className="absolute top-2 right-2">
          <Badge variant={isUpcoming ? "default" : "secondary"}>{isUpcoming ? "Upcoming" : "Past"}</Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span>{formatDate(event.date)}</span>
            </div>
            {event.time && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{event.time}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>
                {event.attendees} / {event.capacity} attendees
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Event Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Category:</span>
              <Badge variant="outline">{event.category || "General"}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Price:</span>
              <span>{event.price || "Free"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Reviews:</span>
              <span>{event.reviewsCount || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Average Rating:</span>
              <span>{event.averageRating ? `${event.averageRating.toFixed(1)} / 5` : "No ratings yet"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line">{event.description}</p>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">Organized by {event.organizer}</p>
        </CardFooter>
      </Card>

      <div className="flex justify-end">
        <Button asChild variant="outline">
          <Link href="/admin/events">Back to Events</Link>
        </Button>
      </div>
    </div>
  )
}

export default function EventPage({ params }: { params: { id: string } }) {
  return (
    <div className="container py-6">
      <Suspense fallback={<EventDetailsLoading />}>
        <EventDetails id={params.id} />
      </Suspense>
    </div>
  )
}

