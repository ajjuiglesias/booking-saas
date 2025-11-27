import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from "date-fns"

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

        // Get date range from query params or default to current month
        const { searchParams } = new URL(request.url)
        const fromParam = searchParams.get("from")
        const toParam = searchParams.get("to")

        const from = fromParam ? new Date(fromParam) : startOfMonth(new Date())
        const to = toParam ? new Date(toParam) : endOfMonth(new Date())

        // Previous period for comparison
        const previousFrom = subMonths(from, 1)
        const previousTo = subMonths(to, 1)

        // Total Revenue (current period)
        const currentRevenue = await prisma.booking.aggregate({
            where: {
                businessId: business.id,
                startTime: { gte: from, lte: to },
                status: "confirmed"
            },
            _sum: { paymentAmount: true },
            _count: true
        })

        // Previous period revenue
        const previousRevenue = await prisma.booking.aggregate({
            where: {
                businessId: business.id,
                startTime: { gte: previousFrom, lte: previousTo },
                status: "confirmed"
            },
            _sum: { paymentAmount: true },
            _count: true
        })

        // Total Bookings
        const totalBookings = currentRevenue._count
        const previousBookings = previousRevenue._count

        // Revenue
        const revenue = Number(currentRevenue._sum.paymentAmount || 0)
        const prevRevenue = Number(previousRevenue._sum.paymentAmount || 0)

        // Average Booking Value
        const avgBookingValue = totalBookings > 0 ? revenue / totalBookings : 0

        // Growth calculations
        const revenueGrowth = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) : 0
        const bookingsGrowth = previousBookings > 0 ? ((totalBookings - previousBookings) / previousBookings) : 0

        // Active Customers (unique customers with bookings in period)
        const activeCustomers = await prisma.booking.findMany({
            where: {
                businessId: business.id,
                startTime: { gte: from, lte: to }
            },
            distinct: ['customerId'],
            select: { customerId: true }
        })

        // Most Popular Service
        const serviceBookings = await prisma.booking.groupBy({
            by: ['serviceId'],
            where: {
                businessId: business.id,
                startTime: { gte: from, lte: to },
                status: "confirmed"
            },
            _count: true,
            orderBy: {
                _count: {
                    serviceId: 'desc'
                }
            },
            take: 1
        })

        let popularService = null
        if (serviceBookings.length > 0) {
            const service = await prisma.service.findUnique({
                where: { id: serviceBookings[0].serviceId },
                select: { id: true, name: true }
            })
            if (service) {
                popularService = {
                    id: service.id,
                    name: service.name,
                    bookings: serviceBookings[0]._count
                }
            }
        }

        // Conversion Rate (confirmed / total)
        const allBookings = await prisma.booking.count({
            where: {
                businessId: business.id,
                startTime: { gte: from, lte: to }
            }
        })
        const confirmedBookings = await prisma.booking.count({
            where: {
                businessId: business.id,
                startTime: { gte: from, lte: to },
                status: "confirmed"
            }
        })
        const conversionRate = allBookings > 0 ? confirmedBookings / allBookings : 0

        return NextResponse.json({
            totalRevenue: revenue,
            totalBookings,
            avgBookingValue,
            conversionRate,
            growth: {
                revenue: revenueGrowth,
                bookings: bookingsGrowth
            },
            activeCustomers: activeCustomers.length,
            popularService
        })

    } catch (error) {
        console.error("Error fetching analytics overview:", error)
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
    }
}
