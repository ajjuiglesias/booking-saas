"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CreditCard, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"
import Script from "next/script"

declare global {
  interface Window {
    Razorpay: any
  }
}

interface Booking {
  id: string
  service: { name: string }
  customer: { name: string; email: string }
  startTime: string
  paymentAmount: number
  paymentStatus: string
  razorpayOrderId: string | null
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.bookingId as string

  const [booking, setBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [razorpayKeyId, setRazorpayKeyId] = useState<string>("")

  useEffect(() => {
    fetchBookingDetails()
  }, [bookingId])

  const fetchBookingDetails = async () => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`)
      if (response.ok) {
        const data = await response.json()
        setBooking(data)

        // Fetch payment settings to get Razorpay key
        const settingsResponse = await fetch(`/api/public/payment-settings/${data.businessId}`)
        if (settingsResponse.ok) {
          const settings = await settingsResponse.json()
          setRazorpayKeyId(settings.razorpayKeyId)
        }
      } else {
        toast.error("Booking not found")
      }
    } catch (error) {
      toast.error("Failed to load booking details")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!booking || !booking.razorpayOrderId) {
      toast.error("Payment order not found. Please contact support.")
      return
    }

    setIsProcessing(true)

    const options = {
      key: razorpayKeyId,
      amount: booking.paymentAmount * 100, // Convert to paise
      currency: "INR",
      name: "Booking Payment",
      description: `Payment for ${booking.service.name}`,
      order_id: booking.razorpayOrderId,
      prefill: {
        name: booking.customer.name,
        email: booking.customer.email,
      },
      handler: async function (response: any) {
        // Verify payment
        try {
          const verifyResponse = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: booking.id,
            }),
          })

          if (verifyResponse.ok) {
            toast.success("Payment successful!")
            router.push(`/booking-confirmation/${booking.id}`)
          } else {
            toast.error("Payment verification failed")
          }
        } catch (error) {
          toast.error("Payment verification failed")
        } finally {
          setIsProcessing(false)
        }
      },
      modal: {
        ondismiss: function () {
          setIsProcessing(false)
          toast.error("Payment cancelled")
        },
      },
    }

    const razorpay = new window.Razorpay(options)
    razorpay.open()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Booking Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The booking you're looking for doesn't exist or has been cancelled.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (booking.paymentStatus === "paid") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Payment Already Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              This booking has already been paid for.
            </p>
            <Button onClick={() => router.push(`/booking-confirmation/${booking.id}`)} className="w-full">
              View Booking Details
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Complete Your Payment
            </CardTitle>
            <CardDescription>
              Secure payment for your booking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Booking Details */}
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Service:</span>
                <span className="text-sm font-medium">{booking.service.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Date & Time:</span>
                <span className="text-sm font-medium">
                  {new Date(booking.startTime).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Customer:</span>
                <span className="text-sm font-medium">{booking.customer.name}</span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="font-medium">Total Amount:</span>
                <span className="text-lg font-bold text-primary">
                  ₹{booking.paymentAmount}
                </span>
              </div>
            </div>

            {/* Payment Button */}
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay ₹{booking.paymentAmount}
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Secure payment powered by Razorpay
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
