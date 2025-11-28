"use client"

import { useState, useEffect } from "react"
import { Calendar, dateFnsLocalizer, Views, View } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { enUS } from "date-fns/locale"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { BookingDetailModal } from "./booking-detail-modal"
import { CalendarSkeleton } from "@/components/ui/skeletons"

const locales = {
  "en-US": enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface Booking {
  id: string
  title: string
  start: Date
  end: Date
  resource: any
}

export default function CalendarView() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [view, setView] = useState<View>(Views.WEEK)
  const [date, setDate] = useState(new Date())
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchBookings = async (start: Date, end: Date) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString(),
        futureOnly: "true", // Only show future bookings in calendar
      })
      const response = await fetch(`/api/bookings?${params}`)
      if (response.ok) {
        const data = await response.json()
        const formattedBookings = data.map((b: any) => ({
          id: b.id,
          title: `${b.customer.name} - ${b.service.name}`,
          start: new Date(b.startTime),
          end: new Date(b.endTime),
          resource: b,
        }))
        setBookings(formattedBookings)
      }
    } catch (error) {
      toast.error("Failed to load bookings")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch for current view
    const start = new Date(date)
    start.setDate(start.getDate() - 7) // Buffer
    const end = new Date(date)
    end.setDate(end.getDate() + 7) // Buffer
    fetchBookings(start, end)
  }, [date, view])

  const handleRangeChange = (range: any) => {
    let start, end
    if (Array.isArray(range)) {
      start = range[0]
      end = range[range.length - 1]
    } else {
      start = range.start
      end = range.end
    }
    fetchBookings(start, end)
  }

  if (isLoading && bookings.length === 0) {
    return <CalendarSkeleton />
  }

  return (
    <div className="h-[calc(100vh-200px)] min-h-[600px]">
      <Calendar
        localizer={localizer}
        events={bookings}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        onRangeChange={handleRangeChange}
        eventPropGetter={(event) => ({
          style: {
            backgroundColor: event.resource.service.color || "#6366f1",
          },
        })}
        onSelectEvent={(event) => {
          setSelectedBooking(event.resource)
          setModalOpen(true)
        }}
      />
      
      <BookingDetailModal
        booking={selectedBooking}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onBookingUpdated={() => {
          // Refresh bookings after cancellation
          const start = new Date(date)
          start.setDate(start.getDate() - 7)
          const end = new Date(date)
          end.setDate(end.getDate() + 7)
          fetchBookings(start, end)
        }}
      />
    </div>
  )
}
