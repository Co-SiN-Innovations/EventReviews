"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, Download, Calendar, LoaderIcon, AlertCircle, Mail } from "lucide-react"
import { getOrderDetails } from "@/lib/payment-service"
import { generateTicketPDF } from "@/lib/ticket-service"
import { CURRENCY_SYMBOL } from "@/lib/constants"
import { toast } from "@/components/ui/use-toast"

export default function ConfirmationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<any>(null)
  const [processingDownload, setProcessingDownload] = useState(false)
  const [processingSend, setProcessingSend] = useState(false)

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!reference) {
        setError("Missing order reference")
        setLoading(false)
        return
      }

      try {
        const orderDetails = await getOrderDetails(reference)
        setOrder(orderDetails)
      } catch (err) {
        console.error("Error fetching order details:", err)
        setError("Could not load order details")
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [reference])

  const handleDownloadTickets = async () => {
    if (!order) return

    try {
      setProcessingDownload(true)

      // Generate and download PDF tickets
      await generateTicketPDF(order)

      toast({
        title: "Tickets downloaded",
        description: "Your tickets have been downloaded successfully",
        duration: 3000,
      })
    } catch (err) {
      console.error("Error downloading tickets:", err)
      toast({
        title: "Download failed",
        description: "There was an error downloading your tickets. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setProcessingDownload(false)
    }
  }

  const handleSendTickets = async () => {
    if (!order) return

    try {
      setProcessingSend(true)

      // Send tickets via email
      const { sendTicketByEmail } = await import("@/lib/email-service")
      await sendTicketByEmail({
        order,
        recipientEmail: order.billingDetails.email,
        recipientName: order.billingDetails.name,
      })

      toast({
        title: "Tickets sent",
        description: `Your tickets have been sent to ${order.billingDetails.email}`,
        duration: 3000,
      })
    } catch (err) {
      console.error("Error sending tickets:", err)
      toast({
        title: "Sending failed",
        description: "There was an error sending your tickets. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setProcessingSend(false)
    }
  }

  const handleAddToCalendar = () => {
    if (!order?.event) return

    // Generate calendar URL
    const event = order.event
    const startDate = new Date(event.date)
    const endDate = new Date(startDate)
    endDate.setHours(endDate.getHours() + 3) // Assume 3 hour event

    const title = encodeURIComponent(event.title)
    const details = encodeURIComponent(`Your tickets for ${event.title}. Reference: ${order.reference}`)
    const location = encodeURIComponent(event.location)

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate.toISOString().replace(/-|:|\.\d+/g, "")}/${endDate.toISOString().replace(/-|:|\.\d+/g, "")}&details=${details}&location=${location}`

    window.open(googleCalendarUrl, "_blank")
  }

  const handleShareOrder = () => {
    if (navigator.share) {
      navigator.share({
        title: `My tickets for ${order?.event?.title}`,
        text: `I've just purchased tickets for ${order?.event?.title}. Join me!`,
        url: window.location.href,
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading order details...</span>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="flex items-center text-destructive gap-2">
          <AlertCircle className="h-5 w-5" />
          <h1 className="text-xl font-bold">{error || "Order not found"}</h1>
        </div>
        <p>We couldn't find your order details. Please check your email for confirmation.</p>
        <Button onClick={() => router.push("/user/events")}>Back to Events</Button>
      </div>
    )
  }

  return (
    <div className="container max-w-3xl py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold">Payment Successful!</h1>
        <p className="text-muted-foreground">Your order has been confirmed and your tickets are ready.</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Order Confirmation</CardTitle>
          <CardDescription>Order Reference: {order.reference}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-md">
              <Image
                src={order.event.image || "/placeholder.svg"}
                alt={order.event.title}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h3 className="font-medium text-lg">{order.event.title}</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(order.event.date).toLocaleDateString()}
                {order.event.time && ` • ${order.event.time}`}
              </p>
              <p className="text-sm text-muted-foreground">{order.event.location}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="font-medium">Ticket Details</h3>
            {order.tickets.map((ticket: any, index: number) => (
              <div key={index} className="flex justify-between text-sm">
                <span>
                  {ticket.name} × {ticket.quantity}
                </span>
                <span>
                  {CURRENCY_SYMBOL} {(ticket.price * ticket.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>
                {CURRENCY_SYMBOL} {order.subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Service Fee</span>
              <span>
                {CURRENCY_SYMBOL} {order.serviceFee.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>
                {CURRENCY_SYMBOL} {order.total.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-md text-sm">
            <p className="font-medium mb-1">Payment Information</p>
            <p>
              Payment Method:{" "}
              {order.paymentMethod === "card"
                ? "Credit/Debit Card"
                : order.paymentMethod === "eft"
                  ? "Electronic Funds Transfer"
                  : "Mobile Payment"}
            </p>
            <p>Payment Date: {new Date(order.paymentDate).toLocaleString()}</p>
            <p>
              Payment Status: <span className="text-green-600 font-medium">Completed</span>
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 sm:flex-row">
          <Button className="w-full sm:w-auto gap-2" onClick={handleDownloadTickets} disabled={processingDownload}>
            {processingDownload ? (
              <>
                <LoaderIcon className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download Tickets
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="w-full sm:w-auto gap-2"
            onClick={handleSendTickets}
            disabled={processingSend}
          >
            {processingSend ? (
              <>
                <LoaderIcon className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Email Tickets
              </>
            )}
          </Button>

          <Button variant="outline" className="w-full sm:w-auto gap-2" onClick={handleAddToCalendar}>
            <Calendar className="h-4 w-4" />
            Add to Calendar
          </Button>
        </CardFooter>
      </Card>

      <div className="text-center space-y-4">
        <p>A confirmation email has been sent to {order.billingDetails.email}</p>
        <Button variant="outline" onClick={() => router.push("/user/events")}>
          Back to Events
        </Button>
      </div>
    </div>
  )
}

