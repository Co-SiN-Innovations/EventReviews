// lib/localStorage.ts

// Initialize empty events array
let events: any[] = []

// Helper function to load events from localStorage on the client side
export const initializeEvents = () => {
  if (typeof window !== "undefined") {
    const storedEvents = localStorage.getItem("events")
    if (storedEvents) {
      try {
        events = JSON.parse(storedEvents)
      } catch (error) {
        console.error("Error parsing events from localStorage:", error)
        // If there's an error parsing, initialize with empty array
        events = []
      }
    }
  }
  return events
}

// Helper function to save events to localStorage
export const saveEvents = (updatedEvents: any[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("events", JSON.stringify(updatedEvents))
  }
  events = updatedEvents
}

