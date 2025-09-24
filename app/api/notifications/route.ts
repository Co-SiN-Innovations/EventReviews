import { type NextRequest, NextResponse } from "next/server"
import {
  getUserNotifications,
  getUnreadNotificationCount,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/firebase/notifications"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const countOnly = searchParams.get("countOnly") === "true"

    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing user ID" }, { status: 400 })
    }

    if (countOnly) {
      // Get unread notification count
      const count = await getUnreadNotificationCount(userId)
      return NextResponse.json({ success: true, count })
    } else {
      // Get all notifications for user
      const notifications = await getUserNotifications(userId)
      return NextResponse.json({ success: true, notifications })
    }
  } catch (error: any) {
    console.error("Notifications API error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, notificationData, notificationId, userId } = body

    let result

    switch (action) {
      case "create":
        if (!notificationData) {
          return NextResponse.json({ success: false, error: "Missing notification data" }, { status: 400 })
        }
        result = await createNotification(notificationData)
        break

      case "mark-read":
        if (!notificationId) {
          return NextResponse.json({ success: false, error: "Missing notification ID" }, { status: 400 })
        }
        result = await markNotificationAsRead(notificationId)
        return NextResponse.json({ success: result })

      case "mark-all-read":
        if (!userId) {
          return NextResponse.json({ success: false, error: "Missing user ID" }, { status: 400 })
        }
        result = await markAllNotificationsAsRead(userId)
        return NextResponse.json({ success: result })

      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Notifications API error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred" },
      { status: 500 },
    )
  }
}

