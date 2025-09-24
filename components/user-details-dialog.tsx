"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoaderIcon, MapPinIcon, MailIcon, UserIcon, StarIcon } from "@/components/icons"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

export default function UserDetailsDialog({ isOpen, onClose, userId }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("profile")

  // Fetch the latest user data directly from Firestore
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!userId || !isOpen) return

      setIsLoading(true)
      setError(null)

      try {
        console.log("Fetching user details for ID:", userId)

        // Get fresh user data from Firestore
        const userDocRef = doc(db, "users", userId)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          const userData = userDoc.data()
          console.log("User data retrieved:", userData)

          // Handle different date field names
          let joinedAt = userData.createdAt || userData.joinedAt || userData.created || new Date()
          let lastLogin = userData.lastLogin || null
          let updatedAt = userData.updatedAt || null
          let lastSeen = userData.lastSeen || null

          // Convert Firestore timestamps to Date objects
          try {
            joinedAt = joinedAt.toDate ? joinedAt.toDate() : new Date(joinedAt)
          } catch (e) {
            console.warn("Error converting joinedAt date:", e)
            joinedAt = new Date()
          }

          try {
            lastLogin = lastLogin ? (lastLogin.toDate ? lastLogin.toDate() : new Date(lastLogin)) : null
          } catch (e) {
            console.warn("Error converting lastLogin date:", e)
            lastLogin = null
          }

          try {
            updatedAt = updatedAt ? (updatedAt.toDate ? updatedAt.toDate() : new Date(updatedAt)) : null
          } catch (e) {
            console.warn("Error converting updatedAt date:", e)
            updatedAt = null
          }

          try {
            lastSeen = lastSeen ? (lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen)) : null
          } catch (e) {
            console.warn("Error converting lastSeen date:", e)
            lastSeen = null
          }

          // Process user data with defaults for missing fields
          const processedUser = {
            id: userDoc.id,
            ...userData,
            joinedAt: joinedAt,
            lastLogin: lastLogin,
            updatedAt: updatedAt,
            lastSeen: lastSeen,
            // Ensure these fields exist with defaults
            name: userData.name || userData.displayName || "Unnamed User",
            email: userData.email || "No email",
            role: userData.role || "user",
            status: userData.status || "active",
            bio: userData.bio || "",
            location: userData.location || "",
            reviewCount: userData.reviewCount || 0,
            eventsAttended: userData.eventsAttended || 0,
            avatar: userData.avatar || userData.photoURL || null,
          }

          console.log("Processed user data:", processedUser)
          setUser(processedUser)
        } else {
          console.warn("User document not found for ID:", userId)
          setError("User not found")
        }
      } catch (err) {
        console.error("Error fetching user details:", err)
        setError("Failed to load user details")
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen) {
      fetchUserDetails()
    }
  }, [userId, isOpen])

  // Get initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Format date for display
  const formatDate = (date) => {
    if (!date) return "N/A"
    try {
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)
    } catch (error) {
      console.error("Date formatting error:", error)
      return "Invalid date"
    }
  }

  // Add a formatRelativeTime function for last seen display
  const formatRelativeTime = (date) => {
    if (!date) return "Never"

    try {
      const now = new Date()
      const diffInSeconds = Math.floor((now - date) / 1000)

      if (diffInSeconds < 60) {
        return "Just now"
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60)
        return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600)
        return `${hours} ${hours === 1 ? "hour" : "hours"} ago`
      } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400)
        return `${days} ${days === 1 ? "day" : "days"} ago`
      } else {
        return formatDate(date)
      }
    } catch (error) {
      console.error("Date formatting error:", error)
      return "Unknown"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
            <Button variant="outline" onClick={onClose} className="mt-4">
              Close
            </Button>
          </div>
        ) : user ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-blue">User Details</DialogTitle>
              <DialogDescription>Detailed information about this user</DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6">
                {/* User header with avatar and basic info */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6">
                  <Avatar className="h-24 w-24 border-2 border-gold">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-blue text-white text-xl">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-xl font-bold">{user.name}</h3>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                      <Badge variant="outline" className={user.role === "admin" ? "bg-orange text-white" : ""}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                      <Badge
                        variant={user.status === "active" ? "default" : "outline"}
                        className={user.status === "active" ? "bg-blue hover:bg-blue/90" : ""}
                      >
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
                      <MailIcon className="h-4 w-4 text-orange" />
                      <span className="text-sm">{user.email}</span>
                    </div>
                    {user.location && (
                      <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                        <MapPinIcon className="h-4 w-4 text-blue" />
                        <span className="text-sm">{user.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-4" />

                {/* User bio */}
                <div className="mb-6">
                  <h4 className="text-md font-semibold mb-2 flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-blue" />
                    Bio
                  </h4>
                  <Card className="p-4 bg-gray-50 dark:bg-gray-900">
                    <p className="text-sm whitespace-pre-wrap">
                      {user.bio ? user.bio : "This user hasn't added a bio yet."}
                    </p>
                  </Card>
                </div>

                {/* User account details */}
                <div>
                  <h4 className="text-md font-semibold mb-2">Account Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Joined</span>
                      <span>{formatDate(user.joinedAt)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Login</span>
                      <span>{user.lastLogin ? formatDate(user.lastLogin) : "Never"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Seen</span>
                      <span className={user.lastSeen ? "text-green-600" : "text-gray-500"}>
                        {formatRelativeTime(user.lastSeen)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Updated</span>
                      <span>{user.updatedAt ? formatDate(user.updatedAt) : "Never"}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="activity">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-semibold mb-2 flex items-center gap-2">
                      <StarIcon className="h-4 w-4 text-orange" />
                      Activity Summary
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="p-4 bg-gray-50 dark:bg-gray-900">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-blue">{user.reviewCount}</p>
                          <p className="text-sm text-muted-foreground">Reviews Submitted</p>
                        </div>
                      </Card>
                      <Card className="p-4 bg-gray-50 dark:bg-gray-900">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-orange">{user.eventsAttended}</p>
                          <p className="text-sm text-muted-foreground">Events Attended</p>
                        </div>
                      </Card>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-semibold mb-2">Recent Activity</h4>
                    <Card className="p-4 bg-gray-50 dark:bg-gray-900">
                      <p className="text-sm text-center text-muted-foreground">Detailed activity history coming soon</p>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p>No user data available</p>
            <Button variant="outline" onClick={onClose} className="mt-4">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

