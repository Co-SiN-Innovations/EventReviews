import { type NextRequest, NextResponse } from "next/server"
import {
  getAllUsers,
  getActiveUsers,
  getRecentUsers,
  updateUserProfile,
  getUserEventAttendance,
} from "@/lib/firebase/users"
import { getUserData } from "@/lib/firebase/auth"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const type = searchParams.get("type") || "all"
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit") as string) : undefined

    let result

    if (userId) {
      // Get specific user data
      result = await getUserData(userId)
      if (!result.success) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
      }
      return NextResponse.json(result)
    }

    // Get users by type
    switch (type) {
      case "active":
        result = await getActiveUsers()
        break
      case "recent":
        result = await getRecentUsers(limit)
        break
      case "all":
      default:
        result = await getAllUsers()
        break
    }

    return NextResponse.json({ success: true, users: result })
  } catch (error: any) {
    console.error("Users API error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, profileData } = body

    let result

    switch (action) {
      case "update-profile":
        if (!userId || !profileData) {
          return NextResponse.json({ success: false, error: "Missing user ID or profile data" }, { status: 400 })
        }
        result = await updateUserProfile(userId, profileData)
        break

      case "get-attendance":
        if (!userId) {
          return NextResponse.json({ success: false, error: "Missing user ID" }, { status: 400 })
        }
        result = await getUserEventAttendance(userId)
        return NextResponse.json({ success: true, eventIds: result })

      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Users API error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred" },
      { status: 500 },
    )
  }
}

