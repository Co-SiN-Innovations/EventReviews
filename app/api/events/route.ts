import { type NextRequest, NextResponse } from "next/server"
import {
  getAllEvents,
  getEventById,
  getRecentEvents,
  getUpcomingEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleFavoriteEvent,
} from "@/lib/firebase/events"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const type = searchParams.get("type") || "all"
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit") as string) : undefined

    let result

    if (id) {
      // Get specific event
      result = await getEventById(id)
      if (!result) {
        return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 })
      }
      return NextResponse.json({ success: true, event: result })
    }

    // Get events by type
    switch (type) {
      case "recent":
        result = await getRecentEvents(limit)
        break
      case "upcoming":
        result = await getUpcomingEvents()
        break
      case "all":
      default:
        result = await getAllEvents()
        break
    }

    return NextResponse.json({ success: true, events: result })
  } catch (error: any) {
    console.error("Events API error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, eventData, eventId, userId, isFavorite } = body

    let result

    switch (action) {
      case "create":
        if (!eventData) {
          return NextResponse.json({ success: false, error: "Missing event data" }, { status: 400 })
        }
        result = await createEvent(eventData)
        break

      case "update":
        if (!eventId || !eventData) {
          return NextResponse.json({ success: false, error: "Missing event ID or data" }, { status: 400 })
        }
        result = await updateEvent(eventId, eventData)
        break

      case "delete":
        if (!eventId) {
          return NextResponse.json({ success: false, error: "Missing event ID" }, { status: 400 })
        }
        result = await deleteEvent(eventId)
        return NextResponse.json({ success: result })

      case "toggle-favorite":
        if (!eventId || !userId || isFavorite === undefined) {
          return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 })
        }
        result = await toggleFavoriteEvent(userId, eventId, isFavorite)
        return NextResponse.json({ success: result })

      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Events API error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred" },
      { status: 500 },
    )
  }
}

