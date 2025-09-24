import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  increment,
} from "firebase/firestore"
import { db } from "./config"

// Toggle favorite status for an event
export async function toggleFavoriteEvent(userId: string, eventId: string, isFavorite: boolean): Promise<boolean> {
  try {
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
    const userEventDoc = await getDoc(doc(db, "user_events", `${userId}_${eventId}`))
    return userEventDoc.exists() && userEventDoc.data().isFavorite === true
  } catch (error) {
    console.error("Error checking favorite status:", error)
    return false
  }
}

// Get all favorite events for a user
export async function getUserFavoriteEvents(userId: string): Promise<string[]> {
  try {
    const userEventsRef = collection(db, "user_events")
    const q = query(userEventsRef, where("userId", "==", userId), where("isFavorite", "==", true))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => doc.data().eventId)
  } catch (error) {
    console.error("Error getting user favorite events:", error)
    return []
  }
}

// Set user attendance status for an event
export async function setEventAttendance(
  userId: string,
  eventId: string,
  status: "registered" | "attended" | "cancelled",
): Promise<boolean> {
  try {
    const userEventRef = doc(db, "user_events", `${userId}_${eventId}`)
    const userEventDoc = await getDoc(userEventRef)

    if (userEventDoc.exists()) {
      // Update existing record
      await updateDoc(userEventRef, {
        status,
        updatedAt: serverTimestamp(),
        checkedIn: status === "attended",
      })
    } else {
      // Create new record
      await setDoc(userEventRef, {
        userId,
        eventId,
        status,
        isFavorite: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        checkedIn: status === "attended",
        reminderSet: false,
      })
    }

    // If status is "registered", increment the attendees count for the event
    if (status === "registered") {
      const eventRef = doc(db, "events", eventId)
      await updateDoc(eventRef, {
        attendees: increment(1),
      })
    }

    return true
  } catch (error) {
    console.error("Error setting event attendance:", error)
    return false
  }
}

// Get all events a user is attending
export async function getUserAttendingEvents(userId: string): Promise<string[]> {
  try {
    const userEventsRef = collection(db, "user_events")
    const q = query(userEventsRef, where("userId", "==", userId), where("status", "in", ["registered", "attended"]))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => doc.data().eventId)
  } catch (error) {
    console.error("Error getting user attending events:", error)
    return []
  }
}

// Set reminder for an event
export async function setEventReminder(userId: string, eventId: string, reminderSet: boolean): Promise<boolean> {
  try {
    const userEventRef = doc(db, "user_events", `${userId}_${eventId}`)
    const userEventDoc = await getDoc(userEventRef)

    if (userEventDoc.exists()) {
      // Update existing record
      await updateDoc(userEventRef, {
        reminderSet,
        updatedAt: serverTimestamp(),
      })
    } else {
      // Create new record
      await setDoc(userEventRef, {
        userId,
        eventId,
        status: "saved",
        isFavorite: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        checkedIn: false,
        reminderSet,
      })
    }

    return true
  } catch (error) {
    console.error("Error setting event reminder:", error)
    return false
  }
}

// Get user-event relationship
export async function getUserEventRelationship(userId: string, eventId: string) {
  try {
    const userEventDoc = await getDoc(doc(db, "user_events", `${userId}_${eventId}`))

    if (userEventDoc.exists()) {
      return {
        success: true,
        data: userEventDoc.data(),
      }
    } else {
      return {
        success: true,
        data: null,
      }
    }
  } catch (error: any) {
    console.error("Error getting user-event relationship:", error)
    return {
      success: false,
      error: error.message || "Failed to get user-event relationship",
    }
  }
}

