"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Eye, Mail, MoreHorizontal } from "lucide-react"
import UserDetailsDialog from "@/components/user-details-dialog"

// Update the UserCard component to display last seen status
export default function UserCard({ user }) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Format date safely
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch (error) {
      return "Unknown date"
    }
  }

  // Format relative time for last seen
  const formatLastSeen = (dateString) => {
    if (!dateString) return "Never"

    try {
      const lastSeenDate = new Date(dateString)
      const now = new Date()
      const diffInSeconds = Math.floor((now - lastSeenDate) / 1000)

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
        return formatDate(dateString)
      }
    } catch (error) {
      return "Unknown"
    }
  }

  // Get initials for avatar
  const getInitials = () => {
    if (!user.name) return "U"
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <>
      <Card className="border-gold/20 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={user.avatar} alt={user.name || "User"} />
                <AvatarFallback className="bg-blue text-white">{getInitials()}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base text-blue">{user.name || "Unnamed User"}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Mail className="h-3 w-3 text-orange" />
                  {user.email || "No email"}
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-gold hover:bg-gold/10">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Joined</span>
              <span>{formatDate(user.joinedAt)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last Login</span>
              <span className={user.lastLogin ? "text-blue-600" : "text-gray-500"}>
                {formatLastSeen(user.lastLogin)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last Seen</span>
              <span className={user.lastSeen ? "text-green-600" : "text-gray-500"}>
                {formatLastSeen(user.lastSeen)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Reviews</span>
              <span>{user.reviewCount || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Role</span>
              <Badge variant="outline" className={user.role === "admin" ? "bg-orange text-white" : ""}>
                {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User"}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge
                variant={user.status === "active" ? "default" : "outline"}
                className={user.status === "active" ? "bg-blue hover:bg-blue/90" : ""}
              >
                {user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : "Unknown"}
              </Badge>
            </div>
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1 border-blue text-blue hover:bg-blue/10"
                onClick={() => setIsDetailsOpen(true)}
              >
                <Eye className="h-3.5 w-3.5" />
                View Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <UserDetailsDialog isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} userId={user.id} />
    </>
  )
}

