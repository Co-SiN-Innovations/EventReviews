"use server"

import { revalidatePath } from "next/cache"
import { updateEvent as dbUpdateEvent, getEventById, createNotification } from "@/lib/data"
import { getSouthAfricanImage } from "@/lib/image-service"
import { DEFAULT_EVENT_IMAGE } from "./constants"
// Simple rule-based sentiment analysis (no external API needed)
import {
  createEvent as firebaseCreateEvent,
  updateEvent as firebaseUpdateEvent,
  deleteEvent as firebaseDeleteEvent,
} from "@/lib/firebase/events"
import {
  createReview as firebaseCreateReview,
  updateReviewSentiment as firebaseUpdateReviewSentiment,
} from "@/lib/firebase/reviews"

// Update the createEvent function to ensure no duplicates
export async function createEvent(formData: FormData) {
  // Process the form data
  const title = formData.get("title") as string
  const date = formData.get("date") as string
  const time = formData.get("time") as string
  const location = formData.get("location") as string
  const description = formData.get("description") as string
  const organizer = "EventHub South Africa" // Updated to South African context
  const capacity = Number.parseInt(formData.get("capacity") as string) || 100
  const price = (formData.get("price") as string) || "Free"
  const category = (formData.get("category") as string) || "Other"
  const useAutoImage = formData.get("useAutoImage") === "true"
  const imageData = formData.get("imageData") as string

  // Validate required fields
  if (!title || !date || !location || !description) {
    return { success: false, error: "Missing required fields" }
  }

  try {
    // Determine which image to use
    let image = DEFAULT_EVENT_IMAGE

    if (useAutoImage) {
      // Use the image service to get a relevant South African image
      const searchQuery = `${title} ${location} ${category}`
      image = getSouthAfricanImage(searchQuery)
    } else if (imageData) {
      // Use the uploaded image if provided
      image = imageData
    }

    // Generate a unique ID for the event to prevent duplicates
    const eventId = `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // IMPORTANT: Only create the event in Firebase Firestore
    // Skip the local storage creation to prevent duplicates
    const eventData = {
      id: eventId, // Use the generated ID
      title,
      date,
      time,
      location,
      description,
      image,
      organizer,
      capacity,
      attendees: 0,
      reviewsCount: 0,
      price,
      category,
      useAutoImage,
      imageData: imageData ? imageData : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Add the date from the form data to the event data
    if (date) {
      // Ensure we're passing the date string directly without additional processing
      // The Firebase function will handle the proper date formatting
      eventData.date = date
    }

    // Check if an event with the same title and date already exists
    // This is an additional safeguard against duplicates
    const { getAllEvents } = await import("@/lib/firebase/events")
    const existingEvents = await getAllEvents()
    const duplicateEvent = existingEvents.find(
      (event) =>
        event.title === title &&
        new Date(event.date).toDateString() === new Date(date).toDateString() &&
        event.location === location,
    )

    if (duplicateEvent) {
      console.warn("Duplicate event detected:", duplicateEvent)
      return {
        success: false,
        error: "An event with the same title, date, and location already exists.",
      }
    }

    const firebaseResult = await firebaseCreateEvent(eventData)
    console.log("Firebase event creation result:", firebaseResult)

    // Format date and time for notification
    const formattedDate = new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    // Create a detailed notification message with all relevant event information
    const notificationMessage = `
Event: ${title}
Date: ${formattedDate}${time ? `\nTime: ${time}` : ""}
Location: ${location}
Category: ${category || "General"}
Price: ${price !== "Free" ? price : "Free entry"}
${capacity ? `Capacity: ${capacity} attendees` : ""}

${description.substring(0, 150)}${description.length > 150 ? "..." : ""}

Tap to view details and register for this event.
`.trim()

    // Send notification to all users
    await createNotification({
      userId: "all", // Send to all users
      title: "New Event: " + title,
      message: notificationMessage,
      type: "event",
      eventId: firebaseResult.eventId || eventId,
      actionUrl: `/user/events/${firebaseResult.eventId || eventId}`,
    })

    // Revalidate both admin and user event pages to show the new event
    revalidatePath("/admin/events")
    revalidatePath("/user/events")
    revalidatePath("/user/dashboard")
    revalidatePath("/admin/dashboard")
    revalidatePath("/user/notifications")

    // Return success instead of redirecting
    return {
      success: true,
      message: "Event created successfully",
      eventId: firebaseResult.eventId || eventId,
    }
  } catch (error) {
    console.error("Failed to create event:", error)
    return { success: false, error: "Failed to create event" }
  }
}

// Update the updateEvent function to use the correct update function
export async function updateEvent(eventId: string, formData: FormData) {
  try {
    // First, get the existing event to avoid overwriting with undefined values
    const existingEvent = await getEventById(eventId)
    if (!existingEvent) {
      return { success: false, error: "Event not found" }
    }

    // Extract form data
    const title = formData.get("title") as string
    const date = formData.get("date") as string
    const time = formData.get("time") as string
    const location = formData.get("location") as string
    const description = formData.get("description") as string
    const capacity = formData.get("capacity") ? Number(formData.get("capacity")) : undefined
    const price = formData.get("price") as string
    const category = formData.get("category") as string

    // Check if we should update the image
    const updateImage = formData.get("updateImage") === "true"
    const imageData = formData.get("imageData") as string
    let image

    if (updateImage) {
      // Use the image service to get a relevant South African image
      const searchQuery = `${title} ${location} ${category}`
      image = getSouthAfricanImage(searchQuery)
    } else if (imageData) {
      // Use the uploaded image if provided
      image = imageData
    }

    // Create update object with only defined fields
    const updateData: any = {}
    if (title) updateData.title = title
    if (date) updateData.date = date
    if (time !== undefined) updateData.time = time
    if (location) updateData.location = location
    if (description) updateData.description = description
    if (capacity !== undefined) updateData.capacity = capacity
    if (price) updateData.price = price
    if (category) updateData.category = category
    if (image) updateData.image = image

    // Update the event using the proper update function
    const updatedEvent = await dbUpdateEvent(eventId, updateData)

    // Also update the event in Firebase
    const firebaseResult = await firebaseUpdateEvent(eventId, {
      ...updateData,
      updateImage,
      imageData: imageData || null,
    })

    console.log("Firebase event update result:", firebaseResult)

    if (!updatedEvent) {
      return { success: false, error: "Failed to update event" }
    }

    // Revalidate paths
    revalidatePath(`/admin/events/${eventId}`)
    revalidatePath(`/user/events/${eventId}`)
    revalidatePath("/admin/events")
    revalidatePath("/user/events")

    return { success: true, message: "Event updated successfully" }
  } catch (error) {
    console.error("Error updating event:", error)
    return { success: false, error: "Failed to update event" }
  }
}

// Add the deleteEvent function to handle event deletion
export async function deleteEvent(eventId: string) {
  try {
    // Delete the event from Firebase
    const result = await firebaseDeleteEvent(eventId)

    if (!result) {
      console.error("Failed to delete event from Firebase")
      return false
    }

    // Also delete the event from local storage if needed
    try {
      const { deleteEvent: dbDeleteEvent } = await import("@/lib/data")
      await dbDeleteEvent(eventId)
    } catch (localError) {
      console.error("Error deleting event from local storage:", localError)
      // Continue even if local storage deletion fails
    }

    // Revalidate paths to update the UI
    revalidatePath("/admin/events")
    revalidatePath("/user/events")
    revalidatePath("/user/dashboard")
    revalidatePath("/admin/dashboard")

    return true
  } catch (error) {
    console.error("Error deleting event:", error)
    return false
  }
}

// Update the submitReview function to use the actual user profile name
export async function submitReview(formData: FormData) {
  const eventId = formData.get("eventId") as string
  const rating = Number.parseInt(formData.get("rating") as string)
  const comment = formData.get("comment") as string

  try {
    // Get the current authenticated user
    const { getFirebaseAuth } = await import("@/lib/firebase-config")
    const auth = getFirebaseAuth()

    if (!auth || !auth.currentUser) {
      throw new Error("User not authenticated")
    }

    // Get user details from the authenticated user
    const userId = auth.currentUser.uid
    const userName = auth.currentUser.displayName || "Anonymous User"
    const userEmail = auth.currentUser.email
    const userAvatar = auth.currentUser.photoURL || "/placeholder.svg?height=40&width=40"

    // IMPORTANT: Create the review in Firebase Firestore
    const reviewData = {
      eventId,
      userId,
      userName,
      userAvatar,
      rating,
      comment,
    }

    const firebaseResult = await firebaseCreateReview(reviewData)
    console.log("Firebase review creation result:", firebaseResult)

    // Analyze the sentiment of the review
    const sentiment = await determineSimpleSentiment(comment)

    // If Firebase review was created successfully, update the sentiment there
    if (firebaseResult.success && firebaseResult.reviewId) {
      await firebaseUpdateReviewSentiment(firebaseResult.reviewId, sentiment)
    }

    // Get more details about the event for the notification
    let eventTitle = "an event"
    let eventDate = ""

    try {
      const event = await getEventById(eventId)
      if (event) {
        eventTitle = event.title
        eventDate = new Date(event.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      }
    } catch (eventError) {
      console.error("Error fetching event details for notification:", eventError)
    }

    // Create a notification for the admin with enhanced details
    await createNotification({
      userId: "admin", // Send to admin
      title: "New Review Submitted",
      message: `${userName} has submitted a ${rating}-star review for "${eventTitle}" (${eventDate}).
      
"${comment.substring(0, 100)}${comment.length > 100 ? "..." : ""}"

Click to view and respond to this review.`,
      type: "review",
      eventId: eventId,
      actionUrl: `/admin/reviews?eventId=${eventId}`,
    })

    // Also create the notification in Firebase
    try {
      const { createNotification: createFirebaseNotification } = await import("@/lib/firebase/notifications")
      await createFirebaseNotification({
        userId: "admin",
        title: "New Review Submitted",
        message: `${userName} has submitted a ${rating}-star review for "${eventTitle}" (${eventDate}).
        
"${comment.substring(0, 100)}${comment.length > 100 ? "..." : ""}"

Click to view and respond to this review.`,
        type: "review",
        eventId: eventId,
        actionUrl: `/admin/reviews?eventId=${eventId}`,
      })
    } catch (notificationError) {
      console.error("Error creating Firebase notification:", notificationError)
    }

    // Revalidate the relevant paths
    revalidatePath(`/user/events/${eventId}`)
    revalidatePath("/user/reviews")
    revalidatePath("/admin/reviews")
    revalidatePath("/user/dashboard")
    revalidatePath("/admin/dashboard")

    return { success: true }
  } catch (error) {
    console.error("Failed to submit review:", error)
    return { success: false, error: "Failed to submit review" }
  }
}

// Simple sentiment analysis function that returns the sentiment type
async function determineSimpleSentiment(comment: string): Promise<"positive" | "negative" | "neutral"> {
  const positiveWords = [
    "good",
    "great",
    "excellent",
    "amazing",
    "awesome",
    "love",
    "best",
    "fantastic",
    "wonderful",
    "enjoyed",
    "happy",
    "recommend",
    "perfect",
    "helpful",
    "impressed",
  ]
  const negativeWords = [
    "bad",
    "poor",
    "terrible",
    "awful",
    "horrible",
    "hate",
    "worst",
    "disappointing",
    "disappointed",
    "waste",
    "unhappy",
    "avoid",
    "mediocre",
    "useless",
    "regret",
  ]

  const lowerComment = comment.toLowerCase()
  let positiveCount = 0
  let negativeCount = 0

  // Count positive and negative words
  positiveWords.forEach((word) => {
    if (lowerComment.includes(word)) {
      positiveCount++
    }
  })

  negativeWords.forEach((word) => {
    if (lowerComment.includes(word)) {
      negativeCount++
    }
  })

  // Determine sentiment based on word counts
  if (positiveCount > negativeCount) {
    return "positive"
  } else if (negativeCount > positiveCount) {
    return "negative"
  } else {
    return "neutral"
  }
}

export async function replyToReview(formData: FormData) {
  const reviewId = formData.get("reviewId") as string
  const reply = formData.get("reply") as string

  try {
    if (!reply || !reviewId) {
      return { success: false, error: "Missing required fields" }
    }

    // Get the current admin ID
    const { getFirebaseAuth } = await import("@/lib/firebase-config")
    const auth = getFirebaseAuth()
    const adminId = auth?.currentUser?.uid || "admin"

    // Add the reply to the Firebase review
    const { addReplyToReview } = await import("@/lib/firebase/reviews")
    const result = await addReplyToReview(reviewId, reply, adminId)

    if (!result.success) {
      return { success: false, error: result.error || "Failed to reply to review" }
    }

    // Revalidate the relevant paths
    revalidatePath("/admin/reviews")
    revalidatePath("/user/reviews")

    return { success: true, message: "Reply added successfully" }
  } catch (error) {
    console.error("Failed to reply to review:", error)
    return { success: false, error: "Failed to reply to review" }
  }
}

