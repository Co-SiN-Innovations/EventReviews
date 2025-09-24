"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoaderIcon, SearchIcon, UsersIcon } from "@/components/icons"
import UserCard from "@/components/user-card"
import { collection, getDocs, query } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { useAuth } from "@/lib/context/auth-context"
import { Button } from "@/components/ui/button"

export default function UsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all users from Firestore
  useEffect(() => {
    const fetchAllUsers = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Get all users from the users collection
        const usersCollection = collection(db, "users")

        // Create a query that doesn't filter out any users
        const usersQuery = query(usersCollection)
        const querySnapshot = await getDocs(usersQuery)

        if (querySnapshot.empty) {
          console.log("No users found in the database")
          setUsers([])
          setFilteredUsers([])
        } else {
          console.log(`Found ${querySnapshot.docs.length} users in the database`)

          const usersData = querySnapshot.docs.map((doc) => {
            const data = doc.data()

            // Handle different date field names that might exist
            let joinedAt = null
            if (data.createdAt) {
              joinedAt = data.createdAt
            } else if (data.joinedAt) {
              joinedAt = data.joinedAt
            } else if (data.created) {
              joinedAt = data.created
            }

            // Convert timestamp to ISO string or use current date
            let joinedAtISO = new Date().toISOString()
            if (joinedAt) {
              try {
                joinedAtISO = joinedAt.toDate ? joinedAt.toDate().toISOString() : new Date(joinedAt).toISOString()
              } catch (e) {
                console.warn("Error converting joinedAt date for user", doc.id, e)
              }
            }

            // Convert lastLogin timestamp if it exists
            let lastLoginISO = null
            if (data.lastLogin) {
              try {
                lastLoginISO = data.lastLogin.toDate
                  ? data.lastLogin.toDate().toISOString()
                  : new Date(data.lastLogin).toISOString()
              } catch (e) {
                console.warn("Error converting lastLogin date for user", doc.id, e)
              }
            }

            // Convert lastSeen timestamp if it exists
            let lastSeenISO = null
            if (data.lastSeen) {
              try {
                lastSeenISO = data.lastSeen.toDate
                  ? data.lastSeen.toDate().toISOString()
                  : new Date(data.lastSeen).toISOString()
              } catch (e) {
                console.warn("Error converting lastSeen date for user", doc.id, e)
              }
            }

            return {
              id: doc.id,
              ...data,
              name: data.name || data.displayName || "Unnamed User",
              email: data.email || "No email",
              role: data.role || "user",
              status: data.status || "active",
              joinedAt: joinedAtISO,
              lastLogin: lastLoginISO,
              lastSeen: lastSeenISO,
              reviewCount: data.reviewCount || 0,
              // Ensure these fields exist even if empty
              location: data.location || "",
              bio: data.bio || "",
              avatar: data.avatar || data.photoURL || null,
            }
          })

          // Sort users by joinedAt date (newest first)
          usersData.sort((a, b) => {
            return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
          })

          setUsers(usersData)
          setFilteredUsers(usersData)
          console.log("Users data processed successfully:", usersData.length)
        }
      } catch (error) {
        console.error("Error fetching users:", error)
        setError("Failed to load users. Please try again.")

        // Try to load from local data as fallback
        try {
          const { getAllUsers } = await import("@/lib/data")
          const localUsers = await getAllUsers()
          console.log("Loaded users from local data as fallback:", localUsers.length)
          setUsers(localUsers)
          setFilteredUsers(localUsers)
        } catch (fallbackError) {
          console.error("Fallback error:", fallbackError)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllUsers()

    // Set up polling to check for new users every 60 seconds
    const intervalId = setInterval(() => {
      fetchAllUsers()
    }, 60000)

    return () => clearInterval(intervalId)
  }, [])

  // Filter users based on search query and active tab
  useEffect(() => {
    let result = users

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (user) =>
          (user.name?.toLowerCase() || "").includes(query) ||
          (user.email?.toLowerCase() || "").includes(query) ||
          (user.location?.toLowerCase() || "").includes(query),
      )
    }

    // Filter by tab
    if (activeTab === "admin") {
      result = result.filter((user) => user.role === "admin")
    } else if (activeTab === "user") {
      result = result.filter((user) => user.role === "user" || !user.role)
    }

    setFilteredUsers(result)
  }, [users, searchQuery, activeTab])

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  // Handle tab change
  const handleTabChange = (value) => {
    setActiveTab(value)
  }

  // Refresh users list
  const handleRefresh = () => {
    setIsLoading(true)
    setError(null)

    // Fetch users again
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, "users")
        const usersQuery = query(usersCollection)
        const querySnapshot = await getDocs(usersQuery)

        const usersData = querySnapshot.docs.map((doc) => {
          const data = doc.data()

          // Handle different date field names
          const joinedAt = data.createdAt || data.joinedAt || data.created || new Date()
          const joinedAtISO = joinedAt.toDate ? joinedAt.toDate().toISOString() : new Date(joinedAt).toISOString()

          // Process lastSeen timestamp
          let lastSeenISO = null
          if (data.lastSeen) {
            try {
              lastSeenISO = data.lastSeen.toDate
                ? data.lastSeen.toDate().toISOString()
                : new Date(data.lastSeen).toISOString()
            } catch (e) {
              console.warn("Error converting lastSeen date for user", doc.id, e)
            }
          }

          return {
            id: doc.id,
            ...data,
            name: data.name || data.displayName || "Unnamed User",
            email: data.email || "No email",
            role: data.role || "user",
            status: data.status || "active",
            joinedAt: joinedAtISO,
            lastLogin: data.lastLogin
              ? data.lastLogin.toDate
                ? data.lastLogin.toDate().toISOString()
                : new Date(data.lastLogin).toISOString()
              : null,
            lastSeen: lastSeenISO,
            reviewCount: data.reviewCount || 0,
            location: data.location || "",
            bio: data.bio || "",
            avatar: data.avatar || data.photoURL || null,
          }
        })

        // Sort users by joinedAt date (newest first)
        usersData.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())

        setUsers(usersData)
        setFilteredUsers(usersData)
      } catch (error) {
        console.error("Error refreshing users:", error)
        setError("Failed to refresh users. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage and view all users of the platform</p>
        </div>
        <Button
          onClick={handleRefresh}
          className="mt-4 md:mt-0 bg-blue text-white hover:bg-blue/90"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Refresh Users"
          )}
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search users by name, email, or location..."
            className="pl-10"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Users ({users.length})</TabsTrigger>
          <TabsTrigger value="admin">Admins ({users.filter((u) => u.role === "admin").length})</TabsTrigger>
          <TabsTrigger value="user">
            Regular Users ({users.filter((u) => u.role === "user" || !u.role).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : error ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-red-500 mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mx-auto mb-2"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <h3 className="text-lg font-medium">Error Loading Users</h3>
                <p className="text-muted-foreground text-center mt-2">{error}</p>
                <Button className="mt-4" onClick={handleRefresh}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : filteredUsers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <UsersIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No users found</h3>
                <p className="text-muted-foreground text-center mt-2">
                  {searchQuery ? "Try adjusting your search query" : "There are no users in this category yet"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

