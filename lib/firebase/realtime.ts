import { doc, onSnapshot, collection, query, where, orderBy } from "firebase/firestore"
import { db } from "./config"

// Type definitions for listener callbacks
type EventListener = (event: any) => void
type ReviewListener = (review: any) => void
type NotificationListener = (notification: any) => void
type UserListener = (user: any) => void

/**
 * Set up a real-time listener for a specific event
 */
export function listenToEvent(eventId: string, callback: EventListener) {
  if (typeof window === "undefined" || !db) return () => {}

  const eventRef = doc(db, "events", eventId)
  return onSnapshot(
    eventRef,
    (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        callback({
          id: doc.id,
          ...data,
          date: data.date.toDate().toISOString(),
          createdAt: data.createdAt.toDate().toISOString(),
          updatedAt: data.updatedAt.toDate().toISOString(),
        })
      } else {
        callback(null)
      }
    },
    (error) => {
      console.error("Error listening to event:", error)
    },
  )
}

/**
 * Set up a real-time listener for event reviews
 */
export function listenToEventReviews(eventId: string, callback: (reviews: any[]) => void) {
  if (typeof window === "undefined" || !db) return () => {}

  const reviewsQuery = query(collection(db, "reviews"), where("eventId", "==", eventId), orderBy("date", "desc"))

  return onSnapshot(
    reviewsQuery,
    (snapshot) => {
      const reviews = snapshot.docs.map((doc) => {
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
        }
      })
      callback(reviews)
    },
    (error) => {
      console.error("Error listening to event reviews:", error)
    },
  )
}

/**
 * Set up a real-time listener for user notifications
 */
export function listenToUserNotifications(userId: string, callback: (notifications: any[]) => void) {
  if (typeof window === "undefined" || !db) return () => {}

  const notificationsQuery = query(
    collection(db, "notifications"),
    where("userId", "in", [userId, "all"]),
    orderBy("createdAt", "desc"),
  )

  return onSnapshot(
    notificationsQuery,
    (snapshot) => {
      const notifications = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate().toISOString(),
        }
      })
      callback(notifications)
    },
    (error) => {
      console.error("Error listening to user notifications:", error)
    },
  )
}

/**
 * Set up a real-time listener for user's favorite events
 */
export function listenToUserFavorites(userId: string, callback: (eventIds: string[]) => void) {
  if (typeof window === "undefined" || !db) return () => {}

  const favoritesQuery = query(
    collection(db, "user_events"),
    where("userId", "==", userId),
    where("isFavorite", "==", true),
  )

  return onSnapshot(
    favoritesQuery,
    (snapshot) => {
      const eventIds = snapshot.docs.map((doc) => doc.data().eventId)
      callback(eventIds)
    },
    (error) => {
      console.error("Error listening to user favorites:", error)
    },
  )
}

/**
 * Set up a real-time listener for a user profile
 */
export function listenToUserProfile(userId: string, callback: UserListener) {
  if (typeof window === "undefined" || !db) return () => {}

  const userRef = doc(db, "users", userId)
  return onSnapshot(
    userRef,
    (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        callback({
          id: doc.id,
          ...data,
          joinedAt: data.joinedAt.toDate().toISOString(),
          lastLogin: data.lastLogin ? data.lastLogin.toDate().toISOString() : null,
        })
      } else {
        callback(null)
      }
    },
    (error) => {
      console.error("Error listening to user profile:", error)
    },
  )
}

/**
 * Set up a real-time listener for unread notification count
 */
export function listenToUnreadNotificationCount(userId: string, callback: (count: number) => void) {
  if (typeof window === "undefined" || !db) return () => {}

  const notificationsQuery = query(
    collection(db, "notifications"),
    where("userId", "in", [userId, "all"]),
    where("read", "==", false),
  )

  return onSnapshot(
    notificationsQuery,
    (snapshot) => {
      callback(snapshot.size)
    },
    (error) => {
      console.error("Error listening to unread notification count:", error)
    },
  )
}

/**
 * Set up a real-time listener for upcoming events
 */
export function listenToUpcomingEvents(callback: (events: any[]) => void) {
  if (typeof window === "undefined" || !db) return () => {}

  const now = new Date()
  const eventsQuery = query(collection(db, "events"), where("date", ">=", now), orderBy("date", "asc"))

  return onSnapshot(
    eventsQuery,
    (snapshot) => {
      const events = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          date: data.date.toDate().toISOString(),
          createdAt: data.createdAt.toDate().toISOString(),
          updatedAt: data.updatedAt.toDate().toISOString(),
        }
      })
      callback(events)
    },
    (error) => {
      console.error("Error listening to upcoming events:", error)
    },
  )
}

