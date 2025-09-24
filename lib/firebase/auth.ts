import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User,
} from "firebase/auth"
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore"
import { auth, db } from "./config"

// Ensure Firebase is initialized before using auth services
const ensureFirebaseInitialized = () => {
  if (typeof window === "undefined") {
    console.error("Firebase cannot be used in server-side context")
    return false
  }

  if (!auth) {
    console.error("Firebase auth is not initialized!")
    return false
  }

  return true
}

// Register a new user
export const registerUser = async (email: string, password: string, name: string) => {
  // Check if we're in a browser environment and Firebase is initialized
  if (!ensureFirebaseInitialized()) {
    return {
      success: false,
      error: "Authentication service is not available. Please try again later.",
    }
  }

  try {
    console.log("Starting user registration for:", email)

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    console.log("User created successfully:", user.uid)

    // Update profile with display name
    await updateProfile(user, {
      displayName: name,
    })

    // Create user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      name,
      email,
      avatar: null,
      status: "active",
      joinedAt: serverTimestamp(),
      reviewCount: 0,
      eventsAttended: 0,
      location: "",
      role: email.includes("admin") ? "admin" : "user", // Set admin role for admin emails
      lastLogin: serverTimestamp(),
    })

    console.log("User document created in Firestore")

    return { success: true, user }
  } catch (error: any) {
    console.error("Registration error details:", {
      code: error.code,
      message: error.message,
      stack: error.stack,
    })

    // Provide more specific error messages based on Firebase error codes
    if (error.code === "auth/email-already-in-use") {
      return { success: false, error: "This email is already registered. Please login instead." }
    } else if (error.code === "auth/invalid-email") {
      return { success: false, error: "Please provide a valid email address." }
    } else if (error.code === "auth/weak-password") {
      return { success: false, error: "Password is too weak. Please use at least 6 characters." }
    } else if (error.code === "auth/configuration-not-found") {
      return { success: false, error: "Authentication service is not properly configured. Please contact support." }
    } else if (error.code === "auth/operation-not-allowed") {
      return { success: false, error: "Email/password accounts are not enabled in Firebase Console." }
    }

    return { success: false, error: error.message || "Failed to create account" }
  }
}

// Sign in existing user
export const signIn = async (email: string, password: string) => {
  // Check if Firebase is initialized
  if (!ensureFirebaseInitialized()) {
    return {
      success: false,
      error: "Authentication service is not available. Please try again later.",
    }
  }

  try {
    console.log("Attempting to sign in user:", email)

    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    console.log("User signed in successfully:", userCredential.user.uid)

    // Update last login timestamp
    await updateDoc(
      doc(db, "users", userCredential.user.uid),
      {
        lastLogin: serverTimestamp(),
        status: "active", // Ensure user status is active
      },
      { merge: true },
    )
    console.log("Last login timestamp updated")

    return { success: true, user: userCredential.user }
  } catch (error: any) {
    console.error("Login error:", error)
    console.error("Error code:", error.code)
    console.error("Error message:", error.message)

    // Provide more specific error messages based on Firebase error codes
    if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
      return { success: false, error: "Invalid email or password. Please try again." }
    } else if (error.code === "auth/too-many-requests") {
      return { success: false, error: "Too many failed login attempts. Please try again later or reset your password." }
    } else if (error.code === "auth/user-disabled") {
      return { success: false, error: "This account has been disabled. Please contact support." }
    } else if (error.code === "auth/configuration-not-found") {
      return { success: false, error: "Authentication service is not properly configured. Please try again later." }
    }

    return { success: false, error: error.message || "Failed to sign in" }
  }
}

// Sign out
export const signOut = async () => {
  // Check if Firebase is initialized
  if (!ensureFirebaseInitialized()) {
    return {
      success: false,
      error: "Authentication service is not available. Please try again later.",
    }
  }

  try {
    // Get current user before signing out
    const currentUser = auth.currentUser

    // Sign out the user
    await firebaseSignOut(auth)
    console.log("User signed out successfully")

    // Update user status in Firestore if we have a user
    if (currentUser) {
      await updateDoc(doc(db, "users", currentUser.uid), {
        status: "inactive",
        lastLogout: serverTimestamp(),
      })
      console.log("User status updated to inactive")
    }

    // Clear any user data from localStorage
    localStorage.removeItem("user")

    // Return success without redirecting - let the component handle navigation
    return { success: true }
  } catch (error: any) {
    console.error("Logout error:", error)
    return { success: false, error: error.message || "Failed to sign out" }
  }
}

// Reset password
export const resetPassword = async (email: string) => {
  // Check if Firebase is initialized
  if (!ensureFirebaseInitialized()) {
    return {
      success: false,
      error: "Authentication service is not available. Please try again later.",
    }
  }

  try {
    await sendPasswordResetEmail(auth, email)
    console.log("Password reset email sent to:", email)
    return { success: true }
  } catch (error: any) {
    console.error("Password reset error:", error)

    if (error.code === "auth/user-not-found") {
      // For security reasons, don't reveal if the email exists or not
      return { success: true } // Still return success to prevent email enumeration
    } else if (error.code === "auth/invalid-email") {
      return { success: false, error: "Please provide a valid email address." }
    } else if (error.code === "auth/configuration-not-found") {
      return { success: false, error: "Authentication service is not properly configured. Please try again later." }
    }

    return { success: false, error: error.message || "Failed to send password reset email" }
  }
}

// Get current user
export const getCurrentUser = (): User | null => {
  if (!auth) return null
  return auth.currentUser
}

// Get user data from Firestore
export const getUserData = async (userId: string) => {
  // Check if Firebase is initialized
  if (!ensureFirebaseInitialized()) {
    return {
      success: false,
      error: "Database service is not available. Please try again later.",
    }
  }

  try {
    const userDoc = await getDoc(doc(db, "users", userId))
    if (userDoc.exists()) {
      return { success: true, userData: userDoc.data() }
    } else {
      return { success: false, error: "User not found" }
    }
  } catch (error: any) {
    console.error("Get user data error:", error)
    return { success: false, error: error.message || "Failed to get user data" }
  }
}

// Auth state observer
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  if (!auth) {
    console.error("Auth service not initialized")
    callback(null)
    return () => {} // Return empty unsubscribe function
  }

  return onAuthStateChanged(auth, callback)
}

// Update user's lastSeen timestamp
export const updateLastSeen = async (userId: string) => {
  if (!ensureFirebaseInitialized() || !userId) {
    return { success: false, error: "Cannot update lastSeen timestamp" }
  }

  try {
    await updateDoc(doc(db, "users", userId), {
      lastSeen: serverTimestamp(),
    })
    return { success: true }
  } catch (error: any) {
    console.error("Error updating lastSeen timestamp:", error)
    return { success: false, error: error.message || "Failed to update lastSeen timestamp" }
  }
}

