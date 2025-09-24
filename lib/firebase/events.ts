import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  setDoc,
} from "firebase/firestore"
import { ref, uploadString, getDownloadURL } from "firebase/storage"
import { getFirebaseServices } from "@/lib/firebase-config"
import { getSouthAfricanImage } from "@/lib/image-service"
import { createNotification } from "./notifications"
import type { Event } from "@/lib/data"

// Helper function to safely convert Firestore Timestamp to ISO string
function safeTimestampToISOString(timestamp: any): string {
  if (!timestamp) return new Date().toISOString()

  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString()
  }

  if (timestamp.seconds && timestamp.nanoseconds) {
    return new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate().toISOString()
  }

  if (typeof timestamp === "string") {
    return timestamp
  }

  return new Date().toISOString()
}

// Get all events
export async function getAllEvents(): Promise<Event[]> {
  try {
    const { db } = getFirebaseServices()
    if (!db) {
      console.error("Firestore is not initialized")
      return []
    }

    const eventsRef = collection(db, "events")
    const q = query(eventsRef, orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        date: safeTimestampToISOString(data.date),
        createdAt: safeTimestampToISOString(data.createdAt),
        updatedAt: safeTimestampToISOString(data.updatedAt),
      } as Event
    })
  } catch (error) {
    console.error("Error getting events:", error)
    return []
  }
}

// Get event by ID
export async function getEventById(id: string): Promise<Event | undefined> {
  try {
    const { db } = getFirebaseServices()
    if (!db) {
      console.error("Firestore is not initialized")
      return undefined
    }

    const eventDoc = await getDoc(doc(db, "events", id))

    if (!eventDoc.exists()) {
      return undefined
    }

    const data = eventDoc.data()
    return {
      id: eventDoc.id,
      ...data,
      date: safeTimestampToISOString(data.date),
      createdAt: safeTimestampToISOString(data.createdAt),
      updatedAt: safeTimestampToISOString(data.updatedAt),
    } as Event
  } catch (error) {
    console.error("Error getting event:", error)
    return undefined
  }
}

// Get recent events
export async function getRecentEvents(limitCount = 3): Promise<Event[]> {
  try {
    const { db } = getFirebaseServices()
    if (!db) {
      console.error("Firestore is not initialized")
      return []
    }

    const eventsRef = collection(db, "events")
    const q = query(eventsRef, orderBy("createdAt", "desc"), limit(limitCount))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        date: safeTimestampToISOString(data.date),
        createdAt: safeTimestampToISOString(data.createdAt),
        updatedAt: safeTimestampToISOString(data.updatedAt),
      } as Event
    })
  } catch (error) {
    console.error("Error getting recent events:", error)
    return []
  }
}

// Fix the getUpcomingEvents function to properly filter upcoming events
export async function getUpcomingEvents(): Promise<Event[]> {
  try {
    const { db } = getFirebaseServices()
    if (!db) {
      console.error("Firestore is not initialized")
      return []
    }

    // Get the current date at the start of the day (midnight) in UTC
    const now = new Date()
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0))

    const eventsRef = collection(db, "events")
    // Use the start of today as the comparison point
    const q = query(eventsRef, where("date", ">=", today), orderBy("date", "asc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        date: safeTimestampToISOString(data.date),
        createdAt: safeTimestampToISOString(data.createdAt),
        updatedAt: safeTimestampToISOString(data.updatedAt),
      } as Event
    })
  } catch (error) {
    console.error("Error getting upcoming events:", error)
    return []
  }
}

// Get favorite events for a user
export async function getFavoriteEvents(userId: string): Promise<Event[]> {
  try {
    const { db } = getFirebaseServices()
    if (!db) {
      console.error("Firestore is not initialized")
      return []
    }

    // First get the user's favorite event IDs
    const userEventsRef = collection(db, "user_events")
    const q = query(userEventsRef, where("userId", "==", userId), where("isFavorite", "==", true))
    const userEventsSnapshot = await getDocs(q)

    // If no favorites, return empty array
    if (userEventsSnapshot.empty) {
      return []
    }

    // Get the event IDs
    const eventIds = userEventsSnapshot.docs.map((doc) => doc.data().eventId)

    // Now fetch each event
    const events: Event[] = []
    for (const eventId of eventIds) {
      const event = await getEventById(eventId)
      if (event) {
        events.push({
          ...event,
          isFavorite: true,
        })
      }
    }

    return events
  } catch (error) {
    console.error("Error getting favorite events:", error)
    return []
  }
}

