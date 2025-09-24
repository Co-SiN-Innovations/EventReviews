"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { LoaderIcon, Landmark, Smartphone, AlertCircle, Mail, Download, ShieldCheck, Info } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getEventById } from "@/lib/firebase/events"
import { processPayment } from "@/lib/payment-service"
import { CURRENCY_SYMBOL } from "@/lib/constants"
import { useAuth } from "@/lib/context/auth-context"
import type { Event } from "@/lib/data"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user } = useAuth()

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [tickets, setTickets] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [deliveryMethod, setDeliveryMethod] = useState<"email" | "download" | "both">("both")
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const [billingDetails, setBillingDetails] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  })

  // Get event ID and ticket data from URL params
  useEffect(() => {
    const fetchData = async () => {
      let parsedTickets: any[] = []
      let eventId: string | null = null
      try {
        setLoading(true)
        setError(null)

        eventId = searchParams.get("eventId")
        const ticketsParam = searchParams.get("tickets")

        if (!eventId) {
          setError("Missing event information")
          setLoading(false)
          return
        }

        // Try to get tickets from URL parameter first

        if (ticketsParam) {
          try {
            parsedTickets = JSON.parse(decodeURIComponent(ticketsParam))
          } catch (e) {
            console.error("Error parsing tickets from URL:", e)

            // Fallback: Try to get tickets from localStorage
            const storedTickets = localStorage.getItem(`checkout-tickets-${eventId}`)
            if (storedTickets) {
              try {
                parsedTickets = JSON.parse(decodeURIComponent(storedTickets))
                console.log("Retrieved tickets from localStorage:", parsedTickets)
              } catch (storageError) {
                console.error("Error parsing tickets from localStorage:", storageError)
                setError("Invalid ticket information")
                setLoading(false)
                return
              }
            } else {
              setError("No ticket information found")
              setLoading(false)
              return
            }
          }
        } else {
          // No tickets in URL, try localStorage
          const storedTickets = localStorage.getItem(`checkout-tickets-${eventId}`)
          if (storedTickets) {
            try {
              parsedTickets = JSON.parse(decodeURIComponent(storedTickets))
              console.log("Retrieved tickets from localStorage:", parsedTickets)
            } catch (storageError) {
              console.error("Error parsing tickets from localStorage:", storageError)
              setError("Invalid ticket information")
              setLoading(false)
              return
            }
          } else {
            setError("No ticket information found")
            setLoading(false)
            return
          }
        }

        if (parsedTickets.length === 0) {
          setError("No tickets selected")
          setLoading(false)
          return
        }

        setTickets(parsedTickets)

        // Fetch event details
        const eventData = await getEventById(eventId)
        if (!eventData) {
          setError("Event not found")
          setLoading(false)
          return
        }

        setEvent(eventData)

        // Pre-fill user details if available
        if (user) {
          setBillingDetails((prev) => ({
            ...prev,
            name: user.displayName || "",
            email: user.email || "",
          }))
        }
      } catch (err: any) {
        console.error("Error loading checkout data:", err)
        setError("Failed to load checkout information")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    // Use a stable reference to searchParams.get values instead of the searchParams object itself
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("eventId"), searchParams.get("tickets"), user?.uid, user?.displayName, user?.email])

  // Calculate totals
  const subtotal = tickets.reduce((sum, ticket) => sum + ticket.price * ticket.quantity, 0)
  const serviceFee = subtotal * 0.05 // 5% service fee
  const total = subtotal + serviceFee

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setBillingDetails((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear validation error when user types
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    // Required fields
    if (!billingDetails.name.trim()) {
      errors.name = "Name is required"
    }

    if (!billingDetails.email.trim()) {
      errors.email = "Email is required"
    } else if (!/^\S+@\S+\.\S+$/.test(billingDetails.email)) {
      errors.email = "Please enter a valid email address"
    }

    if (!billingDetails.phone.trim()) {
      errors.phone = "Phone number is required"
    } else if (!/^[0-9+\s()-]{7,15}$/.test(billingDetails.phone)) {
      errors.phone = "Please enter a valid phone number"
    }

    // Payment method specific validations
    if (paymentMethod === "card") {
      const cardNumber = document.getElementById("cardNumber") as HTMLInputElement
      const expiryDate = document.getElementById("expiryDate") as HTMLInputElement
      const cvv = document.getElementById("cvv") as HTMLInputElement

      if (!cardNumber?.value) {
        errors.cardNumber = "Card number is required"
      }

      if (!expiryDate?.value) {
        errors.expiryDate = "Expiry date is required"
      }

      if (!cvv?.value) {
        errors.cvv = "CVV is required"
      }
    }

    // Terms and conditions
    if (!termsAccepted) {
      errors.terms = "You must accept the terms and conditions"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!event) return

    // Validate form
    if (!validateForm()) {
      toast({
        title: "Please check your information",
        description: "There are some issues with your form submission",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)

    try {
      // Process payment
      const paymentResult = await processPayment({
        amount: total,
        currency: "ZAR",
        paymentMethod,
        eventId: event.id,
        eventTitle: event.title,
        tickets,
        billingDetails,
        userId: user?.uid || "guest",
        deliveryMethod,
      })

      if (paymentResult.success) {
        // Show success toast
        toast({
          title: "Payment successful!",
          description: "Your ticket purchase has been confirmed",
          duration: 5000,
        })

        // Redirect to confirmation page
        router.push(`/user/confirmation?reference=${paymentResult.reference}`)
      } else {
        toast({
          title: "Payment failed",
          description: paymentResult.error || "Your payment could not be processed",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      console.error("Payment error:", err)
      toast({
        title: "Payment error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading checkout...</span>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="flex items-center text-destructive gap-2">
          <AlertCircle className="h-5 w-5" />
          <h1 className="text-xl font-bold">{error || "Checkout error"}</h1>
        </div>
        <p>We couldn't load the checkout information. Please try again.</p>
        <Button onClick={() => router.push("/user/events")}>Back to Events</Button>
      </div>
    )
  }

  return (
    <div className="container max-w-5xl py-6">
      <h1 className="text-2xl font-bold mb-6">Secure Checkout</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
                <CardDescription>Please enter your billing details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-1">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={billingDetails.name}
                      onChange={handleInputChange}
                      className={validationErrors.name ? "border-destructive" : ""}
                    />
                    {validationErrors.name && <p className="text-xs text-destructive">{validationErrors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-1">
                      Email Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={billingDetails.email}
                      onChange={handleInputChange}
                      className={validationErrors.email ? "border-destructive" : ""}
                    />
                    {validationErrors.email && <p className="text-xs text-destructive">{validationErrors.email}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={billingDetails.phone}
                    onChange={handleInputChange}
                    className={validationErrors.phone ? "border-destructive" : ""}
                  />
                  {validationErrors.phone && <p className="text-xs text-destructive">{validationErrors.phone}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" value={billingDetails.address} onChange={handleInputChange} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" value={billingDetails.city} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={billingDetails.postalCode}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Ticket Delivery</CardTitle>
                <CardDescription>Choose how you'd like to receive your tickets</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  defaultValue="both"
                  value={deliveryMethod}
                  onValueChange={(value) => setDeliveryMethod(value as "email" | "download" | "both")}
                  className="space-y-3"
                >
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="email" id="delivery-email" />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="delivery-email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Only
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive your tickets via email immediately after purchase
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="download" id="delivery-download" />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="delivery-download" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Download Only
                      </Label>
                      <p className="text-sm text-muted-foreground">Download your tickets immediately after purchase</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="both" id="delivery-both" />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="delivery-both" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <Download className="h-4 w-4" />
                        Email and Download
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive your tickets via email and download them immediately
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Select your preferred payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="card" onValueChange={setPaymentMethod}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="card">Card</TabsTrigger>
                    <TabsTrigger value="eft">EFT</TabsTrigger>
                    <TabsTrigger value="mobile">Mobile</TabsTrigger>
                  </TabsList>

                  <TabsContent value="card" className="space-y-4 pt-4">
                    <div className="flex flex-wrap gap-4 mb-4">
                      <div className="border rounded p-2 w-16 h-10 flex items-center justify-center">
                        <Image src="/visa-logo.png" alt="Visa" width={40} height={20} />
                      </div>
                      <div className="border rounded p-2 w-16 h-10 flex items-center justify-center">
                        <Image src="/mastercard-logo.png" alt="Mastercard" width={40} height={20} />
                      </div>
                      <div className="border rounded p-2 w-16 h-10 flex items-center justify-center">
                        <Image src="/amex-logo.png" alt="American Express" width={40} height={20} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cardNumber" className="flex items-center gap-1">
                        Card Number <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        className={validationErrors.cardNumber ? "border-destructive" : ""}
                      />
                      {validationErrors.cardNumber && (
                        <p className="text-xs text-destructive">{validationErrors.cardNumber}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiryDate" className="flex items-center gap-1">
                          Expiry Date <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="expiryDate"
                          placeholder="MM/YY"
                          className={validationErrors.expiryDate ? "border-destructive" : ""}
                        />
                        {validationErrors.expiryDate && (
                          <p className="text-xs text-destructive">{validationErrors.expiryDate}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv" className="flex items-center gap-1">
                          CVV <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          className={validationErrors.cvv ? "border-destructive" : ""}
                        />
                        {validationErrors.cvv && <p className="text-xs text-destructive">{validationErrors.cvv}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                      <span>Your card details are encrypted and secure</span>
                    </div>
                  </TabsContent>

                  <TabsContent value="eft" className="space-y-4 pt-4">
                    <div className="bg-muted p-4 rounded-md">
                      <div className="flex items-start gap-2">
                        <Landmark className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <h3 className="font-medium">EFT Payment Instructions</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            You'll receive bank details to complete your EFT payment after confirming your order. Your
                            tickets will be issued once payment is verified.
                          </p>
                        </div>
                      </div>
                    </div>

                    <RadioGroup defaultValue="instant" className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="instant" id="instant-eft" />
                        <Label htmlFor="instant-eft" className="flex items-center gap-2">
                          <Image src="/ozow-logo.png" alt="Ozow" width={60} height={30} />
                          <span>Instant EFT via Ozow</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="manual" id="manual-eft" />
                        <Label htmlFor="manual-eft">Manual EFT Transfer</Label>
                      </div>
                    </RadioGroup>
                  </TabsContent>

                  <TabsContent value="mobile" className="space-y-4 pt-4">
                    <RadioGroup defaultValue="snapscan" className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="snapscan" id="snapscan" />
                        <Label htmlFor="snapscan" className="flex items-center gap-2">
                          <Image src="/snapscan-logo.png" alt="SnapScan" width={80} height={30} />
                          <span>SnapScan</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="zapper" id="zapper" />
                        <Label htmlFor="zapper" className="flex items-center gap-2">
                          <Image src="/zapper-logo.png" alt="Zapper" width={60} height={30} />
                          <span>Zapper</span>
                        </Label>
                      </div>
                    </RadioGroup>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Smartphone className="h-4 w-4" />
                      <span>You'll receive a QR code to scan with your mobile app</span>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Alert variant="outline" className="border-amber-200 bg-amber-50">
                    <Info className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800">Secure Transaction</AlertTitle>
                    <AlertDescription className="text-amber-700">
                      Your payment information is encrypted and processed securely. We never store your full card
                      details.
                    </AlertDescription>
                  </Alert>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={termsAccepted}
                      onCheckedChange={(checked) => {
                        setTermsAccepted(checked as boolean)
                        if (checked && validationErrors.terms) {
                          setValidationErrors((prev) => {
                            const newErrors = { ...prev }
                            delete newErrors.terms
                            return newErrors
                          })
                        }
                      }}
                      className={validationErrors.terms ? "border-destructive" : ""}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="terms" className={`text-sm ${validationErrors.terms ? "text-destructive" : ""}`}>
                        I accept the Terms and Conditions and Privacy Policy
                      </Label>
                      {validationErrors.terms && <p className="text-xs text-destructive">{validationErrors.terms}</p>}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full bg-brightpurple hover:bg-brightpurple/90" disabled={processing}>
                  {processing ? (
                    <>
                      <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay ${CURRENCY_SYMBOL} ${total.toFixed(2)}`
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>

        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-md">
                  <Image src={event.image || "/placeholder.svg"} alt={event.title} fill className="object-cover" />
                </div>
                <div>
                  <h3 className="font-medium">{event.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.date).toLocaleDateString()}
                    {event.time && ` • ${event.time}`}
                  </p>
                  <p className="text-sm text-muted-foreground">{event.location}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-medium">Tickets</h3>
                {tickets.map((ticket, index) => (
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
                    {CURRENCY_SYMBOL} {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Service Fee</span>
                  <span>
                    {CURRENCY_SYMBOL} {serviceFee.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>
                    {CURRENCY_SYMBOL} {total.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

