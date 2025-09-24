"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Download, Calendar, LoaderIcon, TicketIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/lib/context/auth-context"
import { getUserOrders } from "@/lib/payment-service"
import { generateTicketPDF } from "@/lib/ticket-service"
import { CURRENCY_SYMBOL } from "@/lib/constants"

export default function TicketsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.uid) return

      try {
        setLoading(true)
        const userOrders = await getUserOrders(user.uid)
        setOrders(userOrders)
      } catch (error) {
        console.error("Error fetching orders:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user?.uid])

  // Filter orders by upcoming and past events
  const now = new Date()
  const upcomingOrders = orders.filter((order) => new Date(order.event.date) >= now)
  const pastOrders = orders.filter((order) => new Date(order.event.date) < now)

  const handleDownloadTickets = async (order: any) => {
    try {
      await generateTicketPDF(order)
    } catch (error) {
      console.error("Error downloading tickets:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading your tickets...</span>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Tickets</h1>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="past">Past Events</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-6">
          {upcomingOrders.length > 0 ? (
            upcomingOrders.map((order) => (
              <TicketCard key={order.reference} order={order} onDownload={() => handleDownloadTickets(order)} />
            ))
          ) : (
            <EmptyTicketsState
              message="You don't have any upcoming event tickets"
              description="Browse events and purchase tickets to see them here"
            />
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-6">
          {pastOrders.length > 0 ? (
            pastOrders.map((order) => (
              <TicketCard key={order.reference} order={order} onDownload={() => handleDownloadTickets(order)} isPast />
            ))
          ) : (
            <EmptyTicketsState message="No past event tickets" description="Your past event tickets will appear here" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TicketCard({
  order,
  onDownload,
  isPast = false,
}: {
  order: any
  onDownload: () => void
  isPast?: boolean
}) {
  const totalTickets = order.tickets.reduce((sum: number, ticket: any) => sum + ticket.quantity, 0)

  return (
    <Card className={isPast ? "opacity-75" : ""}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{order.event.title}</CardTitle>
            <CardDescription>
              {new Date(order.event.date).toLocaleDateString()}
              {order.event.time && ` • ${order.event.time}`}
            </CardDescription>
          </div>
          {isPast && <div className="bg-muted px-3 py-1 rounded-full text-xs font-medium">Past Event</div>}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative h-32 w-full md:w-48 overflow-hidden rounded-md">
            <Image
              src={order.event.image || "/placeholder.svg"}
              alt={order.event.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1">
            <div className="space-y-1 mb-3">
              <p className="text-sm text-muted-foreground">{order.event.location}</p>
              <p className="text-sm">
                <span className="font-medium">Order Reference:</span> {order.reference}
              </p>
              <p className="text-sm">
                <span className="font-medium">Purchase Date:</span> {new Date(order.paymentDate).toLocaleDateString()}
              </p>
            </div>

            <Separator className="my-3" />

            <div className="space-y-1">
              <p className="text-sm font-medium">Tickets:</p>
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
              <div className="flex justify-between text-sm font-medium pt-1">
                <span>Total:</span>
                <span>
                  {CURRENCY_SYMBOL} {order.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button className="gap-2" onClick={onDownload}>
          <Download className="h-4 w-4" />
          Download {totalTickets > 1 ? "Tickets" : "Ticket"}
        </Button>

        {!isPast && (
          <Link href={`/user/events/${order.eventId}`}>
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              View Event
            </Button>
          </Link>
        )}

        <Link href={`/user/confirmation?reference=${order.reference}`}>
          <Button variant="outline" className="gap-2">
            Order Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

function EmptyTicketsState({ message, description }: { message: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="bg-muted rounded-full p-4 mb-4">
        <TicketIcon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-1">{message}</h3>
      <p className="text-muted-foreground mb-6">{description}</p>
      <Link href="/user/events">
        <Button>Browse Events</Button>
      </Link>
    </div>
  )
}

