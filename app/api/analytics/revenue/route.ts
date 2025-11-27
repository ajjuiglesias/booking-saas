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
        const groupBy = searchParams.get("groupBy") || "day" // day, week, month

        if (!fromParam || !toParam) {
            return NextResponse.json({ error: "Missing date range" }, { status: 400 })
        }

        const from = new Date(fromParam)
        const to = new Date(toParam)

        // Fetch all bookings in range
        const bookings = await prisma.booking.findMany({
            where: {
                businessId: business.id,
                startTime: { gte: from, lte: to },
                status: "confirmed"
            },
            select: {
                startTime: true,
                paymentAmount: true
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

        // Aggregate revenue by period
        const data = intervals.map(date => {
            const periodStart = groupBy === "week" ? startOfWeek(date) : groupBy === "month" ? startOfMonth(date) : startOfDay(date)
            const periodEnd = groupBy === "week" ? startOfWeek(new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000)) :
                groupBy === "month" ? startOfMonth(new Date(date.getFullYear(), date.getMonth() + 1, 1)) :
                    new Date(date.getTime() + 24 * 60 * 60 * 1000)

            const periodBookings = bookings.filter(b => {
                const bookingDate = new Date(b.startTime)
                return bookingDate >= periodStart && bookingDate < periodEnd
            })

            const revenue = periodBookings.reduce((sum, b) => sum + Number(b.paymentAmount || 0), 0)

            return {
                date: format(date, formatString),
                revenue: Math.round(revenue * 100) / 100
            }
        })

        return NextResponse.json({ data })

    } catch (error) {
        console.error("Error fetching revenue data:", error)
        return NextResponse.json({ error: "Failed to fetch revenue data" }, { status: 500 })
    }
}
