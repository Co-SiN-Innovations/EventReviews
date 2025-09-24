"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CalendarIcon, ImagePlusIcon, LoaderIcon } from "@/components/icons"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { createEvent } from "@/lib/actions"
import { MAJOR_CITIES, POPULAR_VENUES, EVENT_CATEGORIES, CURRENCY_SYMBOL } from "@/lib/constants"

export default function CreateEventPage() {
  const router = useRouter()
  const [date, setDate] = useState<Date>(new Date()) // Default to today
  const [isLoading, setIsLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedCity, setSelectedCity] = useState<string>("")
  const [selectedVenue, setSelectedVenue] = useState<string>("")
  const [useAutoImage, setUseAutoImage] = useState(true)

  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setImageError(null)

    if (!file) return

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setImageError("Please select a valid image file (JPEG, PNG, GIF, or WEBP)")
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setImageError(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
      return
    }

    setImageFile(file)
    setUseAutoImage(false)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCityChange = (city: string) => {
    setSelectedCity(city)
    // If a venue is already selected, update the location field
    if (selectedVenue) {
      const locationInput = document.getElementById("location") as HTMLInputElement
      if (locationInput) {
        locationInput.value = `${selectedVenue}, ${city}, South Africa`
      }
    }
  }

  const handleVenueChange = (venue: string) => {
    setSelectedVenue(venue)
    // Update the location field
    const locationInput = document.getElementById("location") as HTMLInputElement
    if (locationInput) {
      locationInput.value = `${venue}, ${selectedCity || "South Africa"}`
    }
  }

  // Format date to display in a readable format
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  async function clientAction(formData: FormData) {
    // If already loading, prevent duplicate submissions
    if (isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      // Add the date from the date picker to the form data
      if (date) {
        // Format date as YYYY-MM-DD to ensure consistency
        // Use UTC methods to avoid timezone issues
        const year = date.getUTCFullYear()
        const month = String(date.getUTCMonth() + 1).padStart(2, "0")
        const day = String(date.getUTCDate()).padStart(2, "0")
        formData.set("date", `${year}-${month}-${day}`)
      } else {
        // Set a default date if none is selected
        const defaultDate = new Date()
        const year = defaultDate.getUTCFullYear()
        const month = String(defaultDate.getUTCMonth() + 1).padStart(2, "0")
        const day = String(defaultDate.getUTCDate()).padStart(2, "0")
        formData.set("date", `${year}-${month}-${day}`)
      }

      // Add flag for auto image generation
      formData.set("useAutoImage", useAutoImage.toString())

      // If we have an image file and not using auto image, add it to the form data
      if (imageFile && !useAutoImage) {
        // For now, we'll store the image as a base64 string since we don't have a real backend
        formData.set("imageData", imagePreview || "")
      }

      const result = await createEvent(formData)

      if (result.success) {
        // Navigate programmatically on success
        router.push("/admin/events")
      } else {
        // Handle error
        setError(result.error || "Failed to create event")
        setIsLoading(false)
      }
    } catch (err) {
      console.error("Error creating event:", err)
      setError("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Create New Event</h1>

      <Card>
        <form action={clientAction}>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>Fill in the information below to create a new event in South Africa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">{error}</div>}

            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input id="title" name="title" placeholder="Enter event title" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Event Category</Label>
              <Select name="category">
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

            <div className="space-y-2">
              <Label htmlFor="date">Event Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? formatDate(date) : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">Select a future date for your event</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Event Time</Label>
              <Input id="time" name="time" placeholder="e.g., 14:00 - 17:00" />
              <p className="text-xs text-muted-foreground">South Africa Standard Time (SAST)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Select onValueChange={handleCityChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a city" />
                </SelectTrigger>
                <SelectContent>
                  {MAJOR_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <Select onValueChange={handleVenueChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a venue or enter custom" />
                </SelectTrigger>
                <SelectContent>
                  {POPULAR_VENUES.map((venue) => (
                    <SelectItem key={venue} value={venue}>
                      {venue}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Enter Custom Venue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Full Location</Label>
              <Input id="location" name="location" placeholder="Venue, City, South Africa" required />
              <p className="text-xs text-muted-foreground">Edit or confirm the full address</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price ({CURRENCY_SYMBOL})</Label>
              <Input id="price" name="price" placeholder="e.g., 150 or Free" defaultValue="Free" />
              <p className="text-xs text-muted-foreground">Enter price in South African Rand (ZAR)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Enter event description" rows={5} required />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="image">Event Image</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useAutoImage"
                    checked={useAutoImage}
                    onChange={(e) => {
                      setUseAutoImage(e.target.checked)
                      if (e.target.checked) {
                        setImageFile(null)
                        setImagePreview(null)
                      }
                    }}
                    className="mr-1"
                  />
                  <Label htmlFor="useAutoImage" className="text-sm font-normal cursor-pointer">
                    Auto-generate relevant South African image
                  </Label>
                </div>
              </div>

              {!useAutoImage && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("image")?.click()}
                      className="gap-2"
                    >
                      <ImagePlusIcon className="h-4 w-4" />
                      {imageFile ? "Change Image" : "Upload Image"}
                    </Button>
                    <Input
                      id="image"
                      name="image"
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                    <span className="text-sm text-muted-foreground">
                      {imageFile
                        ? `Selected: ${imageFile.name} (${(imageFile.size / 1024).toFixed(1)} KB)`
                        : "No image selected"}
                    </span>
                  </div>

                  {imageError && <div className="text-sm text-destructive">{imageError}</div>}

                  {imagePreview && (
                    <div className="mt-4 border rounded-md overflow-hidden">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Event preview"
                        className="w-full h-auto max-h-[300px] object-cover"
                      />
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Accepted formats: JPEG, PNG, GIF, WEBP. Maximum size: 5MB.
                  </p>
                </div>
              )}

              {useAutoImage && (
                <p className="text-sm text-muted-foreground">
                  A relevant South African image will be automatically generated based on your event details.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input id="capacity" name="capacity" type="number" placeholder="Enter maximum attendees" min="1" />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoaderIcon className="mr-2 h-4 w-4" />
                  Creating Event...
                </>
              ) : (
                "Create Event"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

