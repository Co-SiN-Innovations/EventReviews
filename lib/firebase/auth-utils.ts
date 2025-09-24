// Add this new file to handle updating the lastSeen timestamp

import { doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "./config"

/**
 * Updates the lastSeen timestamp for a user in Firestore
 * @param userId The ID of the user to update
 * @returns A promise that resolves when the update is complete
 */
export const updateUserLastSeen = async (userId: string): Promise<void> => {
  if (!userId) {
    console.warn("Cannot update lastSeen: No user ID provided")
    return
  }

  try {
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      lastSeen: serverTimestamp(),
    })
    console.log("Updated lastSeen timestamp for user:", userId)
  } catch (error) {
    console.error("Error updating lastSeen timestamp:", error)
  }
}

