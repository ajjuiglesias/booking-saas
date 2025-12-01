"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, XCircle, Calendar, Clock, User, Users, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Booking {
  id: string
  startTime: string
  endTime: string
  status: string
  attendees: number
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
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    verifyBooking()
  }, [bookingId])

  const verifyBooking = async () => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`)
      if (response.ok) {
        const data = await response.json()
        setBooking(data)
        
        // Check if booking is valid for check-in
        const isValidStatus = data.status === "confirmed"
        const bookingDate = new Date(data.startTime)
        const now = new Date()
        const isToday = bookingDate.toDateString() === now.toDateString()
        
        setIsValid(isValidStatus && isToday)
      } else {
        toast.error("Booking not found")
      }
    } catch (error) {
      toast.error("Failed to verify booking")
    } finally {
      setIsLoading(false)
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Verification Status */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              isValid 
                ? "bg-green-100 dark:bg-green-900/30" 
                : "bg-orange-100 dark:bg-orange-900/30"
            }`}>
              {isValid ? (
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="w-10 h-10 text-orange-600 dark:text-orange-400" />
              )}
            </div>
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${
              isValid 
                ? "text-green-600 dark:text-green-400" 
                : "text-orange-600 dark:text-orange-400"
            }`}>
              {isValid ? "Valid Booking" : "Cannot Check In"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isValid 
                ? "This booking is confirmed and ready for check-in" 
                : booking.status === "cancelled"
                ? "This booking has been cancelled"
                : booking.status === "completed"
                ? "This booking has already been completed"
                : "This booking is not scheduled for today"
              }
            </p>
          </div>
        </div>

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
              <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        {isValid && (
          <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
            <CardContent className="pt-6">
              <p className="text-sm text-center text-green-800 dark:text-green-200">
                ✓ Customer verified. Please proceed with the service.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
