import { jsPDF } from "jspdf"
import QRCode from "qrcode"
import type { OrderDetails } from "@/lib/payment-service"

/**
 * Generate a PDF ticket for an order
 */
export async function generateTicketPDF(order: OrderDetails): Promise<void> {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    // Set up fonts
    doc.setFont("helvetica", "bold")

    // Add event title
    doc.setFontSize(20)
    doc.text(order.event.title, 105, 20, { align: "center" })

    // Add event details
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    const eventDate = new Date(order.event.date).toLocaleDateString()
    const eventTime = order.event.time || "Time TBD"
    doc.text(`Date: ${eventDate} • Time: ${eventTime}`, 105, 30, { align: "center" })
    doc.text(`Location: ${order.event.location}`, 105, 37, { align: "center" })

    // Add order reference
    doc.setFontSize(10)
    doc.text(`Order Reference: ${order.reference}`, 105, 45, { align: "center" })

    // Add purchaser name
    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    doc.text(`Purchased by: ${order.billingDetails.name}`, 105, 52, { align: "center" })

    // Adjust the separator line position
    doc.setDrawColor(200, 200, 200)
    doc.line(20, 57, 190, 57)

    // Update the starting y-position for tickets
    let yPosition = 67

    // Add separator line
    doc.setDrawColor(200, 200, 200)
    doc.line(20, 50, 190, 50)

    // Generate QR code for each ticket
    // let yPosition = 60

    for (const ticket of order.tickets) {
      for (let i = 0; i < ticket.quantity; i++) {
        // Generate unique ticket ID
        const ticketId = `${order.reference}-${ticket.id}-${i + 1}`

        // Generate QR code
        try {
          const qrCodeDataUrl = await QRCode.toDataURL(ticketId, {
            errorCorrectionLevel: "H",
            margin: 1,
            width: 150,
          })

          // Add ticket type with more prominence
          doc.setFontSize(16)
          doc.setFont("helvetica", "bold")
          doc.text(`${ticket.name}`, 20, yPosition)
          doc.setDrawColor(230, 230, 230)
          doc.setFillColor(245, 245, 245)
          doc.roundedRect(140, yPosition - 15, 40, 10, 2, 2, "FD")
          doc.setFontSize(10)
          doc.setTextColor(50, 50, 50)
          doc.text(`${ticket.name}`, 160, yPosition - 8, { align: "center" })
          doc.setTextColor(0, 0, 0)

          // Add ticket price
          doc.setFontSize(12)
          doc.setFont("helvetica", "normal")
          doc.text(`Price: R ${ticket.price.toFixed(2)}`, 20, yPosition + 7)

          // Add ticket ID
          doc.setFontSize(10)
          doc.text(`Ticket ID: ${ticketId}`, 20, yPosition + 14)

          // Add QR code
          doc.addImage(qrCodeDataUrl, "PNG", 140, yPosition - 10, 40, 40)

          // Add separator line
          doc.setDrawColor(200, 200, 200)
          doc.line(20, yPosition + 35, 190, yPosition + 35)

          // Move to next ticket position
          yPosition += 45

          // Add new page if needed
          if (yPosition > 250) {
            doc.addPage()
            yPosition = 20
          }
        } catch (qrError) {
          console.error("Error generating QR code:", qrError)
          // Continue with the next ticket even if QR code fails
        }
      }
    }

    // Add footer with terms
    doc.setFontSize(8)
    doc.text("This ticket is valid only for the specified event and is non-transferable.", 105, 280, {
      align: "center",
    })
    doc.text("Please present this ticket (printed or digital) at the event entrance.", 105, 285, { align: "center" })

    // Save the PDF
    doc.save(`tickets-${order.reference}.pdf`)
  } catch (error) {
    console.error("Error generating ticket PDF:", error)
    throw new Error("Failed to generate tickets")
  }
}

/**
 * Validate a ticket for an event
 */
export async function validateTicket(ticketId: string): Promise<{
  valid: boolean
  message: string
  ticketDetails?: any
}> {
  try {
    // Parse ticket ID to get order reference, ticket type, and index
    const [orderRef, ticketTypeId, ticketIndex] = ticketId.split("-")

    if (!orderRef || !ticketTypeId || !ticketIndex) {
      return {
        valid: false,
        message: "Invalid ticket format",
      }
    }

    // Get order details
    const { getOrderDetails } = await import("@/lib/payment-service")
    const order = await getOrderDetails(orderRef)

    if (!order) {
      return {
        valid: false,
        message: "Order not found",
      }
    }

    // Find the ticket type
    const ticketType = order.tickets.find((t) => t.id === ticketTypeId)

    if (!ticketType) {
      return {
        valid: false,
        message: "Ticket type not found in order",
      }
    }

    // Check if ticket index is valid
    const ticketIndexNum = Number.parseInt(ticketIndex)
    if (isNaN(ticketIndexNum) || ticketIndexNum < 1 || ticketIndexNum > ticketType.quantity) {
      return {
        valid: false,
        message: "Invalid ticket index",
      }
    }

    // In a real implementation, we would check if the ticket has already been used
    // For this demo, we'll assume it's valid

    return {
      valid: true,
      message: "Ticket is valid",
      ticketDetails: {
        eventId: order.eventId,
        eventTitle: order.event.title,
        ticketType: ticketType.name,
        orderReference: orderRef,
      },
    }
  } catch (error) {
    console.error("Error validating ticket:", error)
    return {
      valid: false,
      message: "Error validating ticket",
    }
  }
}

