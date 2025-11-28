"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { format } from "date-fns"
import { Calendar, Clock, User, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface BookingData {
  id: string
  startTime: string
  endTime: string
  status: string
  customer: {
    name: string
    email: string | null
    phone: string
  }
  service: {
    name: string
    color: string | null
  }
  business: {
    name: string
    email: string
    phone: string | null
    address: string | null
  }
}

interface PolicyCheck {
  canCancel: boolean
  reason?: string
  hoursUntilBooking: number
  policy: string
  policyDescription: string
  requiredHours: number
}

export default function CancelBookingPage() {
  const params = useParams()
  const bookingId = params.bookingId as string

  const [booking, setBooking] = useState<BookingData | null>(null)
  const [policyCheck, setPolicyCheck] = useState<PolicyCheck | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reason, setReason] = useState("")

  useEffect(() => {
    fetchBookingData()
  }, [bookingId])

  const fetchBookingData = async () => {
    try {
      // Fetch booking details
      const bookingRes = await fetch(`/api/bookings/${bookingId}`)
      if (!bookingRes.ok) {
        throw new Error("Booking not found")
      }
      const bookingData = await bookingRes.json()
      setBooking(bookingData)

      // Check cancellation policy
      const policyRes = await fetch(`/api/bookings/${bookingId}/check-cancellation`)
      if (policyRes.ok) {
        const policyData = await policyRes.json()
        setPolicyCheck(policyData)
      }
    } catch (err) {
      setError("Failed to load booking details")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!policyCheck?.canCancel) return

    setIsCancelling(true)
    setError(null)

    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cancelledBy: "customer",
          reason: reason || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to cancel booking")
      }

      setCancelled(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsCancelling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    )
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (cancelled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Booking Cancelled
            </CardTitle>
            <CardDescription>
              Your booking has been successfully cancelled
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              A confirmation email has been sent to {booking?.customer.email || booking?.customer.phone}.
            </p>
            <p className="text-sm text-gray-500">
              If you have any questions, please contact {booking?.business.name}.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!booking) return null

  const alreadyCancelled = booking.status === "cancelled"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Cancel Booking</h1>
          <p className="mt-2 text-gray-600">{booking.business.name}</p>
        </div>

        {/* Already Cancelled Alert */}
        {alreadyCancelled && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Already Cancelled</AlertTitle>
            <AlertDescription>
              This booking has already been cancelled.
            </AlertDescription>
          </Alert>
        )}

        {/* Booking Details */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div
                className="w-3 h-3 rounded-full mt-1"
                style={{ backgroundColor: booking.service.color || "#6366f1" }}
              />
              <div className="flex-1">
                <p className="font-medium">{booking.service.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(booking.startTime), "EEEE, MMMM d, yyyy")}</span>
            </div>

            <div className="flex items-center gap-3 text-gray-600">
              <Clock className="h-4 w-4" />
              <span>
                {format(new Date(booking.startTime), "h:mm a")} -{" "}
                {format(new Date(booking.endTime), "h:mm a")}
              </span>
            </div>

            <div className="flex items-center gap-3 text-gray-600">
              <User className="h-4 w-4" />
              <span>{booking.customer.name}</span>
            </div>
          </CardContent>
        </Card>

        {/* Cancellation Policy */}
        {policyCheck && !alreadyCancelled && (
          <Alert variant={policyCheck.canCancel ? "default" : "destructive"}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Cancellation Policy</AlertTitle>
            <AlertDescription>
              {policyCheck.policyDescription}
              {!policyCheck.canCancel && policyCheck.reason && (
                <p className="mt-2 font-medium">{policyCheck.reason}</p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Cancellation Form */}
        {!alreadyCancelled && policyCheck?.canCancel && (
          <Card>
            <CardHeader>
              <CardTitle>Confirm Cancellation</CardTitle>
              <CardDescription>
                Please provide a reason for cancellation (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for cancellation</Label>
                <Textarea
                  id="reason"
                  placeholder="e.g., Schedule conflict, Found another provider..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="flex-1"
                >
                  {isCancelling ? "Cancelling..." : "Cancel Booking"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.history.back()}
                  disabled={isCancelling}
                >
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
