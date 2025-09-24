"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { CalendarIcon, Bell, BellOff, ChevronLeft, ChevronRight, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { generateGoogleCalendarUrl, generateICalendarFile, generateOutlookCalendarUrl } from "@/lib/calendar-utils"
import type { Event } from "@/lib/data"

interface EventCalendarProps {
  events: Event[]
  isAdmin?: boolean
  view?: "month" | "week" | "agenda"
}

export function EventCalendar({ events, isAdmin = false, view = "month" }: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([])
  const [reminders, setReminders] = useState<Record<string, boolean>>({})
  const [showRemindersDialog, setShowRemindersDialog] = useState(false)
  const [showAddToCalendarDialog, setShowAddToCalendarDialog] = useState(false)
  const [selectedEventForCalendar, setSelectedEventForCalendar] = useState<Event | null>(null)

  // Initialize reminders from localStorage on component mount
  useEffect(() => {
    const savedReminders = localStorage.getItem("eventReminders")
    if (savedReminders) {
      setReminders(JSON.parse(savedReminders))
    }
  }, [])

  // Save reminders to localStorage when they change
  useEffect(() => {
    localStorage.setItem("eventReminders", JSON.stringify(reminders))
  }, [reminders])

  // Check for reminders that need to be shown
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date()
      events.forEach((event) => {
        const eventDate = new Date(event.date)
        const eventId = event.id

        // If reminder is enabled and event is within 24 hours
        if (reminders[eventId] && eventDate > now && eventDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
          // Check if we've already shown this reminder in this session
          const reminderShown = sessionStorage.getItem(`reminder-${eventId}`)
          if (!reminderShown) {
            alert(
              `Reminder: "${event.title}" is happening soon on ${new Date(event.date).toLocaleDateString()} at ${event.time || "TBD"}`,
            )
            sessionStorage.setItem(`reminder-${eventId}`, "shown")
          }
        }
      })
    }

    // Check reminders on load
    checkReminders()

    // Set interval to check reminders every hour
    const interval = setInterval(checkReminders, 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [events, reminders])

  const handlePrevMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (view === "month") {
        newDate.setMonth(newDate.getMonth() - 1)
      } else if (view === "week") {
        newDate.setDate(newDate.getDate() - 7)
      }
      return newDate
    })
  }

  const handleNextMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (view === "month") {
        newDate.setMonth(newDate.getMonth() + 1)
      } else if (view === "week") {
        newDate.setDate(newDate.getDate() + 7)
      }
      return newDate
    })
  }

  // Update the handleDateClick function to properly handle date selection
  const handleDateClick = (date: Date) => {
    setSelectedDate(date)

    // Find events for the selected date - compare only the date part, not the time
    const eventsOnDate = events.filter((event) => {
      const eventDate = new Date(event.date)
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      )
    })

    setSelectedEvents(eventsOnDate)
  }

  const toggleReminder = (eventId: string) => {
    setReminders((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }))
  }

  const handleAddToCalendar = (event: Event, directToGoogle = false) => {
    if (directToGoogle) {
      // Open Google Calendar directly
      window.open(generateGoogleCalendarUrl(event), "_blank")
      return
    }

    // Otherwise show the dialog with all options
    setSelectedEventForCalendar(event)
    setShowAddToCalendarDialog(true)
  }

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const renderMonthCalendar = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const daysInMonth = getDaysInMonth(year, month)
    const firstDayOfMonth = getFirstDayOfMonth(year, month)

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-12 border border-transparent"></div>)
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateString = date.toISOString().split("T")[0]

      // Check if there are events on this day
      const eventsOnDay = events.filter((event) => {
        const eventDate = new Date(event.date)
        return eventDate.getDate() === day && eventDate.getMonth() === month && eventDate.getFullYear() === year
      })

      const hasEvents = eventsOnDay.length > 0
      const isToday = new Date().toDateString() === date.toDateString()
      const isSelected = selectedDate?.toDateString() === date.toDateString()

      days.push(
        <div
          key={day}
          className={cn(
            "h-12 border p-1 cursor-pointer transition-colors hover:bg-muted/50",
            isToday && "bg-blue-50 dark:bg-blue-950",
            isSelected && "bg-blue-100 dark:bg-blue-900",
            hasEvents && "font-semibold",
          )}
          onClick={() => handleDateClick(date)}
        >
          <div className="flex flex-col h-full">
            <span className={cn("text-sm", isToday && "text-blue-600 dark:text-blue-400")}>{day}</span>
            {hasEvents && (
              <div className="mt-auto flex justify-center">
                {eventsOnDay.length > 1 ? (
                  <Badge variant="secondary" className="h-1.5 w-auto px-1 py-0 text-[8px] rounded-sm">
                    {eventsOnDay.length}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="h-1.5 w-1.5 rounded-full p-0" />
                )}
              </div>
            )}
          </div>
        </div>,
      )
    }

    return days
  }

  const renderWeekCalendar = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()) // Start from Sunday

    const days = []

    // Create 7 days starting from the start of the week
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)

      const eventsOnDay = events.filter((event) => {
        const eventDate = new Date(event.date)
        return (
          eventDate.getDate() === date.getDate() &&
          eventDate.getMonth() === date.getMonth() &&
          eventDate.getFullYear() === date.getFullYear()
        )
      })

      const hasEvents = eventsOnDay.length > 0
      const isToday = new Date().toDateString() === date.toDateString()
      const isSelected = selectedDate?.toDateString() === date.toDateString()

      days.push(
        <div key={i} className="flex flex-col border-r last:border-r-0">
          <div className="text-center py-2 font-medium text-sm border-b">
            {date.toLocaleDateString("en-US", { weekday: "short" })}
            <div className={cn("text-xs", isToday && "text-blue-600 dark:text-blue-400 font-bold")}>
              {date.getDate()}
            </div>
          </div>
          <div
            className={cn(
              "flex-1 min-h-[120px] p-1 cursor-pointer",
              isToday && "bg-blue-50 dark:bg-blue-950",
              isSelected && "bg-blue-100 dark:bg-blue-900",
            )}
            onClick={() => handleDateClick(date)}
          >
            {eventsOnDay.map((event, idx) => (
              <div
                key={event.id}
                className="text-xs p-1 mb-1 rounded bg-blue-100 dark:bg-blue-900 truncate"
                title={event.title}
              >
                {event.time && <span className="text-[10px] opacity-70">{event.time}</span>} {event.title}
              </div>
            ))}
          </div>
        </div>,
      )
    }

    return days
  }

  // Update the renderAgendaView function to properly filter upcoming events
  const renderAgendaView = () => {
    // Sort events by date
    const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Filter events that are upcoming - compare only the date part, not the time
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const upcomingEvents = sortedEvents.filter((event) => {
      const eventDate = new Date(event.date)
      const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
      return eventDateOnly >= today
    })

    if (upcomingEvents.length === 0) {
      return (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">No upcoming events</p>
        </div>
      )
    }

    // Group events by month
    const eventsByMonth: Record<string, Event[]> = {}

    upcomingEvents.forEach((event) => {
      const date = new Date(event.date)
      const monthYear = date.toLocaleDateString("en-US", { month: "long", year: "numeric" })

      if (!eventsByMonth[monthYear]) {
        eventsByMonth[monthYear] = []
      }

      eventsByMonth[monthYear].push(event)
    })

    return (
      <div className="space-y-6">
        {Object.entries(eventsByMonth).map(([monthYear, monthEvents]) => (
          <div key={monthYear}>
            <h3 className="font-medium text-lg mb-2">{monthYear}</h3>
            <div className="space-y-2">
              {monthEvents.map((event) => (
                <div key={event.id} className="flex items-start p-3 border rounded-lg hover:bg-muted/50">
                  <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mr-4">
                    <CalendarIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{event.title}</h3>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleReminder(event.id)}
                          title={reminders[event.id] ? "Disable reminder" : "Enable reminder"}
                        >
                          {reminders[event.id] ? (
                            <Bell className="h-4 w-4 text-primary" />
                          ) : (
                            <BellOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleAddToCalendar(event, true)}
                          title="Add to Google Calendar"
                        >
                          <Image src="/google-calendar-icon.png" alt="Google Calendar" width={16} height={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleAddToCalendar(event)}
                          title="More calendar options"
                        >
                          <Download className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>
                        {new Date(event.date).toLocaleDateString()} {event.time || "No time specified"}
                      </p>
                      <p>{event.location}</p>
                    </div>
                    <p className="text-sm mt-2 line-clamp-2">{event.description}</p>
                    <div className="mt-2">
                      <Link href={`/user/events/${event.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Event Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {view === "month"
                  ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                  : view === "week"
                    ? `Week of ${new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth(),
                        currentDate.getDate() - currentDate.getDay(),
                      ).toLocaleDateString()}`
                    : `Upcoming Events`}
              </span>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {view === "month" && (
            <>
              {/* Calendar header - days of week */}
              <div className="grid grid-cols-7 gap-1 mb-1 text-center">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">{renderMonthCalendar()}</div>
            </>
          )}

          {view === "week" && (
            <div className="grid grid-cols-7 border rounded-lg overflow-hidden">{renderWeekCalendar()}</div>
          )}

          {view === "agenda" && renderAgendaView()}
        </CardContent>
      </Card>

      {/* Selected date events */}
      {selectedDate && view !== "agenda" && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Events on {selectedDate.toLocaleDateString()}</CardTitle>
              <Dialog open={showRemindersDialog} onOpenChange={setShowRemindersDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Bell className="h-4 w-4" />
                    Manage Reminders
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Event Reminders</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {selectedEvents.length > 0 ? (
                      selectedEvents.map((event) => (
                        <div key={event.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{event.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(event.date).toLocaleDateString()} {event.time && `• ${event.time}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`reminder-${event.id}`}
                              checked={!!reminders[event.id]}
                              onCheckedChange={() => toggleReminder(event.id)}
                            />
                            <Label htmlFor={`reminder-${event.id}`}>
                              {reminders[event.id] ? (
                                <Bell className="h-4 w-4 text-primary" />
                              ) : (
                                <BellOff className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Label>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground">No events on this date</p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {selectedEvents.length > 0 ? (
              <div className="space-y-4">
                {selectedEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-4 p-3 rounded-lg border">
                    <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CalendarIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{event.title}</h3>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleReminder(event.id)}
                            title={reminders[event.id] ? "Disable reminder" : "Enable reminder"}
                          >
                            {reminders[event.id] ? (
                              <Bell className="h-4 w-4 text-primary" />
                            ) : (
                              <BellOff className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleAddToCalendar(event, true)}
                            title="Add to Google Calendar"
                          >
                            <Image src="/google-calendar-icon.png" alt="Google Calendar" width={16} height={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleAddToCalendar(event)}
                            title="More calendar options"
                          >
                            <Download className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>{event.time || "No time specified"}</p>
                        <p>{event.location}</p>
                      </div>
                      <p className="text-sm mt-2 line-clamp-2">{event.description}</p>
                      <div className="mt-2">
                        <Link href={`/${isAdmin ? "admin" : "user"}/events/${event.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No events scheduled for this date</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add to Calendar Dialog */}
      <Dialog open={showAddToCalendarDialog} onOpenChange={setShowAddToCalendarDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Calendar</DialogTitle>
          </DialogHeader>
          {selectedEventForCalendar && (
            <div className="space-y-4 py-4">
              <div className="mb-4">
                <h3 className="font-medium">{selectedEventForCalendar.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedEventForCalendar.date).toLocaleDateString()}
                  {selectedEventForCalendar.time && ` • ${selectedEventForCalendar.time}`}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <a href={generateGoogleCalendarUrl(selectedEventForCalendar)} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Image src="/google-calendar-icon.png" alt="Google Calendar" width={20} height={20} />
                    Add to Google Calendar
                  </Button>
                </a>

                <a
                  href={generateOutlookCalendarUrl(selectedEventForCalendar)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Image src="/outlook-icon.png" alt="Outlook" width={20} height={20} />
                    Add to Outlook Calendar
                  </Button>
                </a>

                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => generateICalendarFile(selectedEventForCalendar)}
                >
                  <Image src="/ical-icon.png" alt="iCalendar" width={20} height={20} />
                  Download iCalendar File (.ics)
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

