// Service to fetch relevant images based on event details

// API key for Unsplash (in a real app, this would be an environment variable)
// This is a placeholder - you would need to register for your own API key
const UNSPLASH_ACCESS_KEY = "YOUR_UNSPLASH_API_KEY"
const PEXELS_API_KEY = "YOUR_PEXELS_API_KEY"

// Fallback to Pixabay which doesn't require authentication for some endpoints
const PIXABAY_API_KEY = "YOUR_PIXABAY_API_KEY"

import { DEFAULT_EVENT_IMAGE } from "./constants"

/**
 * Fetches a relevant image based on event details
 * @param title Event title
 * @param description Event description
 * @param location Event location
 * @returns URL of the fetched image or default image if fetch fails
 */
export async function fetchEventImage(title: string, description: string, location: string): Promise<string> {
  try {
    // Create a search query based on event details
    const searchTerms = [
      title,
      location.split(",")[0], // Use just the city name
      // Extract key terms from description (simplified approach)
      ...description
        .split(" ")
        .filter((word) => word.length > 5)
        .slice(0, 3),
    ].join(" ")

    // Add South Africa to make results more relevant
    const query = `${searchTerms} South Africa`

    // Try Pixabay first (as it has a free tier)
    const pixabayUrl = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=3`

    const response = await fetch(pixabayUrl)
    const data = await response.json()

    if (data.hits && data.hits.length > 0) {
      return data.hits[0].webformatURL
    }

    // If we have an Unsplash key and Pixabay failed, try Unsplash
    if (UNSPLASH_ACCESS_KEY !== "YOUR_UNSPLASH_API_KEY") {
      const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${UNSPLASH_ACCESS_KEY}&per_page=1`
      const unsplashResponse = await fetch(unsplashUrl)
      const unsplashData = await unsplashResponse.json()

      if (unsplashData.results && unsplashData.results.length > 0) {
        return unsplashData.results[0].urls.regular
      }
    }

    // If we have a Pexels key and both failed, try Pexels
    if (PEXELS_API_KEY !== "YOUR_PEXELS_API_KEY") {
      const pexelsUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`
      const pexelsResponse = await fetch(pexelsUrl, {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      })
      const pexelsData = await pexelsResponse.json()

      if (pexelsData.photos && pexelsData.photos.length > 0) {
        return pexelsData.photos[0].src.large
      }
    }

    // If all APIs fail or no keys are provided, return default image
    return DEFAULT_EVENT_IMAGE
  } catch (error) {
    console.error("Error fetching event image:", error)
    return DEFAULT_EVENT_IMAGE
  }
}

/**
 * For demo purposes, returns a South African themed image based on the query
 * This is a fallback function that doesn't require API keys
 */
export function getSouthAfricanImage(query: string): string {
  // Map of keywords to South African themed images
  const imageMap: Record<string, string> = {
    johannesburg:
      "https://images.unsplash.com/photo-1577948000111-9c970dfe3743?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    "cape town":
      "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    durban:
      "https://images.unsplash.com/photo-1588409242278-dc4f8f34a743?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    pretoria:
      "https://images.unsplash.com/photo-1552553302-9211bf7f7740?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    music:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    concert:
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    sport:
      "https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    rugby:
      "https://images.unsplash.com/photo-1511426420268-4cfdd3763b77?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    cricket:
      "https://images.unsplash.com/photo-1531415074968-036ba1b575da?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    food: "https://images.unsplash.com/photo-1583422409516-2895a77efded?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    wine: "https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    business:
      "https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    tech: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    education:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    art: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    community:
      "https://images.unsplash.com/photo-1511632765486-a01980e01a18?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    outdoor:
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    safari: "https://images.unsplash.com/photo-1547970810-dc1eac37d174?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    beach:
      "https://images.unsplash.com/photo-1520942702018-0862200e6873?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    mountain:
      "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
  }

  // Convert query to lowercase for matching
  const lowercaseQuery = query.toLowerCase()

  // Find the first matching keyword in the query
  for (const [keyword, imageUrl] of Object.entries(imageMap)) {
    if (lowercaseQuery.includes(keyword)) {
      return imageUrl
    }
  }

  // Default South African landscape if no matches
  return "https://images.unsplash.com/photo-1552553302-9211bf7f7740?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
}

