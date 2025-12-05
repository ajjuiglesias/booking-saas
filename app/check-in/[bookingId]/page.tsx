"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, XCircle, Calendar, Clock, User, Users, Loader2, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface Booking {
  id: string
  startTime: string
  endTime: string
  status: string
  attendees: number
  checkedInAt: string | null
  paymentMethod: string | null
  paymentStatus: string
  service: {
    name: string
    durationMinutes: number
  }
  customer: {
    name: string
    email: string | null
    phone: string
  }
  business: {
    name: string
  }
}

export default function CheckInPage() {
  const params = useParams()
  const bookingId = params.bookingId as string

  const [booking, setBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [checkInSuccess, setCheckInSuccess] = useState(false)

  useEffect(() => {
    fetchBooking()
  }, [bookingId])

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`)
      if (response.ok) {
        const data = await response.json()
        setBooking(data)
        setCheckInSuccess(!!data.checkedInAt)
      } else {
        toast.error("Booking not found")
      }
    } catch (error) {
      toast.error("Failed to load booking")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckIn = async () => {
    setIsCheckingIn(true)
    try {
      const response = await fetch(`/api/bookings/${bookingId}/check-in`, {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setCheckInSuccess(true)
        setBooking(data.booking)
        
        let message = "✅ Checked in successfully!"
        if (data.isEarly) {
          message += " (Early arrival - welcome!)"
        } else if (data.isLate) {
          message += " (Late arrival)"
        }
        if (data.paymentMarkedPaid) {
          message += " Cash payment marked as paid."
        }
        
        toast.success(message)
      } else {
        toast.error(data.error || "Check-in failed")
      }
    } catch (error) {
      toast.error("Failed to check in")
    } finally {
      setIsCheckingIn(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">
                Booking Not Found
              </h2>
              <p className="text-muted-foreground mt-2">
                The booking ID is invalid or the booking has been cancelled.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canCheckIn = booking.status === "confirmed" && !booking.checkedInAt

  // Calculate timing
  const now = new Date()
  const startTime = new Date(booking.startTime)
  const gracePeriodEnd = new Date(startTime.getTime() + 30 * 60 * 1000) // 30 min after
  const earlyCheckInStart = new Date(startTime.getTime() - 60 * 60 * 1000) // 1 hour before

  const isTooEarly = now < earlyCheckInStart // More than 1 hour early - BLOCKED
  const isWithinWindow = now >= earlyCheckInStart && now <= gracePeriodEnd // Within check-in window
  const isTooLate = now > gracePeriodEnd // More than 30 min late - BLOCKED

  // Check-in is only available within the 1-hour-before to 30-min-after window
  const checkInAvailable = canCheckIn && isWithinWindow

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Check-In Status */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
              checkInSuccess
                ? "bg-green-100 dark:bg-green-900/30"
                : isTooLate
                ? "bg-red-100 dark:bg-red-900/30"
                : isTooEarly
                ? "bg-orange-100 dark:bg-orange-900/30"
                : checkInAvailable
                ? "bg-blue-100 dark:bg-blue-900/30"
                : "bg-orange-100 dark:bg-orange-900/30"
            }`}>
              {checkInSuccess ? (
                <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
              ) : isTooLate ? (
                <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
              ) : isTooEarly ? (
                <XCircle className="w-12 h-12 text-orange-600 dark:text-orange-400" />
              ) : checkInAvailable ? (
                <CheckCircle className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              ) : (
                <XCircle className="w-12 h-12 text-orange-600 dark:text-orange-400" />
              )}
            </div>
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${
              checkInSuccess
                ? "text-green-600 dark:text-green-400"
                : isTooLate
                ? "text-red-600 dark:text-red-400"
                : isTooEarly
                ? "text-orange-600 dark:text-orange-400"
                : checkInAvailable
                ? "text-blue-600 dark:text-blue-400"
                : "text-orange-600 dark:text-orange-400"
            }`}>
              {checkInSuccess
                ? "Checked In!"
                : isTooLate
                ? "Session Ended"
                : isTooEarly
                ? "Too Early"
                : checkInAvailable
                ? "Ready to Check In"
                : booking.status === "checked_in"
                ? "Already Checked In"
                : booking.status === "cancelled"
                ? "Booking Cancelled"
                : "Cannot Check In"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {checkInSuccess
                ? `Checked in at ${format(new Date(booking.checkedInAt!), "h:mm a")}`
                : isTooLate
                ? "Check-in window has closed (more than 30 minutes past booking time)"
                : isTooEarly
                ? `Check-in opens 1 hour before your booking at ${format(earlyCheckInStart, "h:mm a")}`
                : checkInAvailable
                ? `Booking time: ${format(startTime, "h:mm a")}`
                : booking.status === "checked_in"
                ? `Checked in at ${format(new Date(booking.checkedInAt!), "h:mm a")}`
                : booking.status === "cancelled"
                ? "This booking has been cancelled"
                : "This booking is not available for check-in"}
            </p>
          </div>
        </div>

        {/* Check-In Button - Only show if within window */}
        {checkInAvailable && !checkInSuccess && (
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleCheckIn}
              disabled={isCheckingIn}
              className="text-lg px-8 py-6"
            >
              {isCheckingIn ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Checking In...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Check In Now
                </>
              )}
            </Button>
          </div>
        )}

        {/* Too Early Message */}
        {isTooEarly && !checkInSuccess && (
          <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
            <CardContent className="pt-6">
              <p className="text-sm text-center text-orange-800 dark:text-orange-200 font-medium">
                ⏰ You can only check in within 1 hour of your booking time.
              </p>
              <p className="text-sm text-center text-orange-700 dark:text-orange-300 mt-2">
                Check-in opens at {format(earlyCheckInStart, "h:mm a")}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Session Ended Message */}
        {isTooLate && !checkInSuccess && (
          <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
            <CardContent className="pt-6">
              <p className="text-sm text-center text-red-800 dark:text-red-200">
                ⏰ The check-in window for this booking has closed. Please contact the business if you need assistance.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Booking Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Booking Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Reference */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Reference</span>
              <Badge variant="outline" className="font-mono">
                #{booking.id.slice(-8).toUpperCase()}
              </Badge>
            </div>

            <Separator />

            {/* Business */}
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground">Business</span>
              <span className="font-medium text-right">{booking.business.name}</span>
            </div>

            {/* Service */}
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground">Service</span>
              <span className="font-medium text-right">{booking.service.name}</span>
            </div>

            {/* Date */}
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date
              </span>
              <span className="font-medium">
                {format(new Date(booking.startTime), "EEEE, MMMM d, yyyy")}
              </span>
            </div>

            {/* Time */}
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Time
              </span>
              <span className="font-medium">
                {format(new Date(booking.startTime), "h:mm a")} - {format(new Date(booking.endTime), "h:mm a")}
              </span>
            </div>

            {/* Attendees */}
            {booking.attendees > 1 && (
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Attendees
                </span>
                <span className="font-medium">{booking.attendees} people</span>
              </div>
            )}

            <Separator />

            {/* Customer */}
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer
              </span>
              <div className="text-right">
                <div className="font-medium">{booking.customer.name}</div>
                {booking.customer.email && (
                  <div className="text-sm text-muted-foreground">{booking.customer.email}</div>
                )}
                <div className="text-sm text-muted-foreground">{booking.customer.phone}</div>
              </div>
            </div>

            {/* Status */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={booking.status === "confirmed" || booking.status === "checked_in" ? "default" : "secondary"}>
                {booking.status === "checked_in" ? "Checked In" : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Badge>
            </div>

            {/* Payment */}
            {booking.paymentMethod && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Payment</span>
                <div className="flex items-center gap-2">
                  <Badge variant={booking.paymentStatus === "paid" ? "default" : "outline"}>
                    {booking.paymentStatus.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {booking.paymentMethod === "online" ? "💳 Online" : "💵 Cash"}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Success Message */}
        {checkInSuccess && (
          <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
            <CardContent className="pt-6">
              <p className="text-sm text-center text-green-800 dark:text-green-200">
                ✓ Check-in complete! Please proceed to the service area.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
