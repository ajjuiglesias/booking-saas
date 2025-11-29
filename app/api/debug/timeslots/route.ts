import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const businessId = searchParams.get("businessId")
        const serviceId = searchParams.get("serviceId")
        const date = searchParams.get("date")

        if (!businessId || !serviceId || !date) {
            return NextResponse.json({
                error: "Missing parameters",
                received: { businessId, serviceId, date }
            }, { status: 400 })
        }

        // Get service
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            select: { durationMinutes: true, name: true, businessId: true }
        })

        if (!service) {
            return NextResponse.json({ error: "Service not found" }, { status: 404 })
        }

        // Get business settings
        const business = await prisma.business.findUnique({
            where: { id: businessId },
            select: { bufferMinutes: true, slotDuration: true, name: true }
        })

        // Parse date and get day of week
        const selectedDate = new Date(date)
        const dayOfWeek = selectedDate.getUTCDay()

        // Get availability for this day
        const availability = await prisma.availability.findFirst({
            where: {
                businessId,
                dayOfWeek,
                isAvailable: true
            }
        })

        // Get existing bookings
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

        return NextResponse.json({
            debug: {
                businessId,
                businessName: business?.name,
                serviceId,
                serviceName: service.name,
                serviceBusinessId: service.businessId,
                date,
                parsedDate: selectedDate.toISOString(),
                dayOfWeek,
                dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
                availability: availability || "NOT FOUND",
                existingBookingsCount: existingBookings.length,
                businessSettings: business
            }
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
