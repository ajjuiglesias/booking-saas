"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { format, addDays, startOfDay } from "date-fns"
import { Calendar, Clock, User, AlertCircle, CheckCircle, XCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

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
    durationMinutes: number
  }
  business: {
    name: string
    email: string
    phone: string | null
    address: string | null
  }
}

interface TimeSlot {
  time: string
  datetime: string
  status: string
}

export default function RescheduleBookingPage() {
  const params = useParams()
  const bookingId = params.bookingId as string

  const [booking, setBooking] = useState<BookingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [rescheduled, setRescheduled] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)

  useEffect(() => {
    fetchBookingData()
  }, [bookingId])

  useEffect(() => {
    if (selectedDate && booking) {
      fetchTimeSlots()
    }
  }, [selectedDate, booking])

  const fetchBookingData = async () => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`)
      if (!response.ok) {
        throw new Error("Booking not found")
      }
      const data = await response.json()
      setBooking(data)
    } catch (err) {
      setError("Failed to load booking details")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTimeSlots = async () => {
    if (!selectedDate || !booking) return

    setLoadingSlots(true)
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd")
      const response = await fetch(
        `/api/timeslots?businessId=${(booking as any).businessId}&serviceId=${(booking as any).serviceId}&date=${dateStr}`
      )

      if (response.ok) {
        const data = await response.json()
        // API returns array directly, not { slots: [] }
        setTimeSlots(Array.isArray(data) ? data : [])
      } else {
        console.error("Failed to fetch time slots:", response.status)
        setTimeSlots([])
      }
    } catch (err) {
      console.error("Failed to load time slots", err)
      setTimeSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleReschedule = async () => {
    if (!selectedTime || !booking) return

    setIsRescheduling(true)
    setError(null)

    try {
      const newStartTime = new Date(selectedTime)
      const newEndTime = new Date(newStartTime.getTime() + booking.service.durationMinutes * 60000)

      const response = await fetch(`/api/bookings/${bookingId}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newStartTime: newStartTime.toISOString(),
          newEndTime: newEndTime.toISOString(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to reschedule booking")
      }

      setRescheduled(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsRescheduling(false)
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

  if (rescheduled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Booking Rescheduled
            </CardTitle>
            <CardDescription>
              Your booking has been successfully rescheduled
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              A confirmation email has been sent to {booking?.customer.email || booking?.customer.phone}.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700">New Appointment</p>
              <p className="text-lg font-semibold mt-1">
                {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
              </p>
              <p className="text-gray-600">
                {selectedTime && format(new Date(selectedTime), "h:mm a")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!booking) return null

  const alreadyCancelled = booking.status === "cancelled"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Reschedule Booking</h1>
          <p className="mt-2 text-gray-600">{booking.business.name}</p>
        </div>

        {/* Already Cancelled Alert */}
        {alreadyCancelled && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Cannot Reschedule</AlertTitle>
            <AlertDescription>
              This booking has been cancelled and cannot be rescheduled.
            </AlertDescription>
          </Alert>
        )}

        {!alreadyCancelled && (
          <>
            {/* Current Booking */}
            <Card>
              <CardHeader>
                <CardTitle>Current Booking</CardTitle>
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
              </CardContent>
            </Card>

            {/* New Date/Time Selection */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Calendar */}
              <Card>
                <CardHeader>
                  <CardTitle>Select New Date</CardTitle>
                  <CardDescription>Choose a new date for your appointment</CardDescription>
                </CardHeader>
                <CardContent>
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < startOfDay(new Date())}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>

              {/* Time Slots */}
              <Card>
                <CardHeader>
                  <CardTitle>Select New Time</CardTitle>
                  <CardDescription>
                    {selectedDate
                      ? `Available times for ${format(selectedDate, "MMM d")}`
                      : "Select a date first"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingSlots ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    </div>
                  ) : timeSlots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                      {timeSlots
                        .filter((slot) => slot.status === "available")
                        .map((slot) => (
                          <Button
                            key={slot.datetime}
                            variant={selectedTime === slot.datetime ? "default" : "outline"}
                            onClick={() => setSelectedTime(slot.datetime)}
                            className="w-full"
                          >
                            {slot.time}
                          </Button>
                        ))}
                    </div>
                  ) : selectedDate ? (
                    <p className="text-center text-gray-500 py-8">
                      No available time slots for this date
                    </p>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      Select a date to see available times
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Confirm Button */}
            {selectedDate && selectedTime && (
              <Card>
                <CardHeader>
                  <CardTitle>Confirm Reschedule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">From</p>
                      <p className="font-medium">
                        {format(new Date(booking.startTime), "MMM d, h:mm a")}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">To</p>
                      <p className="font-medium">
                        {format(selectedDate, "MMM d")},{" "}
                        {format(new Date(selectedTime), "h:mm a")}
                      </p>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={handleReschedule}
                      disabled={isRescheduling}
                      className="flex-1"
                    >
                      {isRescheduling ? "Rescheduling..." : "Confirm Reschedule"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.history.back()}
                      disabled={isRescheduling}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
