"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { StarIcon } from "@/components/icons"
import { formatDate } from "@/lib/utils"
import { markNotificationAsRead } from "@/lib/data"

type Review = {
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

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})
  const searchParams = useSearchParams()
  const eventId = searchParams.get("eventId")
  const reviewId = searchParams.get("reviewId")
  const reviewRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true)
      try {
        // Use Firebase to get reviews
        const { getAllReviews } = await import("@/lib/firebase/reviews")
        const allReviews = await getAllReviews()
        setReviews(allReviews)
      } catch (error) {
        console.error("Error fetching reviews:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReviews()
  }, [])

  // Mark notification as read when a review is highlighted
  useEffect(() => {
    if (reviewId) {
      // Mark the notification as read
      const markAsRead = async () => {
        try {
          // Find the notification ID from the URL or local storage
          // In a real app, you would have a way to map reviewId to notificationId
          // For now, we'll use a simple approach
          const notificationId = `notification_${reviewId}`
          await markNotificationAsRead(notificationId)
        } catch (error) {
          console.error("Error marking notification as read:", error)
        }
      }

      markAsRead()

      // Scroll to the highlighted review
      setTimeout(() => {
        const reviewElement = reviewRefs.current[reviewId]
        if (reviewElement) {
          reviewElement.scrollIntoView({ behavior: "smooth", block: "center" })
          reviewElement.classList.add("ring-2", "ring-primary", "ring-offset-2")

          // Remove highlight after animation
          setTimeout(() => {
            reviewElement.classList.remove("ring-2", "ring-primary", "ring-offset-2")
          }, 3000)
        }
      }, 100)
    }
  }, [reviewId, reviews])

  const handleReplySubmit = async (reviewId: string) => {
    if (!replyText[reviewId]?.trim()) return

    setSubmitting((prev) => ({ ...prev, [reviewId]: true }))

    try {
      // Get the current admin ID
      const { getFirebaseAuth } = await import("@/lib/firebase-config")
      const auth = getFirebaseAuth()
      const adminId = auth?.currentUser?.uid || "admin"

      // Use Firebase to add reply
      const { addReplyToReview } = await import("@/lib/firebase/reviews")
      const result = await addReplyToReview(reviewId, replyText[reviewId], adminId)

      if (result.success) {
        // Update the review in the local state
        setReviews((prevReviews) =>
          prevReviews.map((review) =>
            review.id === reviewId
              ? {
                  ...review,
                  adminReply: {
                    comment: replyText[reviewId],
                    date: new Date().toISOString(),
                  },
                }
              : review,
          ),
        )

        // Clear the reply text
        setReplyText((prev) => ({ ...prev, [reviewId]: "" }))
      } else {
        console.error("Failed to reply to review:", result.error)
        alert("Failed to reply to review. Please try again.")
      }
    } catch (error) {
      console.error("Error replying to review:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setSubmitting((prev) => ({ ...prev, [reviewId]: false }))
    }
  }

  // Filter reviews based on the eventId query parameter
  const filteredReviews = eventId ? reviews.filter((review) => review.eventId === eventId) : reviews

  // Group reviews by sentiment
  const positiveReviews = filteredReviews.filter((review) => review.sentiment === "positive")
  const negativeReviews = filteredReviews.filter((review) => review.sentiment === "negative")
  const neutralReviews = filteredReviews.filter((review) => review.sentiment === "neutral")
  const pendingReviews = filteredReviews.filter((review) => !review.adminReply)
  const repliedReviews = filteredReviews.filter((review) => review.adminReply)

  // Determine the default tab based on the presence of reviewId
  const defaultTab = reviewId ? "all" : pendingReviews.length > 0 ? "pending" : "all"

  // Check if there are any new reviews (for notification banner)
  const hasNewReviews = pendingReviews.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reviews</h1>
        {eventId && (
          <Button variant="outline" onClick={() => window.history.back()}>
            Back to All Reviews
          </Button>
        )}
      </div>

      {hasNewReviews && (
        <div className="bg-blue/10 border border-blue rounded-lg p-4 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-blue">New Reviews Available</h3>
            <p className="text-sm text-muted-foreground">
              You have {pendingReviews.length} new {pendingReviews.length === 1 ? "review" : "reviews"} that{" "}
              {pendingReviews.length === 1 ? "needs" : "need"} your attention.
            </p>
          </div>
          <Button
            variant="default"
            className="bg-blue hover:bg-blue/90"
            onClick={() => document.getElementById("pending-tab")?.click()}
          >
            View New Reviews
          </Button>
        </div>
      )}

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid grid-cols-6">
          <TabsTrigger value="all" className="relative">
            All
            <Badge variant="outline" className="ml-2">
              {filteredReviews.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger id="pending-tab" value="pending" className="relative">
            Pending
            {pendingReviews.length > 0 && <Badge className="ml-2 bg-orange text-white">{pendingReviews.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="replied" className="relative">
            Replied
            <Badge variant="outline" className="ml-2">
              {repliedReviews.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="positive" className="relative">
            Positive
            <Badge variant="outline" className="ml-2 bg-green-50 text-green-600 border-green-200">
              {positiveReviews.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="neutral" className="relative">
            Neutral
            <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-600 border-blue-200">
              {neutralReviews.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="negative" className="relative">
            Negative
            <Badge variant="outline" className="ml-2 bg-red-50 text-red-600 border-red-200">
              {negativeReviews.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <ReviewList
            reviews={filteredReviews}
            replyText={replyText}
            setReplyText={setReplyText}
            submitting={submitting}
            handleReplySubmit={handleReplySubmit}
            isLoading={isLoading}
            highlightedReviewId={reviewId}
            reviewRefs={reviewRefs}
          />
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <ReviewList
            reviews={pendingReviews}
            replyText={replyText}
            setReplyText={setReplyText}
            submitting={submitting}
            handleReplySubmit={handleReplySubmit}
            isLoading={isLoading}
            emptyMessage="No pending reviews"
            highlightedReviewId={reviewId}
            reviewRefs={reviewRefs}
          />
        </TabsContent>

        <TabsContent value="replied" className="mt-6">
          <ReviewList
            reviews={repliedReviews}
            replyText={replyText}
            setReplyText={setReplyText}
            submitting={submitting}
            handleReplySubmit={handleReplySubmit}
            isLoading={isLoading}
            emptyMessage="No replied reviews"
            highlightedReviewId={reviewId}
            reviewRefs={reviewRefs}
          />
        </TabsContent>

        <TabsContent value="positive" className="mt-6">
          <ReviewList
            reviews={positiveReviews}
            replyText={replyText}
            setReplyText={setReplyText}
            submitting={submitting}
            handleReplySubmit={handleReplySubmit}
            isLoading={isLoading}
            emptyMessage="No positive reviews"
            highlightedReviewId={reviewId}
            reviewRefs={reviewRefs}
          />
        </TabsContent>

        <TabsContent value="neutral" className="mt-6">
          <ReviewList
            reviews={neutralReviews}
            replyText={replyText}
            setReplyText={setReplyText}
            submitting={submitting}
            handleReplySubmit={handleReplySubmit}
            isLoading={isLoading}
            emptyMessage="No neutral reviews"
            highlightedReviewId={reviewId}
            reviewRefs={reviewRefs}
          />
        </TabsContent>

        <TabsContent value="negative" className="mt-6">
          <ReviewList
            reviews={negativeReviews}
            replyText={replyText}
            setReplyText={setReplyText}
            submitting={submitting}
            handleReplySubmit={handleReplySubmit}
            isLoading={isLoading}
            emptyMessage="No negative reviews"
            highlightedReviewId={reviewId}
            reviewRefs={reviewRefs}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface ReviewListProps {
  reviews: Review[]
  replyText: Record<string, string>
  setReplyText: React.Dispatch<React.SetStateAction<Record<string, string>>>
  submitting: Record<string, boolean>
  handleReplySubmit: (reviewId: string) => Promise<void>
  isLoading: boolean
  emptyMessage?: string
  highlightedReviewId?: string | null
  reviewRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>
}

function ReviewList({
  reviews,
  replyText,
  setReplyText,
  submitting,
  handleReplySubmit,
  isLoading,
  emptyMessage = "No reviews found",
  highlightedReviewId,
  reviewRefs,
}: ReviewListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-pulse text-center">
          <p className="text-muted-foreground">Loading reviews...</p>
        </div>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <Card
          key={review.id}
          className={`${
            review.sentiment === "positive"
              ? "border-l-4 border-l-green-500"
              : review.sentiment === "negative"
                ? "border-l-4 border-l-red-500"
                : "border-l-4 border-l-blue-500"
          } ${!review.adminReply ? "bg-blue-50/30" : ""}`}
          ref={(el) => {
            reviewRefs.current[review.id] = el
          }}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={review.userAvatar} alt={review.userName} />
                  <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">{review.userName}</CardTitle>
                  <div className="flex items-center gap-1 mt-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-3.5 w-3.5 ${i < review.rating ? "text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge
                  variant="outline"
                  className={`${
                    review.sentiment === "positive"
                      ? "bg-green-50 text-green-600 border-green-200"
                      : review.sentiment === "negative"
                        ? "bg-red-50 text-red-600 border-red-200"
                        : "bg-blue-50 text-blue-600 border-blue-200"
                  }`}
                >
                  {review.sentiment.charAt(0).toUpperCase() + review.sentiment.slice(1)}
                </Badge>
                <span className="text-xs text-muted-foreground">{formatDate(review.date)}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">Event: {review.eventTitle}</p>
              <p className="text-sm">{review.comment}</p>
            </div>
            {review.adminReply && (
              <div className="mt-4 pt-3 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>A</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Admin Reply</span>
                    <span className="text-xs text-muted-foreground">{formatDate(review.adminReply.date)}</span>
                  </div>
                </div>
                <p className="text-sm">{review.adminReply.comment}</p>
              </div>
            )}
          </CardContent>
          {!review.adminReply && (
            <CardFooter className="flex flex-col gap-3 pt-0">
              <Textarea
                placeholder="Write a reply to this review..."
                value={replyText[review.id] || ""}
                onChange={(e) => setReplyText((prev) => ({ ...prev, [review.id]: e.target.value }))}
                className="min-h-[80px]"
              />
              <div className="flex justify-end w-full">
                <Button
                  onClick={() => handleReplySubmit(review.id)}
                  disabled={!replyText[review.id]?.trim() || submitting[review.id]}
                >
                  {submitting[review.id] ? "Submitting..." : "Submit Reply"}
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  )
}

