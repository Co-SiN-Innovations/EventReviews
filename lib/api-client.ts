// Helper function for making API requests
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  try {
    // Create a new AbortController for each request
    const controller = new AbortController()
    const signal = controller.signal

    // Set a timeout to abort the request after 30 seconds
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 30000)

    // Merge the signal with the options
    const requestOptions = {
      ...options,
      signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    }

    const response = await fetch(`/api/${endpoint}`, requestOptions)

    // Clear the timeout
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `API request failed with status ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Request timed out")
      }
      throw error
    }
    throw new Error("Unknown error occurred")
  }
}

// GET request helper
export async function apiGet(endpoint: string, params: Record<string, string> = {}) {
  const queryString = new URLSearchParams(params).toString()
  const url = queryString ? `${endpoint}?${queryString}` : endpoint

  return apiRequest(url, { method: "GET" })
}

// POST request helper
export async function apiPost(endpoint: string, data: any) {
  return apiRequest(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// PUT request helper
export async function apiPut(endpoint: string, data: any) {
  return apiRequest(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

// DELETE request helper
export async function apiDelete(endpoint: string) {
  return apiRequest(endpoint, { method: "DELETE" })
}

// Specific API functions
export async function getEvents(type = "all", limit?: number) {
  const params = new URLSearchParams()
  params.append("type", type)
  if (limit) params.append("limit", limit.toString())

  return apiGet(`events`, Object.fromEntries(params))
}

export async function getEvent(id: string) {
  return apiGet(`events`, { id })
}

export async function createEvent(eventData: any) {
  return apiPost("events", {
    action: "create",
    eventData,
  })
}

export async function updateEvent(eventId: string, eventData: any) {
  return apiPost("events", {
    action: "update",
    eventId,
    eventData,
  })
}

export async function deleteEvent(eventId: string) {
  return apiPost("events", {
    action: "delete",
    eventId,
  })
}

export async function toggleFavoriteEvent(eventId: string, userId: string, isFavorite: boolean) {
  return apiPost("events", {
    action: "toggle-favorite",
    eventId,
    userId,
    isFavorite,
  })
}

// Reviews API
export async function getReviews(eventId?: string, userId?: string) {
  const params = new URLSearchParams()
  if (eventId) params.append("eventId", eventId)
  if (userId) params.append("userId", userId)

  return apiGet(`reviews`, Object.fromEntries(params))
}

export async function createReview(reviewData: any) {
  return apiPost("reviews", {
    action: "create",
    reviewData,
  })
}

export async function replyToReview(reviewId: string, reply: string) {
  return apiPost("reviews", {
    action: "reply",
    reviewId,
    reply,
  })
}

// Notifications API
export async function getNotifications(userId: string, unreadOnly = false) {
  const params = new URLSearchParams()
  params.append("userId", userId)
  if (unreadOnly) params.append("unreadOnly", "true")

  return apiGet(`notifications`, Object.fromEntries(params))
}

export async function markNotificationAsRead(notificationId: string) {
  return apiPost("notifications", {
    action: "mark-read",
    notificationId,
  })
}

export async function markAllNotificationsAsRead(userId: string) {
  return apiPost("notifications", {
    action: "mark-all-read",
    userId,
  })
}

// User API
export async function getUserProfile(userId: string) {
  return apiGet(`users`, { userId })
}

export async function updateUserProfile(userId: string, profileData: any) {
  return apiPost("users", {
    action: "update-profile",
    userId,
    profileData,
  })
}

// User-Event API
export async function getUserEvents(userId: string, status?: string) {
  const params = new URLSearchParams()
  params.append("userId", userId)
  if (status) params.append("status", status)

  return apiGet(`user-events`, Object.fromEntries(params))
}

export async function updateUserEventStatus(userId: string, eventId: string, status: string) {
  return apiPost("user-events", {
    action: "update-status",
    userId,
    eventId,
    status,
  })
}

export async function checkInToEvent(userId: string, eventId: string) {
  return apiPost("user-events", {
    action: "check-in",
    userId,
    eventId,
  })
}

