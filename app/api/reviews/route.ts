import { type NextRequest, NextResponse } from "next/server"
import {
  getEventReviews,
  getUserReviews,
  getAllReviews,
  createReview,
  addReplyToReview,
  updateReviewSentiment,
} from "@/lib/firebase/reviews"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")
    const userId = searchParams.get("userId")
    const type = searchParams.get("type") || "all"

    let result

    if (eventId) {
      // Get reviews for a specific event
      result = await getEventReviews(eventId)
      return NextResponse.json({ success: true, reviews: result })
    }

    if (userId) {
      // Get reviews by a specific user
      result = await getUserReviews(userId)
      return NextResponse.json({ success: true, reviews: result })
    }

    // Get all reviews (admin only)
    if (type === "all") {
      result = await getAllReviews()
      return NextResponse.json({ success: true, reviews: result })
    }

    return NextResponse.json({ success: false, error: "Invalid request parameters" }, { status: 400 })
  } catch (error: any) {
    console.error("Reviews API error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, reviewData, reviewId, reply, adminId, sentiment } = body

    let result

    switch (action) {
      case "create":
        if (!reviewData) {
          return NextResponse.json({ success: false, error: "Missing review data" }, { status: 400 })
        }
        result = await createReview(reviewData)
        break

      case "reply":
        if (!reviewId || !reply || !adminId) {
          return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 })
        }
        result = await addReplyToReview(reviewId, reply, adminId)
        break

      case "update-sentiment":
        if (!reviewId || !sentiment) {
          return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 })
        }
        result = await updateReviewSentiment(reviewId, sentiment)
        break

      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Reviews API error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred" },
      { status: 500 },
    )
  }
}

