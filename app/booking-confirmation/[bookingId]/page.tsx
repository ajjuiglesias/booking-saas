"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BookingQRCode } from "@/components/bookings/booking-qr-code"
import { Confetti } from "@/components/ui/confetti"
import { 
  CheckCircle2, Calendar, Clock, User, DollarSign, 
  Users, Printer, Home, Loader2, Download 
} from "lucide-react"
import { toast } from "sonner"

interface Booking {
  id: string
  startTime: string
  endTime: string
  status: string
  attendees: number
  paymentAmount: number | null
  paymentStatus: string
  paymentMethod: string | null
  service: {
    name: string
    durationMinutes: number
    price: number
  }
  customer: {
    name: string
    email: string | null
    phone: string
  }
  business: {
    name: string
    email: string
    phone: string | null
  }
}

export default function BookingConfirmationPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.bookingId as string

  const [booking, setBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    fetchBooking()
    // Hide confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000)
    return () => clearTimeout(timer)
  }, [bookingId])

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`)
      if (response.ok) {
        const data = await response.json()
        setBooking(data)
      } else {
        toast.error("Failed to load booking details")
        router.push("/")
      }
    } catch (error) {
      toast.error("Failed to load booking details")
      router.push("/")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleAddToCalendar = () => {
    if (!booking) return

    const startDate = new Date(booking.startTime)
    const endDate = new Date(booking.endTime)
    
    const event = {
      title: `${booking.service.name} - ${booking.business.name}`,
      start: startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
      end: endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
      description: `Booking for ${booking.service.name}`,
      location: booking.business.name,
    }

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${event.start}
DTEND:${event.end}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location}
END:VEVENT
END:VCALENDAR`

    const blob = new Blob([icsContent], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'booking.ics'
    link.click()
    URL.revokeObjectURL(url)
    
    toast.success("Calendar event downloaded")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!booking) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-950/20 dark:to-background py-12 px-4">
      {showConfetti && <Confetti />}
      
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-4 no-print">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-green-600 dark:text-green-400">
              Booking Confirmed!
            </h1>
            <p className="text-muted-foreground mt-2">
              Your booking has been successfully confirmed
            </p>
          </div>
        </div>

        {/* QR Code Card */}
        <Card className="no-print">
          <CardContent className="pt-6 flex justify-center">
            <BookingQRCode bookingId={booking.id} />
          </CardContent>
        </Card>

        {/* Booking Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Booking Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Reference Number */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Reference Number</span>
              <Badge variant="outline" className="font-mono">
                #{booking.id.slice(-8).toUpperCase()}
              </Badge>
            </div>

            <Separator />

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

            {/* Duration */}
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground">Duration</span>
              <span className="font-medium">{booking.service.durationMinutes} minutes</span>
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

            {/* Customer Info */}
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

            <Separator />

            {/* Amount */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Amount
              </span>
              <span className="text-2xl font-bold">
                ${Number(booking.paymentAmount || booking.service.price).toFixed(2)}
              </span>
            </div>

            {/* Payment Status */}
            {booking.paymentMethod && (
              <>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Payment Method</span>
                  <span className="font-medium">
                    {booking.paymentMethod === 'online' ? '💳 Online Payment' : '💵 Cash Payment'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Payment Status</span>
                  <Badge variant={booking.paymentStatus === 'paid' ? 'default' : 'outline'}>
                    {booking.paymentStatus.toUpperCase()}
                  </Badge>
                </div>
              </>
            )}

            <Separator />

            {/* Status */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Booking Status</span>
              <Badge variant="default" className="bg-green-600">
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Check-In Instructions */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 no-print">
          <CardContent className="pt-6 space-y-3">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">📱 Check-In Instructions</h3>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
              <p>1. <strong>Scan the QR code above</strong> when you arrive at the venue</p>
              <p>2. Click <strong>"Check In Now"</strong> on the check-in page</p>
              <p>3. Your booking will be automatically confirmed</p>
              {booking.paymentMethod === 'cash' && booking.paymentStatus === 'pending' && (
                <p className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded">
                  💰 <strong>Cash Payment:</strong> Will be marked as paid when you check in
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Business Info */}
        <Card className="print-only hidden">
          <CardHeader>
            <CardTitle>{booking.business.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>Email: {booking.business.email}</div>
            {booking.business.phone && <div>Phone: {booking.business.phone}</div>}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 no-print">
          <Button onClick={handleAddToCalendar} variant="outline" className="flex-1 gap-2">
            <Download className="w-4 h-4" />
            Add to Calendar
          </Button>
          <Button onClick={handlePrint} variant="outline" className="flex-1 gap-2">
            <Printer className="w-4 h-4" />
            Print Receipt
          </Button>
          <Button onClick={() => router.push("/")} className="flex-1 gap-2">
            <Home className="w-4 h-4" />
            Return Home
          </Button>
        </div>

        {/* Print Instructions */}
        <div className="text-center text-sm text-muted-foreground no-print">
          <p>Please save this confirmation for your records.</p>
          <p className="mt-1">Show the QR code at check-in or provide your reference number.</p>
        </div>
      </div>
    </div>
  )
}
