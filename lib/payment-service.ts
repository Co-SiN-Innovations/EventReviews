import { v4 as uuidv4 } from "uuid"
import { createNotification } from "@/lib/firebase/notifications"
import { updateEvent } from "@/lib/firebase/events"
import { setEventAttendance } from "@/lib/firebase/user-events"

// Types
export type PaymentMethod = "card" | "eft" | "mobile"
export type DeliveryMethod = "email" | "download" | "both"

export type BillingDetails = {
  name: string
  email: string
  phone: string
  address?: string
  city?: string
  postalCode?: string
}

export type PaymentRequest = {
  amount: number
  currency: string
  paymentMethod: PaymentMethod
  eventId: string
  eventTitle: string
  tickets: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>
  billingDetails: BillingDetails
  userId: string
  deliveryMethod?: DeliveryMethod
}

export type PaymentResult = {
  success: boolean
  reference?: string
  error?: string
}

export type OrderDetails = {
  reference: string
  eventId: string
  event: any
  userId: string
  tickets: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>
  subtotal: number
  serviceFee: number
  total: number
  paymentMethod: PaymentMethod
  paymentDate: string
  billingDetails: BillingDetails
  status: "pending" | "completed" | "failed"
  deliveryMethod: DeliveryMethod
  deliveryStatus?: {
    email?: "sent" | "failed" | "pending"
    download?: "available" | "unavailable"
  }
}

// In-memory storage for orders (would be replaced with a database in production)
const orders: Record<string, OrderDetails> = {}

/**
 * Process a payment for event tickets
 */
export async function processPayment(request: PaymentRequest): Promise<PaymentResult> {
  try {
    // In a real implementation, this would integrate with PayFast, Ozow, or Yoco
    // For this demo, we'll simulate a successful payment

    // Generate a unique reference number
    const reference = `ORD-${Date.now()}-${uuidv4().substring(0, 8)}`

    // Calculate totals
    const subtotal = request.tickets.reduce((sum, ticket) => sum + ticket.price * ticket.quantity, 0)
    const serviceFee = subtotal * 0.05 // 5% service fee
    const total = subtotal + serviceFee

    // Validate amount
    if (Math.abs(total - request.amount) > 0.01) {
      return {
        success: false,
        error: "Amount mismatch",
      }
    }

    // Fetch event details
    const { getEventById } = await import("@/lib/firebase/events")
    const event = await getEventById(request.eventId)

    if (!event) {
      return {
        success: false,
        error: "Event not found",
      }
    }

    // Create order record
    const order: OrderDetails = {
      reference,
      eventId: request.eventId,
      event,
      userId: request.userId,
      tickets: request.tickets,
      subtotal,
      serviceFee,
      total,
      paymentMethod: request.paymentMethod,
      paymentDate: new Date().toISOString(),
      billingDetails: request.billingDetails,
      status: "completed",
      deliveryMethod: request.deliveryMethod || "both",
      deliveryStatus: {
        email: request.deliveryMethod === "download" ? undefined : "pending",
        download: request.deliveryMethod === "email" ? undefined : "available",
      },
    }

    // Store order
    orders[reference] = order

    // Also store in localStorage for persistence in this demo
    if (typeof window !== "undefined") {
      const savedOrders = localStorage.getItem("orders")
      const ordersData = savedOrders ? JSON.parse(savedOrders) : {}
      ordersData[reference] = order
      localStorage.setItem("orders", JSON.stringify(ordersData))
    }

    // Update event attendees count
    const totalTickets = request.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0)
    await updateEvent(request.eventId, {
      attendees: (event.attendees || 0) + totalTickets,
    })

    // Set user as attending the event
    if (request.userId !== "guest") {
      await setEventAttendance(request.userId, request.eventId, "attending")
    }

    // Send notification
    if (request.userId !== "guest") {
      await createNotification({
        userId: request.userId,
        title: "Ticket Purchase Confirmed",
        message: `Your tickets for ${event.title} have been confirmed. Reference: ${reference}`,
        type: "event",
        eventId: request.eventId,
        actionUrl: `/user/confirmation?reference=${reference}`,
      })
    }

    // Handle ticket delivery based on selected method
    try {
      // Send email if requested
      if (request.deliveryMethod === "email" || request.deliveryMethod === "both") {
        const { sendTicketByEmail } = await import("@/lib/email-service")
        await sendTicketByEmail({
          order,
          recipientEmail: request.billingDetails.email,
          recipientName: request.billingDetails.name,
        })

        // Update delivery status
        order.deliveryStatus = {
          ...order.deliveryStatus,
          email: "sent",
        }

        // Update in storage
        orders[reference] = order
        if (typeof window !== "undefined") {
          const savedOrders = localStorage.getItem("orders")
          if (savedOrders) {
            const ordersData = JSON.parse(savedOrders)
            ordersData[reference] = order
            localStorage.setItem("orders", JSON.stringify(ordersData))
          }
        }
      }
    } catch (error) {
      console.error("Error delivering tickets:", error)
      // We don't fail the transaction if delivery fails, just log it
    }

    return {
      success: true,
      reference,
    }
  } catch (error) {
    console.error("Payment processing error:", error)
    return {
      success: false,
      error: "Payment processing failed",
    }
  }
}

/**
 * Get order details by reference number
 */
export async function getOrderDetails(reference: string): Promise<OrderDetails | null> {
  // First check in-memory storage
  if (orders[reference]) {
    return orders[reference]
  }

  // Then check localStorage
  if (typeof window !== "undefined") {
    const savedOrders = localStorage.getItem("orders")
    if (savedOrders) {
      const ordersData = JSON.parse(savedOrders)
      if (ordersData[reference]) {
        // Also add to in-memory cache
        orders[reference] = ordersData[reference]
        return ordersData[reference]
      }
    }
  }

  // In a real implementation, this would fetch from a database
  return null
}

/**
 * Get orders for a specific user
 */
export async function getUserOrders(userId: string): Promise<OrderDetails[]> {
  const userOrders: OrderDetails[] = []

  // Check localStorage
  if (typeof window !== "undefined") {
    const savedOrders = localStorage.getItem("orders")
    if (savedOrders) {
      const ordersData = JSON.parse(savedOrders)
      for (const reference in ordersData) {
        if (ordersData[reference].userId === userId) {
          userOrders.push(ordersData[reference])
        }
      }
    }
  }

  // Sort by date (newest first)
  return userOrders.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
}

