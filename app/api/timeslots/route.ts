import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { addMinutes, format, parseISO, setHours, setMinutes } from "date-fns"

export async function GET(request: NextRequest) {
    console.log('🔵 TIMESLOTS API CALLED')
    try {
        const { searchParams } = new URL(request.url)
        const businessId = searchParams.get("businessId")
        const serviceId = searchParams.get("serviceId")
        const date = searchParams.get("date")

        console.log('📋 Params:', { businessId, serviceId, date })

        if (!businessId || !serviceId || !date) {
            console.log('❌ Missing parameters')
            return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
        }

        // Get service details
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            select: { durationMinutes: true }
        })

        if (!service) {
            return NextResponse.json({ error: "Service not found" }, { status: 404 })
        }

        // Get business settings
        const business = await prisma.business.findUnique({
            where: { id: businessId },
            select: { bufferMinutes: true, slotDuration: true }
        })

        // Parse the selected date - handle both "2025-12-01" and ISO datetime strings
        let selectedDate: Date
        if (date.includes('T')) {
            // ISO datetime string - just parse it
            selectedDate = new Date(date)
        } else {
            // Date-only string - append time to avoid timezone issues
            selectedDate = new Date(date + 'T00:00:00')
        }
        const dayOfWeek = selectedDate.getDay()

        // Get availability for this day
        const availability = await prisma.availability.findFirst({
            where: {
                businessId,
                dayOfWeek,
                isAvailable: true
            }
        })

        if (!availability) {
            console.log(`No availability found for businessId: ${businessId}, dayOfWeek: ${dayOfWeek}`)
            return NextResponse.json([])
        }

        // Get existing bookings for this date
        const startOfDay = new Date(selectedDate)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(selectedDate)
        endOfDay.setHours(23, 59, 59, 999)

        const existingBookings = await prisma.booking.findMany({
            where: {
                businessId,
                startTime: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                status: { in: ["confirmed", "pending"] }
            },
            select: {
                startTime: true,
                endTime: true
            }
        })

        // Generate time slots
        const slots = []
        const [startHour, startMinute] = availability.startTime.split(":").map(Number)
        const [endHour, endMinute] = availability.endTime.split(":").map(Number)

        let currentTime = setMinutes(setHours(selectedDate, startHour), startMinute)
        const endTime = setMinutes(setHours(selectedDate, endHour), endMinute)
        const now = new Date()

        console.log('=== TIMESLOTS DEBUG ===')
        console.log('Selected date:', selectedDate.toISOString())
        console.log('Start time:', currentTime.toISOString())
        console.log('End time:', endTime.toISOString())
        console.log('Now:', now.toISOString())
        console.log('Service duration:', service.durationMinutes)

        while (currentTime < endTime) {
            const slotEnd = addMinutes(currentTime, service.durationMinutes)

            // Check if slot end time is within business hours
            if (slotEnd > endTime) {
                console.log('Slot end exceeds business hours, breaking')
                break
            }

            // Check if slot is in the past
            const isPast = currentTime < now
            console.log(`Slot ${format(currentTime, "h:mm a")}: isPast=${isPast}`)

            // Check if slot conflicts with existing bookings
            const isBooked = existingBookings.some(booking => {
                const bookingStart = new Date(booking.startTime)
                const bookingEnd = new Date(booking.endTime)
                return (
                    (currentTime >= bookingStart && currentTime < bookingEnd) ||
                    (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
                    (currentTime <= bookingStart && slotEnd >= bookingEnd)
                )
            })

            // Determine slot status
            let status: 'available' | 'past' | 'booked' = 'available'
            if (isPast) {
                status = 'past'
            } else if (isBooked) {
                status = 'booked'
            }

            slots.push({
                time: format(currentTime, "h:mm a"),
                datetime: currentTime.toISOString(),
                available: status === 'available',
                status
            })

            // Move to next slot using business slot duration + buffer
            const slotDuration = business?.slotDuration || 30
            currentTime = addMinutes(currentTime, slotDuration + (business?.bufferMinutes || 0))
        }

        console.log('Total slots generated:', slots.length)
        console.log('Available slots:', slots.filter(s => s.available).length)
        console.log('======================')

        return NextResponse.json(slots)
    } catch (error) {
        console.error("Error generating time slots:", error)
        return NextResponse.json({ error: "Failed to generate time slots" }, { status: 500 })
    }
}
