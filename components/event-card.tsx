import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarIcon, MapPinIcon, StarIcon } from "@/components/icons"
import { cn } from "@/lib/utils"

export function EventCard({ event, isAdmin = false }) {
  const eventDate = new Date(event.date)
  // Compare only the date part, not the time
  const today = new Date()
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())

  // An event is upcoming if it's today or in the future
  const isUpcoming = eventDateOnly >= todayDate

  return (
    <Card
      className={cn(
        "overflow-hidden border-secondary/20 event-card shadow-md",
        isUpcoming ? "bg-white" : "bg-lightgray/80",
      )}
    >
      <div className="aspect-video relative">
        <Image src={event.image || "/placeholder.svg"} alt={event.title} fill className="object-cover" />
        <div className="absolute top-0 right-0 p-2">
          <button className="rounded-full bg-white/90 p-1.5 text-brightpurple hover:bg-white shadow-md">
            <StarIcon className="h-5 w-5" fill={event.isFavorite ? "currentColor" : "none"} />
          </button>
        </div>
        {!isUpcoming && (
          <div className="absolute bottom-0 left-0 right-0 bg-orange/90 text-white text-center py-1 text-sm font-semibold">
            Past Event
          </div>
        )}
        {isUpcoming && (
          <div className="absolute top-2 left-2 bg-brightpurple/90 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-md">
            Upcoming Event
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg text-brightpurple">{event.title}</h3>
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4 text-mediumpurple" />
              <span>{eventDate.toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPinIcon className="h-4 w-4 text-mediumpurple" />
              <span>{event.location}</span>
            </div>
          </div>
          <p className="text-sm line-clamp-2">{event.description}</p>
          <div className="pt-2">
            <Link href={`/${isAdmin ? "admin" : "user"}/events/${event.id}`}>
              <Button className="w-full bg-brightpurple hover:bg-brightpurple/90 shadow-md hover-lift">
                View Details
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