// Update the createEvent function to check for duplicates before creating
export async function createEvent(eventData: any): Promise<{ success: boolean; error?: string; eventId?: string }> {
  try {
    const { db, storage } = getFirebaseServices()
    if (!db || !storage) {
      console.error("Firestore or Storage is not initialized")
      return { success: false, error: "Firebase services not initialized" }
    }

    // Check for duplicate events before creating
    const eventsRef = collection(db, "events")
    const eventDate = new Date(eventData.date)

    // Query for events with the same title on the same date
    const q = query(eventsRef, where("title", "==", eventData.title), where("location", "==", eventData.location))

    const querySnapshot = await getDocs(q)

    // Check if any of the events have the same date (comparing just the date part)
    const duplicateExists = querySnapshot.docs.some((doc) => {
      const data = doc.data()
      if (!data.date) return false

      let existingDate
      if (data.date instanceof Timestamp) {
        existingDate = data.date.toDate()
      } else if (data.date.seconds && data.date.nanoseconds) {
        existingDate = new Timestamp(data.date.seconds, data.date.nanoseconds).toDate()
      } else if (typeof data.date === "string") {
        existingDate = new Date(data.date)
      } else {
        return false
      }

      // Compare only the date part (year, month, day) ignoring time
      return (
        existingDate.getUTCFullYear() === eventDate.getUTCFullYear() &&
        existingDate.getUTCMonth() === eventDate.getUTCMonth() &&
        existingDate.getUTCDate() === eventDate.getUTCDate()
      )
    })

    if (duplicateExists) {
      console.warn("Duplicate event detected in Firebase")
      return {
        success: false,
        error: "An event with the same title, date, and location already exists.",
      }
    }

    // Process image
    let imageUrl = eventData.image

    if (eventData.useAutoImage === true) {
      // Use the image service to get a relevant South African image
      const searchQuery = `${eventData.title} ${eventData.location} ${eventData.category}`
      imageUrl = getSouthAfricanImage(searchQuery)
    } else if (eventData.imageData) {
      // Upload the image to Firebase Storage
      const storageRef = ref(storage, `events/${Date.now()}`)
      await uploadString(storageRef, eventData.imageData, "data_url")
      imageUrl = await getDownloadURL(storageRef)
    }

    // Ensure date is properly formatted
    let formattedEventDate
    if (eventData.date) {
      // If it's already a Date object, use it directly
      if (eventData.date instanceof Date) {
        formattedEventDate = eventData.date
      }
      // If it's a string in ISO format (YYYY-MM-DD)
      else if (typeof eventData.date === "string" && eventData.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Parse the date string and create a date at noon UTC to avoid timezone issues
        const [year, month, day] = eventData.date.split("-").map(Number)
        // Create date in UTC to ensure consistency
        formattedEventDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
      }
      // If it's a timestamp or other format
      else {
        // Ensure we're creating a proper date object
        formattedEventDate = new Date(eventData.date)
        // Set to noon UTC to avoid timezone issues
        formattedEventDate.setUTCHours(12, 0, 0, 0)
      }
    } else {
      // Default to today at noon UTC
      const now = new Date()
      formattedEventDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0))
    }

    // Create event document with the properly formatted date
    const eventRef = await addDoc(collection(db, "events"), {
      title: eventData.title,
      // Store the date as a Firestore Timestamp with the correct date
      date: Timestamp.fromDate(formattedEventDate),
      time: eventData.time || null,
      location: eventData.location,
      description: eventData.description,
      image: imageUrl,
      organizer: eventData.organizer || "EventHub South Africa",
      capacity: Number(eventData.capacity) || 100,
      attendees: 0,
      reviewsCount: 0,
      averageRating: 0,
      price: eventData.price || "Free",
      category: eventData.category || "Other",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: "active",
      tags: eventData.tags || [],
    })

    // Format date for notification
    const formattedDate = formattedEventDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    // Create notification for all users
    const notificationMessage = `
Event: ${eventData.title}
Date: ${formattedDate}${eventData.time ? `\nTime: ${eventData.time}` : ""}
Location: ${eventData.location}
Category: ${eventData.category || "General"}
Price: ${eventData.price !== "Free" ? eventData.price : "Free entry"}
${eventData.capacity ? `Capacity: ${eventData.capacity} attendees` : ""}

${eventData.description.substring(0, 150)}${eventData.description.length > 150 ? "..." : ""}

Tap to view details and register for this event.
`.trim()

    await createNotification({
      userId: "all",
      title: "New Event: " + eventData.title,
      message: notificationMessage,
      type: "event",
      eventId: eventRef.id,
      actionUrl: `/user/events/${eventRef.id}`,
    })

    return { success: true, eventId: eventRef.id }
  } catch (error: any) {
    console.error("Error creating event:", error)
    return { success: false, error: error.message }
  }
}

