"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Facebook, Twitter, Linkedin, Mail, Share2 } from "lucide-react"
import type { Event } from "@/lib/data"

interface SocialShareProps {
  event: Event
  size?: "default" | "sm" | "lg"
}

export function SocialShare({ event, size = "default" }: SocialShareProps) {
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [copied, setCopied] = useState(false)
  const baseUrl = typeof window !== "undefined" ? `${window.location.protocol}//${window.location.host}/user` : ""

  const generateSocialShareLinks = () => {
    const eventUrl = `${baseUrl}/events/${event.id}`
    const encodedEventUrl = encodeURIComponent(eventUrl)
    const text = encodeURIComponent(event.title)

    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedEventUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedEventUrl}&text=${text}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedEventUrl}`,
      email: `mailto:?subject=${event.title}&body=Check out this event: ${eventUrl}`,
    }
  }

  const shareLinks = generateSocialShareLinks()

  const copyToClipboard = () => {
    const eventUrl = `${baseUrl}/events/${event.id}`
    navigator.clipboard.writeText(eventUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
      <DialogTrigger asChild>
        <Button variant="outline" size={size} className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share This Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="mb-4">
            <h3 className="font-medium">{event.title}</h3>
            <p className="text-sm text-muted-foreground">
              {new Date(event.date).toLocaleDateString()}
              {event.time && ` • ${event.time}`}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={shareLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2"
            >
              <div className="rounded-full bg-[#1DA1F2] p-3">
                <Twitter className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm">Twitter</span>
            </a>

            <a
              href={shareLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2"
            >
              <div className="rounded-full bg-[#1877F2] p-3">
                <Facebook className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm">Facebook</span>
            </a>

            <a
              href={shareLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2"
            >
              <div className="rounded-full bg-[#0A66C2] p-3">
                <Linkedin className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm">LinkedIn</span>
            </a>

            <a
              href={shareLinks.email}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2"
            >
              <div className="rounded-full bg-gray-600 p-3">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm">Email</span>
            </a>
          </div>

          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium mb-2">Event Link</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={`${baseUrl}/events/${event.id}`}
                readOnly
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              />
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

