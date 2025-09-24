import { v4 as uuidv4 } from "uuid"

// Types
export type Event = {
  id: string
  title: string
  date: string
  time?: string
  location: string
  description: string
  image: string
  organizer: string
  capacity: number
  attendees: number
  reviewsCount: number
  price: string | number
  category?: string
  isFavorite?: boolean
}

export type User = {
  id: string
  name: string
  email: string
  avatar: string
  role: "user" | "admin"
  eventsAttended: number
  reviewsSubmitted: number
}

export type Review = {
  id: string
  eventId: string
  eventTitle: string
  userId: string
  userName: string
  userAvatar: string
  rating: number
  comment: string
  sentiment: "positive" | "negative" | "neutral"
  date: string
  adminReply?: {
    comment: string
    date: string
  }
}

export type Notification = {
  id: string
  userId: string
  title: string
  message: string
  type: "event" | "system" | "review"
  read: boolean
  createdAt: string
  actionUrl?: string
  eventId?: string
}

// Helper function to get data from localStorage
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue

  const stored = localStorage.getItem(key)
  if (!stored) return defaultValue

  try {
    return JSON.parse(stored) as T
  } catch (error) {
    console.error(`Error parsing ${key} from localStorage:`, error)
    return defaultValue
  }
}

// Helper function to save data to localStorage
function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error)
  }
}

// Event functions
export async function getAllEvents(): Promise<Event[]> {
  return getFromStorage<Event[]>("events", [])
}

export async function getEventById(id: string): Promise<Event | null> {
  const events = await getAllEvents()
  return events.find((event) => event.id === id) || null
}

export async function createEvent(eventData: Omit<Event, "id" | "attendees" | "reviewsCount">): Promise<Event> {
  const events = await getAllEvents()
  const newEvent: Event = {
    ...eventData,
    id: uuidv4(),
    attendees: 0,
    reviewsCount: 0,
  }

  saveToStorage("events", [...events, newEvent])
  return newEvent
}

export async function updateEvent(id: string, eventData: Partial<Event>): Promise<Event | null> {
  const events = await getAllEvents()
  const eventIndex = events.findIndex((event) => event.id === id)

  if (eventIndex === -1) return null

  const updatedEvent = { ...events[eventIndex], ...eventData }
  events[eventIndex] = updatedEvent
  saveToStorage("events", events)
  return updatedEvent
}

export async function deleteEvent(id: string): Promise<boolean> {
  const events = await getAllEvents()
  const filteredEvents = events.filter((event) => event.id !== id)
  saveToStorage("events", filteredEvents)
  return true
}

// User functions
export async function getAllUsers(): Promise<User[]> {
  return getFromStorage<User[]>("users", [])
}

export async function getUserById(id: string): Promise<User | null> {
  const users = await getAllUsers()
  return users.find((user) => user.id === id) || null
}

// Review functions
export async function getAllReviews(): Promise<Review[]> {
  return getFromStorage<Review[]>("reviews", [])
}

export async function getEventReviews(eventId: string): Promise<Review[]> {
  const reviews = await getAllReviews()
  return reviews.filter((review) => review.eventId === eventId)
}

export async function getUserReviews(userId: string): Promise<Review[]> {
  const reviews = await getAllReviews()
  return reviews.filter((review) => review.userId === userId)
}

export async function createReview(reviewData: {
  eventId: string
  userId: string
  userName: string
  userAvatar: string
  rating: number
  comment: string
}): Promise<Review> {
  const reviews = await getAllReviews()
  const events = await getAllEvents()
  const eventIndex = events.findIndex((event) => event.id === reviewData.eventId)

  // Get the event title
  let eventTitle = "Unknown Event"
  if (eventIndex !== -1) {
    eventTitle = events[eventIndex].title
    // Update the event's review count
    events[eventIndex].reviewsCount += 1
    saveToStorage("events", events)
  }

  const newReview: Review = {
    id: uuidv4(),
    eventTitle,
    sentiment: "neutral", // Default sentiment, will be updated by AI
    date: new Date().toISOString(),
    ...reviewData,
  }

  saveToStorage("reviews", [...reviews, newReview])
  return newReview
}

