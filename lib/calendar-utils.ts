import type { Event } from "@/lib/data"

/**
 * Generates a Google Calendar URL for the given event
 */
export function generateGoogleCalendarUrl(event: Event): string {
  const title = encodeURIComponent(event.title)
  const description = encodeURIComponent(event.description)
  const location = encodeURIComponent(event.location)

  // Parse the date and time
  const eventDate = new Date(event.date)

  // If time is provided, parse it
  const startDate = new Date(eventDate)
  const endDate = new Date(eventDate)

  if (event.time) {
    // Try to parse time in format like "14:00 - 17:00" or "14:00"
    const timeMatch = event.time.match(/(\d{1,2}):(\d{2})(?:\s*-\s*(\d{1,2}):(\d{2}))?/)

    if (timeMatch) {
      const startHour = Number.parseInt(timeMatch[1], 10)
      const startMinute = Number.parseInt(timeMatch[2], 10)

      startDate.setHours(startHour, startMinute, 0, 0)

      // If end time is provided
      if (timeMatch[3] && timeMatch[4]) {
        const endHour = Number.parseInt(timeMatch[3], 10)
        const endMinute = Number.parseInt(timeMatch[4], 10)

        endDate.setHours(endHour, endMinute, 0, 0)
      } else {
        // Default to 1 hour duration if no end time
        endDate.setHours(startHour + 1, startMinute, 0, 0)
      }
    } else {
      // If time format doesn't match, default to all-day event
      endDate.setDate(endDate.getDate() + 1)
    }
  } else {
    // If no time provided, make it an all-day event
    endDate.setDate(endDate.getDate() + 1)
  }

  // Format dates for Google Calendar
  const startDateStr = startDate.toISOString().replace(/-|:|\.\d+/g, "")
  const endDateStr = endDate.toISOString().replace(/-|:|\.\d+/g, "")

  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateStr}/${endDateStr}&details=${description}&location=${location}&sf=true&output=xml`
}

/**
 * Generates an Outlook Calendar URL for the given event
 */
export function generateOutlookCalendarUrl(event: Event): string {
  const title = encodeURIComponent(event.title)
  const description = encodeURIComponent(event.description)
  const location = encodeURIComponent(event.location)

  // Parse the date and time
  const eventDate = new Date(event.date)

  // If time is provided, parse it
  const startDate = eventDate
  const endDate = new Date(eventDate)

  if (event.time) {
    // Try to parse time in format like "14:00 - 17:00"
    const timeMatch = event.time.match(/(\d{1,2}):(\d{2})(?:\s*-\s*(\d{1,2}):(\d{2}))?/)

    if (timeMatch) {
      const startHour = Number.parseInt(timeMatch[1], 10)
      const startMinute = Number.parseInt(timeMatch[2], 10)

      startDate.setHours(startHour, startMinute, 0, 0)

      // If end time is provided
      if (timeMatch[3] && timeMatch[4]) {
        const endHour = Number.parseInt(timeMatch[3], 10)
        const endMinute = Number.parseInt(timeMatch[4], 10)

        endDate.setHours(endHour, endMinute, 0, 0)
      } else {
        // Default to 1 hour duration if no end time
        endDate.setHours(startHour + 1, startMinute, 0, 0)
      }
    } else {
      // If time format doesn't match, default to all-day event
      endDate.setDate(endDate.getDate() + 1)
    }
  } else {
    // If no time provided, make it an all-day event
    endDate.setDate(endDate.getDate() + 1)
  }

  // Format dates for Outlook
  const startDateStr = startDate.toISOString().replace(/-|:|\.\d+/g, "")
  const endDateStr = endDate.toISOString().replace(/-|:|\.\d+/g, "")

  return `https://outlook.office.com/calendar/0/deeplink/compose?subject=${title}&body=${description}&location=${location}&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}`
}

/**
 * Generates and downloads an iCalendar (.ics) file for the given event
 */
export function generateICalendarFile(event: Event): void {
  // Parse the date and time
  const eventDate = new Date(event.date)

  // If time is provided, parse it
  const startDate = eventDate
  const endDate = new Date(eventDate)

  if (event.time) {
    // Try to parse time in format like "14:00 - 17:00"
    const timeMatch = event.time.match(/(\d{1,2}):(\d{2})(?:\s*-\s*(\d{1,2}):(\d{2}))?/)

    if (timeMatch) {
      const startHour = Number.parseInt(timeMatch[1], 10)
      const startMinute = Number.parseInt(timeMatch[2], 10)

      startDate.setHours(startHour, startMinute, 0, 0)

      // If end time is provided
      if (timeMatch[3] && timeMatch[4]) {
        const endHour = Number.parseInt(timeMatch[3], 10)
        const endMinute = Number.parseInt(timeMatch[4], 10)

        endDate.setHours(endHour, endMinute, 0, 0)
      } else {
        // Default to 1 hour duration if no end time
        endDate.setHours(startHour + 1, startMinute, 0, 0)
      }
    } else {
      // If time format doesn't match, default to all-day event
      endDate.setDate(endDate.getDate() + 1)
    }
  } else {
    // If no time provided, make it an all-day event
    endDate.setDate(endDate.getDate() + 1)
  }

  // Format dates for iCalendar
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, "")
  }

  const now = new Date()
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EventHub//NONSGML v1.0//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@eventhub.com`,
    `DTSTAMP:${formatDate(now)}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, "\\n")}`,
    `LOCATION:${event.location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")

  // Create a blob and download it
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", `${event.title.replace(/\s+/g, "_")}.ics`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Add social media sharing functions
export function generateSocialShareLinks(event: Event, baseUrl: string): Record<string, string> {
  const eventUrl = `${baseUrl}/events/${event.id}`
  const title = encodeURIComponent(event.title)
  const description = encodeURIComponent(
    `Check out this event: ${event.title} on ${new Date(event.date).toLocaleDateString()}`,
  )
  const fullDescription = encodeURIComponent(
    `${event.title} - ${new Date(event.date).toLocaleDateString()} ${event.time || ""} at ${event.location}. ${event.description.substring(0, 100)}...`,
  )

  return {
    twitter: `https://twitter.com/intent/tweet?text=${description}&url=${encodeURIComponent(eventUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}&quote=${description}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}`,
    email: `mailto:?subject=${title}&body=${fullDescription}%0A%0ALearn more: ${encodeURIComponent(eventUrl)}`,
    whatsapp: `https://wa.me/?text=${description}%20${encodeURIComponent(eventUrl)}`,
  }
}

