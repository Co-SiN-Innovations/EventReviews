"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  CalendarIcon,
  MapPinIcon,
  MessageSquareIcon,
  StarIcon,
  UsersIcon,
  Download,
  Bell,
  BellOff,
  LoaderIcon,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getEventById, getEventReviews, initializeEvents } from "@/lib/data"
import { submitReview } from "@/lib/actions"
import { generateGoogleCalendarUrl, generateICalendarFile, generateOutlookCalendarUrl } from "@/lib/calendar-utils"
import type { Event, Review } from "@/lib/data"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/context/auth-context"
import { toggleFavoriteEvent, isEventFavorite } from "@/lib/firebase/user-events"
import { toast } from "@/components/ui/use-toast"
// Add ticket selection functionality to the event details page
// Add this import at the top of the file
import { TicketSelector, type SelectedTicket } from "@/components/ticket-selector"

// Import the SocialShare component
import { SocialShare } from "@/components/social-share"

// Update the ReviewForm component to use the authenticated user's name
function ReviewForm({ eventId }: { eventId: string }) {
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Get the current authenticated user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { getFirebaseAuth } = await import("@/lib/firebase-config")
        const auth = getFirebaseAuth()
        if (auth && auth.currentUser) {
          setUser(auth.currentUser)
        }
      } catch (error) {
        console.error("Error fetching user:", error)
      }
    }

    fetchUser()
  }, [])

  async function handleSubmitReview(formData: FormData) {
    setIsSubmitting(true)
    formData.append("eventId", eventId)
    formData.append("rating", rating.toString())

    try {
      await submitReview(formData)
      setShowForm(false)
    } catch (error) {
      console.error("Error submitting review:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!showForm) {
    return (
      <Button onClick={() => setShowForm(true)} className="w-full gap-2">
        <MessageSquareIcon className="h-4 w-4" />
        Write a Review
      </Button>
    )
  }

  return (
    <form action={handleSubmitReview} className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm font-medium">Your Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} type="button" className="text-yellow-500" onClick={() => setRating(star)}>
              <StarIcon className="h-5 w-5" fill={star <= rating ? "currentColor" : "none"} />
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Your Review</label>
        <Textarea name="comment" placeholder="Share your experience..." required />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setShowForm(false)} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

// Function to generate social share links
const generateSocialShareLinks = (event: Event, baseUrl: string) => {
  const eventUrl = `${baseUrl}/events/${event.id}`
  const encodedEventUrl = encodeURIComponent(eventUrl)
  const text = encodeURIComponent(event.title)

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedEventUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedEventUrl}&text=${text}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedEventUrl}`,
    email: `mailto:?subject=${event.title}&body=Check out this event: ${eventUrl}`,
  }
}

// Update the event details page to include social media sharing
export default function EventDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const eventId = params.id
  const [event, setEvent] = useState<Event | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddToCalendarDialog, setShowAddToCalendarDialog] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [shareLinks, setShareLinks] = useState<Record<string, string>>({})
  const [baseUrl, setBaseUrl] = useState("")
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  // Add a state to track if we're proceeding to checkout
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  useEffect(() => {
    // Set the base URL for sharing
    setBaseUrl(`${window.location.protocol}//${window.location.host}/user`)
  }, [])

  // Check if the event is a favorite for the current user
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (user?.uid && eventId) {
        try {
          const favoriteStatus = await isEventFavorite(user.uid, eventId)
          setIsFavorite(favoriteStatus)
        } catch (error) {
          console.error("Error checking favorite status:", error)
        }
      }
    }

    checkFavoriteStatus()
  }, [user?.uid, eventId])

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Initialize events from localStorage
        initializeEvents()

        // Get the event by ID from local storage
        const localEvent = await getEventById(eventId)

        // Try to get the event from Firebase if not found in local storage
        if (!localEvent) {
          console.log(`Event with ID ${eventId} not found in local storage, trying Firebase...`)
          try {
            // Import Firebase functions only when needed
            const { getEventById: getFirebaseEventById } = await import("@/lib/firebase/events")
            const firebaseEvent = await getFirebaseEventById(eventId)

            if (firebaseEvent) {
              console.log("Found event in Firebase:", firebaseEvent)
              setEvent(firebaseEvent)
              const reviewsData = await getEventReviews(eventId)
              setReviews(reviewsData)

              // Check if reminder is enabled for this event
              const savedReminders = localStorage.getItem("eventReminders")
              if (savedReminders) {
                const reminders = JSON.parse(savedReminders)
                setReminderEnabled(!!reminders[eventId])
              }

              // Generate share links
              if (baseUrl) {
                setShareLinks(generateSocialShareLinks(firebaseEvent, baseUrl))
              }

              setLoading(false)
              return
            }
          } catch (firebaseError) {
            console.error("Error fetching from Firebase:", firebaseError)
          }

          // If we get here, the event wasn't found in either storage
          console.error(`Event with ID ${eventId} not found in any storage`)
          setError("Event not found")
          setLoading(false)
          return
        }

        console.log("Fetched event data from local storage:", localEvent)
        setEvent(localEvent)
        const reviewsData = await getEventReviews(eventId)
        setReviews(reviewsData)

        // Check if reminder is enabled for this event
        const savedReminders = localStorage.getItem("eventReminders")
        if (savedReminders) {
          const reminders = JSON.parse(savedReminders)
          setReminderEnabled(!!reminders[eventId])
        }

        // Generate share links
        if (baseUrl) {
          setShareLinks(generateSocialShareLinks(localEvent, baseUrl))
        }
      } catch (err) {
        console.error("Error fetching event:", err)
        setError("Failed to load event details")
      } finally {
        setLoading(false)
      }
    }

    if (baseUrl) {
      fetchEventData()
    }

    // Listen for storage events to update when events are modified in other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "events") {
        fetchEventData()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [eventId, baseUrl])

  // Handle toggling favorite status
  const handleToggleFavorite = async () => {
    if (!user?.uid || !eventId || favoriteLoading) return

    try {
      setFavoriteLoading(true)
      const newFavoriteStatus = !isFavorite
      const success = await toggleFavoriteEvent(user.uid, eventId, newFavoriteStatus)

      if (success) {
        setIsFavorite(newFavoriteStatus)
        toast({
          title: newFavoriteStatus ? "Added to favorites" : "Removed from favorites",
          description: newFavoriteStatus
            ? "This event has been added to your favorites"
            : "This event has been removed from your favorites",
          duration: 3000,
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to update favorite status",
          variant: "destructive",
          duration: 3000,
        })
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
      toast({
        title: "Error",
        description: "An error occurred while updating favorite status",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setFavoriteLoading(false)
    }
  }

  const toggleReminder = () => {
    const savedReminders = localStorage.getItem("eventReminders")
    const reminders = savedReminders ? JSON.parse(savedReminders) : {}

    if (reminderEnabled) {
      delete reminders[eventId]
    } else {
      reminders[eventId] = true
    }

    localStorage.setItem("eventReminders", JSON.stringify(reminders))
    setReminderEnabled(!reminderEnabled)
  }

  // COMPLETELY REWRITTEN handleProceedToCheckout function to fix the authentication error
  const handleProceedToCheckout = (selectedTickets: SelectedTicket[]) => {
    try {
      // Prevent multiple clicks
      if (isCheckingOut) return
      setIsCheckingOut(true)

      if (!event) {
        toast({
          title: "Error",
          description: "Event information is missing",
          variant: "destructive",
        })
        setIsCheckingOut(false)
        return
      }

      // Check if there are selected tickets
      if (selectedTickets.length === 0) {
        toast({
          title: "No tickets selected",
          description: "Please select at least one ticket to continue",
          variant: "destructive",
        })
        setIsCheckingOut(false)
        return
      }

      // Store selected tickets in localStorage to persist them
      const ticketsParam = encodeURIComponent(JSON.stringify(selectedTickets))
      localStorage.setItem(`checkout-tickets-${event.id}`, JSON.stringify(selectedTickets))

      console.log("Proceeding to checkout with tickets:", selectedTickets)

      // Navigate to checkout page with minimal URL parameters to avoid issues
      router.push(`/user/checkout?eventId=${event.id}`)
    } catch (error) {
      console.error("Error in checkout process:", error)
      toast({
        title: "Checkout Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
      setIsCheckingOut(false)
    }
  }

  // Add this mock ticket data inside the EventDetailsPage component, before the return statement
  const mockTickets = [
    {
      id: "standard",
      name: "Standard Ticket",
      price: event?.price
        ? typeof event.price === "string"
          ? Number.parseFloat(event.price.replace(/[^\d.]/g, "")) || 150
          : event.price
        : 150,
      description: "General admission",
      available: 100,
      maxPerOrder: 10,
    },
    {
      id: "vip",
      name: "VIP Ticket",
      price: event?.price
        ? typeof event.price === "string"
          ? (Number.parseFloat(event.price.replace(/[^\d.]/g, "")) || 150) * 2
          : event.price * 2
        : 300,
      description: "Premium seating with complimentary refreshments",
      available: 20,
      maxPerOrder: 4,
    },
  ]

  // Update the buttons section to include the share dialog
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading event details...</span>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <h1 className="text-2xl font-bold">Event not found</h1>
        <p>The event you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => router.push("/user/events")}>Back to Events</Button>
      </div>
    )
  }

  // Only render the main content when event is available
  return (
    <div className="flex flex-col gap-6">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl">
        <Image src={event.image || "/placeholder.svg"} alt={event.title} fill className="object-cover" />
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{event?.title || "Event"}</h1>
            <div className="flex flex-wrap gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                <span>{event?.date ? new Date(event.date).toLocaleDateString() : "Date TBD"}</span>
                {event?.time && <span> • {event.time}</span>}
              </div>
              <div className="flex items-center gap-1">
                <MapPinIcon className="h-4 w-4" />
                <span>{event?.location || "Location TBD"}</span>
              </div>
              <div className="flex items-center gap-1">
                <UsersIcon className="h-4 w-4" />
                <span>{event?.attendees || 0} attending</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">About this event</h2>
            <p className="text-muted-foreground">{event.description}</p>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Organizer</h2>
            <p className="text-muted-foreground">{event.organizer}</p>
          </div>

          {/* Replace the share button with our new component */}
          <div className="flex flex-wrap gap-2">
            <Button className="gap-2" onClick={handleToggleFavorite} disabled={favoriteLoading}>
              <StarIcon
                className={`h-4 w-4 ${isFavorite ? "text-yellow-500" : ""}`}
                fill={isFavorite ? "currentColor" : "none"}
              />
              {favoriteLoading ? "Updating..." : isFavorite ? "Saved" : "Save"}
            </Button>

            <Button variant="outline" className="gap-2" onClick={toggleReminder}>
              {reminderEnabled ? (
                <>
                  <Bell className="h-4 w-4" />
                  Reminder On
                </>
              ) : (
                <>
                  <BellOff className="h-4 w-4" />
                  Set Reminder
                </>
              )}
            </Button>

            <Dialog open={showAddToCalendarDialog} onOpenChange={setShowAddToCalendarDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Add to Calendar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add to Calendar</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="mb-4">
                    <h3 className="font-medium">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.date).toLocaleDateString()}
                      {event.time && ` • ${event.time}`}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <a
                      href={generateGoogleCalendarUrl(event)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <Image src="/google-calendar-icon.png" alt="Google Calendar" width={20} height={20} />
                        Add to Google Calendar
                      </Button>
                    </a>

                    <a
                      href={generateOutlookCalendarUrl(event)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <Image src="/outlook-icon.png" alt="Outlook" width={20} height={20} />
                        Add to Outlook Calendar
                      </Button>
                    </a>

                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => generateICalendarFile(event)}
                    >
                      <Image src="/ical-icon.png" alt="iCalendar" width={20} height={20} />
                      Download iCalendar File (.ics)
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Replace the share dialog with our new component */}
            <SocialShare event={event} />
          </div>
        </div>

        <div className="w-full md:w-80">
          <TicketSelector
            eventId={event.id}
            tickets={mockTickets}
            onProceedToCheckout={handleProceedToCheckout}
            className="mb-6"
          />

          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <h3 className="font-semibold">Reviews and Ratings</h3>

                <ReviewForm eventId={event.id} />

                <div className="space-y-4 pt-4">
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <div key={review.id} className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={review.userAvatar} alt={review.userName} />
                            <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{review.userName}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(review.date).toLocaleDateString()}
                              </p>
                            </div>
                            {review.rating && (
                              <div className="flex">
                                {Array(review.rating)
                                  .fill(0)
                                  .map((_, i) => (
                                    <StarIcon key={i} className="h-4 w-4 text-yellow-500" fill="currentColor" />
                                  ))}
                              </div>
                            )}
                            <p className="text-sm">{review.comment}</p>

                            {/* Admin reply */}
                            {review.adminReply && (
                              <div className="mt-2 border-l-2 pl-3">
                                <div className="flex items-start gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback>A</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs font-medium">Admin</p>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(review.adminReply.date).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <p className="text-xs">{review.adminReply.comment}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>No reviews yet. Be the first to review!</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