export async function updateReviewSentiment(
  reviewId: string,
  sentiment: "positive" | "negative" | "neutral",
): Promise<Review | null> {
  const reviews = await getAllReviews()
  const reviewIndex = reviews.findIndex((review) => review.id === reviewId)

  if (reviewIndex === -1) return null

  reviews[reviewIndex].sentiment = sentiment
  saveToStorage("reviews", reviews)
  return reviews[reviewIndex]
}

export async function addReplyToReview(reviewId: string, comment: string): Promise<Review | null> {
  try {
    const reviews = await getAllReviews()
    const reviewIndex = reviews.findIndex((review) => review.id === reviewId)

    if (reviewIndex === -1) {
      console.error(`Review with ID ${reviewId} not found`)
      return null
    }

    reviews[reviewIndex].adminReply = {
      comment,
      date: new Date().toISOString(),
    }

    saveToStorage("reviews", reviews)
    return reviews[reviewIndex]
  } catch (error) {
    console.error("Error adding reply to review:", error)
    return null
  }
}

// Notification functions
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const notifications = getFromStorage<Notification[]>("notifications", [])
  return notifications.filter((notification) => notification.userId === userId || notification.userId === "all")
}

export async function createNotification(notificationData: {
  userId: string
  title: string
  message: string
  type: "event" | "system" | "review"
  eventId?: string
  actionUrl?: string
}): Promise<Notification> {
  const notifications = getFromStorage<Notification[]>("notifications", [])
  const newNotification: Notification = {
    id: uuidv4(),
    read: false,
    createdAt: new Date().toISOString(),
    ...notificationData,
  }

  saveToStorage("notifications", [...notifications, newNotification])

  // Dispatch a storage event to notify other tabs/windows
  if (typeof window !== "undefined") {
    window.dispatchEvent(new StorageEvent("storage", { key: "notifications" }))
  }

  return newNotification
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const notifications = getFromStorage<Notification[]>("notifications", [])
  const notificationIndex = notifications.findIndex((notification) => notification.id === notificationId)

  if (notificationIndex === -1) return false

  notifications[notificationIndex].read = true
  saveToStorage("notifications", notifications)

  // Dispatch a storage event to notify other tabs/windows
  if (typeof window !== "undefined") {
    window.dispatchEvent(new StorageEvent("storage", { key: "notifications" }))
  }

  return true
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  const notifications = getFromStorage<Notification[]>("notifications", [])
  const updatedNotifications = notifications.map((notification) =>
    notification.userId === userId || notification.userId === "all" ? { ...notification, read: true } : notification,
  )

  saveToStorage("notifications", updatedNotifications)

  // Dispatch a storage event to notify other tabs/windows
  if (typeof window !== "undefined") {
    window.dispatchEvent(new StorageEvent("storage", { key: "notifications" }))
  }

  return true
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const notifications = getFromStorage<Notification[]>("notifications", [])
  return notifications.filter(
    (notification) => (notification.userId === userId || notification.userId === "all") && !notification.read,
  ).length
}

export async function getUpcomingEvents(): Promise<Event[]> {
  const events = await getAllEvents()
  const now = new Date()
  return events.filter((event) => new Date(event.date) >= now)
}

export async function getRecentReviews(limit: number): Promise<Review[]> {
  const reviews = await getAllReviews()
  return reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit)
}

export const initializeEvents = () => {
  if (typeof window !== "undefined") {
    if (!localStorage.getItem("events")) {
      localStorage.setItem("events", JSON.stringify([]))
    }
  }
}

export const initializeReviews = () => {
  if (typeof window !== "undefined") {
    if (!localStorage.getItem("reviews")) {
      localStorage.setItem("reviews", JSON.stringify([]))
    }
  }
}

