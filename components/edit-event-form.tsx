"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, ImageIcon } from "lucide-react"
import { cn, formatDate } from "@/lib/utils"
import { updateEvent } from "@/lib/actions"
import { toast } from "@/hooks/use-toast"
import type { Event } from "@/lib/data"

// Categories for events
const EVENT_CATEGORIES = [
  "Conference",
  "Workshop",
  "Seminar",
  "Networking",
  "Social",
  "Concert",
  "Exhibition",
  "Sports",
  "Charity",
  "Other",
]

export default function EditEventForm({ event }: { event: Event }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(event.image || null)
  const [imageData, setImageData] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(event.date ? new Date(event.date) : undefined)

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Image too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setImagePreview(result)
      setImageData(result)
    }
    reader.readAsDataURL(file)
  }

  // Handle form submission
  async function clientAction(formData: FormData) {
    setIsSubmitting(true)

    try {
      // Add the image data to the form if it exists
      if (imageData) {
        formData.set("imageData", imageData)
      }

      // Add the selected date to the form
      if (selectedDate) {
        const formattedDate = selectedDate.toISOString().split("T")[0]
        formData.set("date", formattedDate)
      }

      const result = await updateEvent(event.id, formData)

      if (result.success) {
        toast({
          title: "Event updated",
          description: "The event has been updated successfully",
        })
        router.push(`/admin/events/${event.id}`)
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update event",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating event:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form action={clientAction} className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="title">Event Title</Label>
              <Input id="title" name="title" defaultValue={event.title} required />
            </div>

            <div className="grid gap-3">
              <Label>Event Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? formatDate(selectedDate) : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="time">Event Time (optional)</Label>
              <Input id="time" name="time" defaultValue={event.time || ""} placeholder="e.g. 6:00 PM - 9:00 PM" />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" defaultValue={event.location} required />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="category">Category</Label>
              <Select name="category" defaultValue={event.category || "Other"}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="price">Price (optional)</Label>
              <Input id="price" name="price" defaultValue={event.price || ""} placeholder="e.g. Free, R100, R50-R200" />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min="1"
                defaultValue={event.capacity || 100}
                required
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={5} defaultValue={event.description} required />
            </div>

            <div className="grid gap-3">
              <Label>Event Image</Label>
              <div className="grid gap-3">
                {imagePreview && (
                  <div className="relative aspect-video overflow-hidden rounded-lg border">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Event preview"
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Label
                    htmlFor="image-upload"
                    className="flex h-10 cursor-pointer items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Upload Image
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </Label>
                  <span className="text-sm text-muted-foreground">Max size: 5MB</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/admin/events/${event.id}`)}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update Event"}
        </Button>
      </div>
    </form>
  )
}

