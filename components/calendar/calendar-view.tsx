"use client"

import { useState, useEffect } from "react"
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar"
import format from "date-fns/format"
import parse from "date-fns/parse"
import startOfWeek from "date-fns/startOfWeek"
import getDay from "date-fns/getDay"
import enUS from "date-fns/locale/en-US"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

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
  const [view, setView] = useState(Views.WEEK)
  const [date, setDate] = useState(new Date())

  const fetchBookings = async (start: Date, end: Date) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString(),
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
          // Open booking details modal
          console.log("Selected booking:", event)
          toast.info(`Booking: ${event.title}`)
        }}
      />
    </div>
  )
}
