import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from "firebase/firestore"
import { db } from "./config"
import type { Notification } from "@/lib/data"

// Get notifications for a user
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  try {
    const notificationsRef = collection(db, "notifications")
    const q = query(notificationsRef, where("userId", "in", [userId, "all"]), orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate().toISOString(),
      } as Notification
    })
  } catch (error) {
    console.error("Error getting notifications:", error)
    return []
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const notificationsRef = collection(db, "notifications")
    const q = query(notificationsRef, where("userId", "in", [userId, "all"]), where("read", "==", false))
    const querySnapshot = await getDocs(q)

    return querySnapshot.size
  } catch (error) {
    console.error("Error getting unread notification count:", error)
    return 0
  }
}

// Create a notification
export async function createNotification(
  notificationData: any,
): Promise<{ success: boolean; error?: string; notificationId?: string }> {
  try {
    const notificationRef = await addDoc(collection(db, "notifications"), {
      userId: notificationData.userId,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type,
      read: false,
      createdAt: serverTimestamp(),
      eventId: notificationData.eventId || null,
      actionUrl: notificationData.actionUrl || null,
      expiresAt: notificationData.expiresAt ? Timestamp.fromDate(new Date(notificationData.expiresAt)) : null,
    })

    return { success: true, notificationId: notificationRef.id }
  } catch (error: any) {
    console.error("Error creating notification:", error)
    return { success: false, error: error.message }
  }
}

// Mark a notification as read
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const notificationRef = doc(db, "notifications", notificationId)
    await updateDoc(notificationRef, {
      read: true,
    })

    return true
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return false
  }
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    const notificationsRef = collection(db, "notifications")
    const q = query(notificationsRef, where("userId", "in", [userId, "all"]), where("read", "==", false))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return true
    }

    const batch = writeBatch(db)

    querySnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true })
    })

    await batch.commit()

    return true
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return false
  }
}

