"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MinusIcon, PlusIcon, TicketIcon } from "lucide-react"
import { CURRENCY_SYMBOL } from "@/lib/constants"

export type TicketType = {
  id: string
  name: string
  price: number
  description?: string
  available: number
  maxPerOrder?: number
}

export type SelectedTicket = {
  id: string
  name: string
  price: number
  quantity: number
}

type TicketSelectorProps = {
  eventId: string
  tickets: TicketType[]
  onProceedToCheckout: (selectedTickets: SelectedTicket[]) => void
  className?: string
}

export function TicketSelector({ eventId, tickets, onProceedToCheckout, className }: TicketSelectorProps) {
  const [selectedTickets, setSelectedTickets] = useState<SelectedTicket[]>(
    tickets.map((ticket) => ({
      id: ticket.id,
      name: ticket.name,
      price: ticket.price,
      quantity: 0,
    })),
  )

  const handleQuantityChange = (ticketId: string, increment: number) => {
    setSelectedTickets((prev) =>
      prev.map((ticket) => {
        if (ticket.id === ticketId) {
          const currentTicket = tickets.find((t) => t.id === ticketId)
          const maxPerOrder = currentTicket?.maxPerOrder || 10
          const available = currentTicket?.available || 0
          const newQuantity = Math.max(0, Math.min(ticket.quantity + increment, maxPerOrder, available))
          return { ...ticket, quantity: newQuantity }
        }
        return ticket
      }),
    )
  }

  const totalAmount = selectedTickets.reduce((sum, ticket) => sum + ticket.price * ticket.quantity, 0)
  const totalTickets = selectedTickets.reduce((sum, ticket) => sum + ticket.quantity, 0)
  const hasSelectedTickets = totalTickets > 0

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TicketIcon className="h-5 w-5 text-brightpurple" />
          Tickets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="border-b pb-4 last:border-0">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-medium">{ticket.name}</h3>
                <p className="text-sm text-muted-foreground">{ticket.description}</p>
                <p className="text-sm mt-1">
                  {ticket.available} available • Max {ticket.maxPerOrder || 10} per order
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  {CURRENCY_SYMBOL} {ticket.price.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full"
                onClick={() => handleQuantityChange(ticket.id, -1)}
                disabled={selectedTickets.find((t) => t.id === ticket.id)?.quantity === 0}
              >
                <MinusIcon className="h-3 w-3" />
                <span className="sr-only">Decrease</span>
              </Button>
              <span className="w-8 text-center">{selectedTickets.find((t) => t.id === ticket.id)?.quantity || 0}</span>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full"
                onClick={() => handleQuantityChange(ticket.id, 1)}
                disabled={
                  (selectedTickets.find((t) => t.id === ticket.id)?.quantity || 0) >=
                    Math.min(ticket.available, ticket.maxPerOrder || 10) || ticket.available === 0
                }
              >
                <PlusIcon className="h-3 w-3" />
                <span className="sr-only">Increase</span>
              </Button>
            </div>
          </div>
        ))}

        {tickets.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No tickets available for this event</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-4">
        <div className="w-full flex justify-between items-center">
          <div className="text-sm">
            Total: <span className="font-semibold">{totalTickets} tickets</span>
          </div>
          <div className="text-lg font-bold">
            {CURRENCY_SYMBOL} {totalAmount.toFixed(2)}
          </div>
        </div>
        <Button
          className="w-full bg-brightpurple hover:bg-brightpurple/90"
          disabled={!hasSelectedTickets}
          onClick={() => {
            try {
              if (hasSelectedTickets) {
                console.log("Selected tickets:", selectedTickets)
                const ticketsToCheckout = selectedTickets.filter((ticket) => ticket.quantity > 0)
                console.log("Filtered tickets for checkout:", ticketsToCheckout)
                onProceedToCheckout(ticketsToCheckout)
              }
            } catch (error) {
              console.error("Error in proceed to checkout:", error)
            }
          }}
        >
          {hasSelectedTickets ? "Proceed to Checkout" : "Select Tickets"}
        </Button>
      </CardFooter>
    </Card>
  )
}

