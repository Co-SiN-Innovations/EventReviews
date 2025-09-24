import { type NextRequest, NextResponse } from "next/server"
import {
  toggleFavoriteEvent,
  isEventFavorite,
  getUserFavoriteEvents,
  setEventAttendance,
  getUserAttendingEvents,
  setEventReminder,
  getUserEventRelationship,
} from "@/lib/firebase/user-events"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const eventId = searchParams.get("eventId")
    const type = searchParams.get("type") || "relationship"

    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing user ID" }, { status: 400 })
    }

    let result

    switch (type) {
      case "favorites":
        result = await getUserFavoriteEvents(userId)
        return NextResponse.json({ success: true, eventIds: result })

      case "attending":
        result = await getUserAttendingEvents(userId)
        return NextResponse.json({ success: true, eventIds: result })

      case "is-favorite":
        if (!eventId) {
          return NextResponse.json({ success: false, error: "Missing event ID" }, { status: 400 })
        }
        result = await isEventFavorite(userId, eventId)
        return NextResponse.json({ success: true, isFavorite: result })

      case "relationship":
      default:
        if (!eventId) {
          return NextResponse.json({ success: false, error: "Missing event ID" }, { status: 400 })
        }
        result = await getUserEventRelationship(userId, eventId)
        return NextResponse.json(result)
    }
  } catch (error: any) {
    console.error("User-Events API error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, eventId, isFavorite, status, reminderSet } = body

    if (!userId || !eventId) {
      return NextResponse.json({ success: false, error: "Missing user ID or event ID" }, { status: 400 })
    }

    let result

    switch (action) {
      case "toggle-favorite":
        if (isFavorite === undefined) {
          return NextResponse.json({ success: false, error: "Missing favorite status" }, { status: 400 })
        }
        result = await toggleFavoriteEvent(userId, eventId, isFavorite)
        return NextResponse.json({ success: result })

      case "set-attendance":
        if (!status) {
          return NextResponse.json({ success: false, error: "Missing attendance status" }, { status: 400 })
        }
        result = await setEventAttendance(userId, eventId, status)
        return NextResponse.json({ success: result })

      case "set-reminder":
        if (reminderSet === undefined) {
          return NextResponse.json({ success: false, error: "Missing reminder status" }, { status: 400 })
        }
        result = await setEventReminder(userId, eventId, reminderSet)
        return NextResponse.json({ success: result })

      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("User-Events API error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred" },
      { status: 500 },
    )
  }
}

