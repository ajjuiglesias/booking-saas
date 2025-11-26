import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateTimeSlots, TimeSlot } from "@/lib/datetime"
import { addMinutes, parseISO, format } from "date-fns"

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get("businessId")
    const serviceId = searchParams.get("serviceId")
    const dateStr = searchParams.get("date")
    const timezone = searchParams.get("timezone") || "America/New_York"

    if (!businessId || !serviceId || !dateStr) {
        return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    try {
        const date = parseISO(dateStr)
        const dayOfWeek = date.getDay()

        // Fetch required data in parallel
        const [business, service, availability, bookings, blockedDates] = await Promise.all([
            prisma.business.findUnique({
                where: { id: businessId },
                select: { bufferMinutes: true, minNoticeHours: true, timezone: true }
            }),
            prisma.service.findUnique({
                where: { id: serviceId },
                select: { durationMinutes: true }
            }),
            prisma.availability.findFirst({
                where: {
                    businessId,
                    dayOfWeek,
                    isAvailable: true
                }
            }),
            prisma.booking.findMany({
                where: {
                    businessId,
                    startTime: {
                        gte: new Date(date.setHours(0, 0, 0, 0)),
                        lt: new Date(date.setHours(23, 59, 59, 999))
                    },
                    status: { not: "cancelled" }
                },
                select: { startTime: true, endTime: true }
            }),
            prisma.blockedDate.findMany({
                where: {
                    businessId,
                    date: {
                        equals: new Date(dateStr)
                    }
                }
            })
        ])

        if (!business || !service) {
            return NextResponse.json({ error: "Business or service not found" }, { status: 404 })
        }

        // Check if date is blocked
        const isBlocked = blockedDates.some(bd => bd.allDay)
        if (isBlocked || !availability) {
            return NextResponse.json([])
        }

        // Generate slots
        const slots = generateTimeSlots({
            date,
            startTime: availability.startTime,
            endTime: availability.endTime,
            durationMinutes: service.durationMinutes,
            bufferMinutes: business.bufferMinutes,
            existingBookings: bookings,
            timezone: business.timezone, // Use business timezone for generation
            minNoticeHours: business.minNoticeHours
        })

        return NextResponse.json(slots)
    } catch (error) {
        console.error("Time slot generation error:", error)
        return NextResponse.json({ error: "Failed to generate time slots" }, { status: 500 })
    }
}
