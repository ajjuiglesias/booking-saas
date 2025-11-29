import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const businessId = searchParams.get("businessId")
        const date = searchParams.get("date")

        if (!businessId || !date) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
        }

        // Get business info
        const business = await prisma.business.findUnique({
            where: { id: businessId },
            select: {
                id: true,
                name: true,
                slug: true,
                maxAdvanceDays: true
            }
        })

        // Get availability for the day
        const selectedDate = new Date(date)
        const dayOfWeek = selectedDate.getUTCDay()

        const availability = await prisma.availability.findMany({
            where: {
                businessId,
                dayOfWeek,
                isAvailable: true
            }
        })

        // Get blocked dates for this business
        const blockedDates = await prisma.blockedDate.findMany({
            where: { businessId }
        })

        // Check if this specific date is blocked
        const checkDate = new Date(date)
        checkDate.setHours(0, 0, 0, 0)

        const isBlocked = blockedDates.some(bd => {
            const blocked = new Date(bd.date)
            blocked.setHours(0, 0, 0, 0)
            return blocked.getTime() === checkDate.getTime()
        })

        // Get ALL blocked dates
        const allBlockedDates = await prisma.blockedDate.findMany({})

        return NextResponse.json({
            business,
            date,
            dayOfWeek,
            dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
            availability: availability.length > 0 ? availability : "NO AVAILABILITY FOUND",
            blockedDatesForThisBusiness: blockedDates.map(bd => ({
                date: bd.date,
                businessId: bd.businessId
            })),
            isDateBlocked: isBlocked,
            allBlockedDatesCount: allBlockedDates.length,
            allBlockedDates: allBlockedDates.map(bd => ({
                date: bd.date,
                businessId: bd.businessId
            }))
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
