"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Star, ThumbsUp, ThumbsDown, Minus } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { Review } from "@/lib/data"

export default function UserReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true)
      try {
        // Get the current authenticated user
        const { getFirebaseAuth } = await import("@/lib/firebase-config")
        const auth = getFirebaseAuth()

        if (!auth || !auth.currentUser) {
          console.warn("User not authenticated, using fallback ID")
          // Fallback to a generic ID if not authenticated
          const userId = "current-user"
          const { getUserReviews } = await import("@/lib/firebase/reviews")
          try {
            const userReviews = await getUserReviews(userId)
            setReviews(userReviews)
          } catch (error) {
            console.error("Error fetching reviews:", error)
            // Show a more user-friendly message
            if (error instanceof Error && error.message.includes("requires an index")) {
              console.warn("Database index not yet created. Using empty reviews list for now.")
              setReviews([])
            } else {
              // For other errors, set empty reviews
              setReviews([])
            }
          }
        } else {
          // Use the authenticated user's ID
          const userId = auth.currentUser.uid
          const { getUserReviews } = await import("@/lib/firebase/reviews")
          try {
            const userReviews = await getUserReviews(userId)
            setReviews(userReviews)
          } catch (error) {
            console.error("Error fetching reviews:", error)
            // Show a more user-friendly message
            if (error instanceof Error && error.message.includes("requires an index")) {
              console.warn("Database index not yet created. Using empty reviews list for now.")
              setReviews([])
            } else {
              // For other errors, set empty reviews
              setReviews([])
            }
          }
        }
      } catch (error) {
        console.error("Error in auth process:", error)
        setReviews([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchReviews()

    // Listen for storage events to update when reviews are added in other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "reviews") {
        fetchReviews()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  // Filter reviews based on admin replies
  const repliedReviews = reviews.filter((r) => r.adminReply)
  const unrepliedReviews = reviews.filter((r) => !r.adminReply)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">My Reviews</h1>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Reviews</TabsTrigger>
          <TabsTrigger value="replied">With Replies</TabsTrigger>
          <TabsTrigger value="unreplied">Without Replies</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-pulse text-center">
                  <p className="text-muted-foreground">Loading reviews...</p>
                </div>
              </div>
            ) : reviews.length > 0 ? (
              reviews.map((review) => <ReviewCard key={review.id} review={review} />)
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Star className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No reviews yet</h3>
                <p className="text-muted-foreground max-w-md">
                  You haven't submitted any reviews yet. Share your experiences by reviewing events you've attended.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="replied" className="mt-4">
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-pulse text-center">
                  <p className="text-muted-foreground">Loading reviews...</p>
                </div>
              </div>
            ) : repliedReviews.length > 0 ? (
              repliedReviews.map((review) => <ReviewCard key={review.id} review={review} />)
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Star className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No replies yet</h3>
                <p className="text-muted-foreground max-w-md">
                  None of your reviews have received replies from event organizers yet.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="unreplied" className="mt-4">
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-pulse text-center">
                  <p className="text-muted-foreground">Loading reviews...</p>
                </div>
              </div>
            ) : unrepliedReviews.length > 0 ? (
              unrepliedReviews.map((review) => <ReviewCard key={review.id} review={review} />)
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Star className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">All reviews have replies</h3>
                <p className="text-muted-foreground max-w-md">
                  All of your reviews have received replies from event organizers.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ReviewCard({ review }: { review: any }) {
  // Get sentiment icon
  const getSentimentIcon = () => {
    switch (review.sentiment) {
      case "positive":
        return <ThumbsUp className="h-4 w-4 text-green-500" />
      case "negative":
        return <ThumbsDown className="h-4 w-4 text-red-500" />
      case "neutral":
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  // Get sentiment text
  const getSentimentText = () => {
    switch (review.sentiment) {
      case "positive":
        return "Positive"
      case "negative":
        return "Negative"
      case "neutral":
      default:
        return "Neutral"
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{review.eventTitle || "Event"}</h3>
              <p className="text-sm text-muted-foreground">{formatDate(review.date)}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-500" fill="currentColor" />
                ))}
              </div>
              {review.sentiment && (
                <Badge variant="outline" className="flex items-center gap-1 ml-2">
                  {getSentimentIcon()}
                  <span className="text-xs">{getSentimentText()}</span>
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Avatar>
              <AvatarImage src={review.userAvatar} alt={review.userName} />
              <AvatarFallback>{review.userName?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="font-medium">Your Review</p>
                <p className="text-xs text-muted-foreground">{formatDate(review.date)}</p>
              </div>
              <p>{review.comment}</p>
            </div>
          </div>

          {review.adminReply && (
            <div className="ml-12 border-l-2 pl-4">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarFallback>A</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Admin Reply</p>
                    <p className="text-xs text-muted-foreground">{formatDate(review.adminReply.date)}</p>
                  </div>
                  <p>{review.adminReply.comment}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm">
              Edit Review
            </Button>
            <Button variant="outline" size="sm">
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

