import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
} from "firebase/firestore"
import { db } from "./config"
import { createNotification } from "./notifications"
import type { Review } from "@/lib/data"

// Get reviews for an event
export async function getEventReviews(eventId: string): Promise<Review[]> {
  try {
    const reviewsRef = collection(db, "reviews")
    const q = query(reviewsRef, where("eventId", "==", eventId), orderBy("date", "desc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        date: data.date.toDate().toISOString(),
        adminReply: data.adminReply
          ? {
              ...data.adminReply,
              date: data.adminReply.date.toDate().toISOString(),
            }
          : undefined,
      } as Review
    })
  } catch (error) {
    console.error("Error getting event reviews:", error)
    return []
  }
}

// Get reviews by a user
export async function getUserReviews(userId: string): Promise<Review[]> {
  try {
    const db = getFirestore()
    const reviewsCollection = collection(db, "reviews")

    // Option 1: Simple query without ordering (no index needed)
    const q = query(reviewsCollection, where("userId", "==", userId))

    // If you need ordering, uncomment the following and create the index
    // using the link in the error message:
    // const q = query(
    //   reviewsCollection,
    //   where("userId", "==", userId),
    //   orderBy("date", "desc")
    // );

    const querySnapshot = await getDocs(q)
    const reviews: Review[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      reviews.push({
        id: doc.id,
        ...data,
        date: data.date?.toDate() || new Date(),
        adminReply: data.adminReply
          ? {
              ...data.adminReply,
              date: data.adminReply.date?.toDate() || new Date(),
            }
          : undefined,
      } as Review)
    })

    // Sort reviews by date client-side instead of in the query
    return reviews.sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date)
      const dateB = b.date instanceof Date ? b.date : new Date(b.date)
      return dateB.getTime() - dateA.getTime()
    })
  } catch (error) {
    console.error("Error getting user reviews:", error)
    throw error
  }
}

// Get all reviews (for admin)
export async function getAllReviews(): Promise<Review[]> {
  try {
    const reviewsRef = collection(db, "reviews")
    const q = query(reviewsRef, orderBy("date", "desc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        date: data.date.toDate().toISOString(),
        adminReply: data.adminReply
          ? {
              ...data.adminReply,
              date: data.adminReply.date.toDate().toISOString(),
            }
          : undefined,
      } as Review
    })
  } catch (error) {
    console.error("Error getting all reviews:", error)
    return []
  }
}

// Update the createReview function to ensure proper user identification
export async function createReview(reviewData: any): Promise<{ success: boolean; error?: string; reviewId?: string }> {
  try {
    // Ensure we have a valid user name
    const userName = reviewData.userName || "Anonymous User"

    // Create the review
    const reviewRef = await addDoc(collection(db, "reviews"), {
      eventId: reviewData.eventId,
      userId: reviewData.userId,
      userName: userName,
      userAvatar: reviewData.userAvatar,
      rating: reviewData.rating,
      comment: reviewData.comment,
      date: serverTimestamp(),
      sentiment: "neutral", // Will be updated by sentiment analysis
      status: "published",
    })

    // Update the event's review count and average rating
    const eventRef = doc(db, "events", reviewData.eventId)
    const eventDoc = await getDoc(eventRef)

    if (eventDoc.exists()) {
      const eventData = eventDoc.data()
      const currentReviewsCount = eventData.reviewsCount || 0
      const currentAvgRating = eventData.averageRating || 0

      // Calculate new average rating
      const newAvgRating = (currentAvgRating * currentReviewsCount + reviewData.rating) / (currentReviewsCount + 1)

      await updateDoc(eventRef, {
        reviewsCount: increment(1),
        averageRating: newAvgRating,
      })

      // Update user's review count
      const userRef = doc(db, "users", reviewData.userId)
      await updateDoc(userRef, {
        reviewCount: increment(1),
      }).catch((error) => {
        // If user document doesn't exist, we can ignore this error
        console.log("User document may not exist, skipping review count update:", error)
      })

      // Create notification for admin with enhanced details
      const eventTitle = eventData.title || "an event"
      const eventDate = eventData.date
        ? new Date(eventData.date.toDate()).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : ""

      await createNotification({
        userId: "admin", // Send to admin
        title: "New Review Submitted",
        message: `${userName} has submitted a ${reviewData.rating}-star review for "${eventTitle}" ${eventDate ? `(${eventDate})` : ""}.
        
"${reviewData.comment.substring(0, 100)}${reviewData.comment.length > 100 ? "..." : ""}"

Click to view and respond to this review.`,
        type: "review",
        actionUrl: `/admin/reviews?eventId=${reviewData.eventId}`,
        eventId: reviewData.eventId,
      })
    }

    return { success: true, reviewId: reviewRef.id }
  } catch (error: any) {
    console.error("Error creating review:", error)
    return { success: false, error: error.message }
  }
}

// Update review sentiment
export async function updateReviewSentiment(
  reviewId: string,
  sentiment: "positive" | "negative" | "neutral",
): Promise<{ success: boolean; error?: string }> {
  try {
    const reviewRef = doc(db, "reviews", reviewId)
    await updateDoc(reviewRef, { sentiment })
    return { success: true }
  } catch (error: any) {
    console.error("Error updating review sentiment:", error)
    return { success: false, error: error.message }
  }
}

// Add admin reply to a review
export async function addReplyToReview(
  reviewId: string,
  reply: string,
  adminId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const reviewRef = doc(db, "reviews", reviewId)
    const reviewDoc = await getDoc(reviewRef)

    if (!reviewDoc.exists()) {
      return { success: false, error: "Review not found" }
    }

    const reviewData = reviewDoc.data()

    // Add the reply
    await updateDoc(reviewRef, {
      adminReply: {
        comment: reply,
        date: serverTimestamp(),
        adminId,
      },
    })

    // Create notification for the user
    const eventRef = doc(db, "events", reviewData.eventId)
    const eventDoc = await getDoc(eventRef)
    const eventTitle = eventDoc.exists() ? eventDoc.data().title : "an event"

    await createNotification({
      userId: reviewData.userId,
      title: "Admin Replied to Your Review",
      message: `An admin has replied to your review for ${eventTitle}:
      
"${reply.substring(0, 100)}${reply.length > 100 ? "..." : ""}"

Click to view the full reply.`,
      type: "review",
      eventId: reviewData.eventId,
      actionUrl: `/user/reviews`,
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error adding reply to review:", error)
    return { success: false, error: error.message }
  }
}
import { getFirestore } from "firebase/firestore"

