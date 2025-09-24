"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoaderIcon, CameraIcon, CheckCircleIcon } from "@/components/icons"
import { useAuth } from "@/lib/context/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { getAuth, updateProfile, onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const { user, userData } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [bio, setBio] = useState("")
  const [avatar, setAvatar] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Store original values for comparison
  const [originalValues, setOriginalValues] = useState({
    name: "",
    location: "",
    bio: "",
    avatar: null as string | null,
  })

  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    phoneNumber: "",
    address: "",
    bio: "",
  })

  // Add auth state listener to ensure auth is initialized
  useEffect(() => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, fetch their data
        fetchUserData()
      } else {
        // User is signed out, redirect to login
        router.push("/login")
      }
    })

    // Clean up subscription
    return () => unsubscribe()
  }, [])

  // Load user data
  useEffect(() => {
    if (userData) {
      const newName = userData.name || ""
      const newLocation = userData.location || ""
      const newBio = userData.bio || ""
      const newAvatar = userData.avatar || null

      // Set current form values
      setName(newName)
      setLocation(newLocation)
      setBio(newBio)
      setAvatar(newAvatar)

      // Store original values for comparison
      setOriginalValues({
        name: newName,
        location: newLocation,
        bio: newBio,
        avatar: newAvatar,
      })
    }
  }, [userData])

  useEffect(() => {
    fetchUserData()
  }, [])

  // Check if form has been modified
  const isFormModified = useMemo(() => {
    return (
      name !== originalValues.name ||
      location !== originalValues.location ||
      bio !== originalValues.bio ||
      avatar !== originalValues.avatar
    )
  }, [name, location, bio, avatar, originalValues])

  // Basic validation
  const isFormValid = useMemo(() => {
    return name.trim().length > 0
  }, [name])

  // Handle avatar upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatar(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Handle form submission
  // const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault()

  //   // Don't submit if no changes or invalid
  //   if (!isFormModified || !isFormValid) {
  //     return
  //   }

  //   setError(null)
  //   setSuccess(false)
  //   setIsLoading(true)

  //   try {
  //     if (!user) {
  //       throw new Error("You must be logged in to update your profile")
  //     }

  //     // Upload avatar if changed
  //     let avatarUrl = userData?.avatar || null
  //     if (avatar && avatar !== userData?.avatar) {
  //       const storageRef = ref(storage, `avatars/${user.uid}`)
  //       await uploadString(storageRef, avatar, "data_url")
  //       avatarUrl = await getDownloadURL(storageRef)
  //     }

  //     // Update profile
  //     const result = await updateUserProfile(user.uid, {
  //       name,
  //       location,
  //       bio,
  //       avatar: avatarUrl,
  //     })

  //     if (result.success) {
  //       setSuccess(true)

  //       // Update original values to match current values
  //       setOriginalValues({
  //         name,
  //         location,
  //         bio,
  //         avatar: avatarUrl,
  //       })

  //       toast({
  //         title: "Profile updated",
  //         description: "Your profile has been updated successfully.",
  //         duration: 3000,
  //       })
  //     } else {
  //       setError(result.error || "Failed to update profile")
  //       toast({
  //         title: "Update failed",
  //         description: result.error || "Failed to update profile",
  //         variant: "destructive",
  //         duration: 5000,
  //       })
  //     }
  //   } catch (err: any) {
  //     setError(err.message || "An unexpected error occurred")
  //     toast({
  //       title: "Error",
  //       description: err.message || "An unexpected error occurred",
  //       variant: "destructive",
  //       duration: 5000,
  //     })
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess(null)

    try {
      // Get the current auth state
      const auth = getAuth()
      const currentUser = auth.currentUser

      if (!currentUser) {
        setError("You must be logged in to update your profile")
        setIsLoading(false)
        return
      }

      // Get the user's ID token to verify authentication
      const idToken = await currentUser.getIdToken(true)

      if (!idToken) {
        setError("Authentication verification failed. Please try logging in again.")
        setIsLoading(false)
        return
      }

      // Update Firestore profile document
      const userDocRef = doc(db, "users", currentUser.uid)
      await updateDoc(userDocRef, {
        name: name,
        location: location,
        bio: bio,
        updatedAt: serverTimestamp(),
      })

      // Update Firebase Auth profile if display name changed
      if (name !== originalValues.name) {
        await updateProfile(currentUser, {
          displayName: name,
        })
      }

      // Update email if changed and not empty
      // if (formData.email && formData.email !== currentUser.email) {
      //   await updateEmail(currentUser, formData.email);
      // }

      setSuccess("Profile updated successfully!")
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
        duration: 3000,
      })
      // Refresh user data
      fetchUserData()
    } catch (err: any) {
      console.error("Profile update error:", err)

      // Provide more specific error messages based on error code
      if (err.code === "auth/requires-recent-login") {
        setError("For security reasons, please log out and log back in to update your profile.")
      } else if (err.code === "auth/email-already-in-use") {
        setError("This email is already in use by another account.")
      } else if (err.code === "auth/invalid-email") {
        setError("Please provide a valid email address.")
      } else {
        setError(err.message || "Failed to update profile. Please try again.")
      }
      toast({
        title: "Update failed",
        description: err.message || "Failed to update profile",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserData = useCallback(async () => {
    setIsLoading(true)
    try {
      const auth = getAuth()
      const currentUser = auth.currentUser

      if (!currentUser) {
        // Wait briefly to see if auth state initializes
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Check again after waiting
        const refreshedUser = auth.currentUser
        if (!refreshedUser) {
          setError("Unable to retrieve your profile. Please ensure you're logged in.")
          setIsLoading(false)
          return
        }
      }

      const user = currentUser || auth.currentUser
      const userDocRef = doc(db, "users", user.uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        const userData = userDoc.data()
        setName(userData.name || user.displayName || "")
        setLocation(userData.location || "")
        setBio(userData.bio || "")
        setOriginalValues({
          name: userData.name || user.displayName || "",
          location: userData.location || "",
          bio: userData.bio || "",
          avatar: originalValues.avatar,
        })
        setFormData({
          displayName: userData.displayName || user.displayName || "",
          email: userData.email || user.email || "",
          phoneNumber: userData.phoneNumber || "",
          address: userData.address || "",
          bio: userData.bio || "",
        })
      } else {
        // Create user document if it doesn't exist
        await setDoc(userDocRef, {
          displayName: user.displayName || "",
          email: user.email || "",
          phoneNumber: "",
          address: "",
          bio: "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        setName(user.displayName || "")
        setLocation("")
        setBio("")
        setOriginalValues({
          name: user.displayName || "",
          location: "",
          bio: "",
          avatar: originalValues.avatar,
        })
        setFormData({
          displayName: user.displayName || "",
          email: user.email || "",
          phoneNumber: "",
          address: "",
          bio: "",
        })
      }
    } catch (err: any) {
      console.error("Error fetching user data:", err)
      setError("Failed to load profile data. Please refresh the page.")
      toast({
        title: "Error",
        description: "Failed to load profile data. Please refresh the page.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }, [originalValues.avatar])

  // Reset form to original values
  const handleReset = () => {
    setName(originalValues.name)
    setLocation(originalValues.location)
    setBio(originalValues.bio)
    setAvatar(originalValues.avatar)
    setError(null)
    setSuccess(null)
  }

  // Get initials for avatar fallback
  const getInitials = () => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    }
    return user?.email?.charAt(0).toUpperCase() || "U"
  }

  return (
    <div className="container max-w-2xl mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

      <Card>
        <form onSubmit={handleUpdateProfile}>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal information and profile picture</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
                <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-600 dark:text-green-400">{success}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatar || ""} alt={name} />
                  <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-background"
                  onClick={() => document.getElementById("avatar-upload")?.click()}
                >
                  <CameraIcon className="h-4 w-4" />
                  <span className="sr-only">Upload avatar</span>
                </Button>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="space-y-2 flex-1">
                <Label htmlFor="name">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={name.trim() === "" ? "border-red-300 focus:border-red-500" : ""}
                />
                {name.trim() === "" && <p className="text-xs text-red-500">Name is required</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed. Contact support if you need to update your email.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="City, Country"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={handleReset} disabled={!isFormModified || isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !isFormModified || !isFormValid}
              className={!isFormModified || !isFormValid ? "opacity-50 cursor-not-allowed" : ""}
            >
              {isLoading ? (
                <>
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

