import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params

        // Fetch customer with bookings
        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                bookings: {
                    where: { status: "completed" },
                    orderBy: { startTime: "desc" },
                    select: {
                        id: true,
                        startTime: true,
                        paymentAmount: true,
                        service: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        })

        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 })
        }

        if (customer.businessId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        // Calculate stats
        const completedBookings = customer.bookings
        const totalSpent = customer.totalSpent
        const totalBookings = customer.totalBookings
        const averageOrderValue = totalBookings > 0
            ? Number(totalSpent) / totalBookings
            : 0

        // Calculate booking frequency (days between bookings)
        let averageDaysBetweenBookings = 0
        if (completedBookings.length > 1) {
            const daysDiffs = []
            for (let i = 0; i < completedBookings.length - 1; i++) {
                const diff = Math.abs(
                    new Date(completedBookings[i].startTime).getTime() -
                    new Date(completedBookings[i + 1].startTime).getTime()
                )
                daysDiffs.push(diff / (1000 * 60 * 60 * 24))
            }
            averageDaysBetweenBookings = daysDiffs.reduce((a, b) => a + b, 0) / daysDiffs.length
        }

        // Predict annual LTV (simple model)
        const bookingsPerYear = averageDaysBetweenBookings > 0
            ? 365 / averageDaysBetweenBookings
            : 12 // Default to monthly if no history
        const predictedAnnualLTV = averageOrderValue * bookingsPerYear

        // Get spending by month (last 12 months)
        const twelveMonthsAgo = new Date()
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

        const monthlySpending = await prisma.booking.groupBy({
            by: ['startTime'],
            where: {
                customerId: id,
                status: 'completed',
                startTime: { gte: twelveMonthsAgo }
            },
            _sum: {
                paymentAmount: true
            }
        })

        // Group by month
        const spendingByMonth: Record<string, number> = {}
        monthlySpending.forEach(item => {
            const month = new Date(item.startTime).toISOString().slice(0, 7) // YYYY-MM
            spendingByMonth[month] = (spendingByMonth[month] || 0) + Number(item._sum.paymentAmount || 0)
        })

        return NextResponse.json({
            customer: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                tags: customer.tags,
                segment: customer.segment,
                createdAt: customer.createdAt
            },
            stats: {
                totalSpent: Number(totalSpent),
                totalBookings,
                averageOrderValue,
                averageDaysBetweenBookings: Math.round(averageDaysBetweenBookings),
                predictedAnnualLTV: Math.round(predictedAnnualLTV),
                lastBookingDate: customer.lastBookingDate,
                noShowCount: customer.noShowCount
            },
            recentBookings: completedBookings.slice(0, 10).map(b => ({
                id: b.id,
                date: b.startTime,
                service: b.service.name,
                amount: Number(b.paymentAmount)
            })),
            spendingByMonth
        })
    } catch (error) {
        console.error("Error fetching customer stats:", error)
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
    }
}