// Update an event
export async function updateEvent(eventId: string, eventData: any): Promise<{ success: boolean; error?: string }> {
  try {
    const { db, storage } = getFirebaseServices()
    if (!db || !storage) {
      console.error("Firestore or Storage is not initialized")
      return { success: false, error: "Firebase services not initialized" }
    }

    const eventRef = doc(db, "events", eventId)
    const eventDoc = await getDoc(eventRef)

    if (!eventDoc.exists()) {
      return { success: false, error: "Event not found" }
    }

    // Process image if needed
    let imageUrl = undefined

    if (eventData.updateImage === true) {
      // Use the image service to get a relevant South African image
      const searchQuery = `${eventData.title} ${eventData.location} ${eventData.category}`
      imageUrl = getSouthAfricanImage(searchQuery)
    } else if (eventData.imageData) {
      // Upload the image to Firebase Storage
      const storageRef = ref(storage, `events/${eventId}_${Date.now()}`)
      await uploadString(storageRef, eventData.imageData, "data_url")
      imageUrl = await getDownloadURL(storageRef)
    }

    // Create update object
    const updateData: any = {
      updatedAt: serverTimestamp(),
    }

    // Only add fields that are provided
    if (eventData.title) updateData.title = eventData.title
    if (eventData.date) {
      // Properly format the date for updates
      let formattedDate
      if (typeof eventData.date === "string" && eventData.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Parse the date string and create a date at noon UTC
        const [year, month, day] = eventData.date.split("-").map(Number)
        formattedDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
      } else {
        // Create a date object and set to noon UTC
        formattedDate = new Date(eventData.date)
        formattedDate.setUTCHours(12, 0, 0, 0)
      }
      updateData.date = Timestamp.fromDate(formattedDate)
    }
    if (eventData.time !== undefined) updateData.time = eventData.time
    if (eventData.location) updateData.location = eventData.location
    if (eventData.description) updateData.description = eventData.description
    if (imageUrl) updateData.image = imageUrl
    if (eventData.capacity !== undefined) updateData.capacity = Number(eventData.capacity)
    if (eventData.price) updateData.price = eventData.price
    if (eventData.category) updateData.category = eventData.category
    if (eventData.status) updateData.status = eventData.status
    if (eventData.tags) updateData.tags = eventData.tags

    // Update the event
    await updateDoc(eventRef, updateData)

    return { success: true }
  } catch (error: any) {
    console.error("Error updating event:", error)
    return { success: false, error: error.message }
  }
}

// Delete an event
export async function deleteEvent(eventId: string): Promise<boolean> {
  try {
    const { db } = getFirebaseServices()
    if (!db) {
      console.error("Firestore is not initialized")
      return false
    }

    await deleteDoc(doc(db, "events", eventId))
    return true
  } catch (error) {
    console.error("Error deleting event:", error)
    return false
  }
}

// Toggle favorite status for an event
export async function toggleFavoriteEvent(userId: string, eventId: string, isFavorite: boolean): Promise<boolean> {
  try {
    const { db } = getFirebaseServices()
    if (!db) {
      console.error("Firestore is not initialized")
      return false
    }

    const userEventRef = doc(db, "user_events", `${userId}_${eventId}`)
    const userEventDoc = await getDoc(userEventRef)

    if (userEventDoc.exists()) {
      // Update existing record
      await updateDoc(userEventRef, {
        isFavorite,
        updatedAt: serverTimestamp(),
      })
    } else {
      // Create new record
      await setDoc(userEventRef, {
        userId,
        eventId,
        status: "saved",
        isFavorite,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        checkedIn: false,
        reminderSet: false,
      })
    }

    return true
  } catch (error) {
    console.error("Error toggling favorite:", error)
    return false
  }
}

// Check if an event is a favorite for a user
export async function isEventFavorite(userId: string, eventId: string): Promise<boolean> {
  try {
    const { db } = getFirebaseServices()
    if (!db) {
      console.error("Firestore is not initialized")
      return false
    }

    const userEventDoc = await getDoc(doc(db, "user_events", `${userId}_${eventId}`))
    return userEventDoc.exists() && userEventDoc.data().isFavorite === true
  } catch (error) {
    console.error("Error checking favorite status:", error)
    return false
  }
}

