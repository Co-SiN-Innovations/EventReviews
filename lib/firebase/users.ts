import { collection, doc, getDocs, query, where, orderBy, limit, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "./config"

// Update the getAllUsers function to use db directly instead of getFirebaseServices
export async function getAllUsers() {
  try {
    if (!db) {
      console.error("Firestore is not initialized")
      return []
    }

    const usersRef = collection(db, "users")
    const q = query(usersRef, orderBy("joinedAt", "desc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        joinedAt: data.joinedAt ? data.joinedAt.toDate().toISOString() : new Date().toISOString(),
        lastLogin: data.lastLogin ? data.lastLogin.toDate().toISOString() : null,
        // Ensure all required fields are present
        name: data.name || "Unknown User",
        email: data.email || "No Email",
        avatar: data.avatar || null,
        status: data.status || "active",
        reviewCount: data.reviewCount || 0,
        role: data.role || "user",
      }
    })
  } catch (error) {
    console.error("Error getting users:", error)
    return []
  }
}

// Get active users
export async function getActiveUsers() {
  try {
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("status", "==", "active"), orderBy("lastLogin", "desc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        joinedAt: data.joinedAt.toDate().toISOString(),
        lastLogin: data.lastLogin ? data.lastLogin.toDate().toISOString() : null,
      }
    })
  } catch (error) {
    console.error("Error getting active users:", error)
    return []
  }
}

// Get recent users
export async function getRecentUsers(limitCount = 6) {
  try {
    const usersRef = collection(db, "users")
    const q = query(usersRef, orderBy("joinedAt", "desc"), limit(limitCount))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        joinedAt: data.joinedAt.toDate().toISOString(),
        lastLogin: data.lastLogin ? data.lastLogin.toDate().toISOString() : null,
      }
    })
  } catch (error) {
    console.error("Error getting recent users:", error)
    return []
  }
}

// Ensure the updateUserProfile function properly handles profile updates
export async function updateUserProfile(
  userId: string,
  data: {
    name?: string
    location?: string
    bio?: string
    avatar?: string | null
  },
) {
  try {
    const userRef = doc(db, "users", userId)

    // Only update fields that are provided
    const updateData: Record<string, any> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.location !== undefined) updateData.location = data.location
    if (data.bio !== undefined) updateData.bio = data.bio
    if (data.avatar !== undefined) updateData.avatar = data.avatar

    // Add timestamp for the update
    updateData.updatedAt = serverTimestamp()

    await updateDoc(userRef, updateData)

    return { success: true }
  } catch (error: any) {
    console.error("Error updating user profile:", error)
    return {
      success: false,
      error: error.message || "Failed to update profile",
    }
  }
}

// Get user's event attendance
export async function getUserEventAttendance(userId: string) {
  try {
    const userEventsRef = collection(db, "user_events")
    const q = query(userEventsRef, where("userId", "==", userId), where("status", "==", "attending"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => doc.data().eventId)
  } catch (error) {
    console.error("Error getting user event attendance:", error)
    return []
  }
}

