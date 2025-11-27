import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format, startOfDay, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfWeek, startOfMonth } from "date-fns"

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const business = await prisma.business.findUnique({
            where: { email: session.user.email }
        })

        if (!business) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 })
        }

        const { searchParams } = new URL(request.url)
        const fromParam = searchParams.get("from")
        const toParam = searchParams.get("to")
        const groupBy = searchParams.get("groupBy") || "day"

        if (!fromParam || !toParam) {
            return NextResponse.json({ error: "Missing date range" }, { status: 400 })
        }

        const from = new Date(fromParam)
        const to = new Date(toParam)

        // Fetch all bookings in range
        const bookings = await prisma.booking.findMany({
            where: {
                businessId: business.id,
                startTime: { gte: from, lte: to }
            },
            select: {
                startTime: true,
                status: true
            }
        })

        // Group data by time period
        let intervals: Date[]
        let formatString: string

        if (groupBy === "week") {
            intervals = eachWeekOfInterval({ start: from, end: to })
            formatString = "MMM dd"
        } else if (groupBy === "month") {
            intervals = eachMonthOfInterval({ start: from, end: to })
            formatString = "MMM yyyy"
        } else {
            intervals = eachDayOfInterval({ start: from, end: to })
            formatString = "MMM dd"
        }

        // Aggregate bookings by period and status
        const data = intervals.map(date => {
            const periodStart = groupBy === "week" ? startOfWeek(date) : groupBy === "month" ? startOfMonth(date) : startOfDay(date)
            const periodEnd = groupBy === "week" ? startOfWeek(new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000)) :
                groupBy === "month" ? startOfMonth(new Date(date.getFullYear(), date.getMonth() + 1, 1)) :
                    new Date(date.getTime() + 24 * 60 * 60 * 1000)

            const periodBookings = bookings.filter(b => {
                const bookingDate = new Date(b.startTime)
                return bookingDate >= periodStart && bookingDate < periodEnd
            })

            const confirmed = periodBookings.filter(b => b.status === "confirmed").length
            const pending = periodBookings.filter(b => b.status === "pending").length
            const cancelled = periodBookings.filter(b => b.status === "cancelled").length

            return {
                date: format(date, formatString),
                confirmed,
                pending,
                cancelled,
                total: periodBookings.length
            }
        })

        return NextResponse.json({ data })

    } catch (error) {
        console.error("Error fetching bookings data:", error)
        return NextResponse.json({ error: "Failed to fetch bookings data" }, { status: 500 })
    }
}
