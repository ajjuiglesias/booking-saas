import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        // Get all bookings
        const allBookings = await prisma.booking.findMany({
            include: {
                customer: true,
                service: true,
                business: true
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        })

        // Get booking count by business
        const bookingsByBusiness = await prisma.booking.groupBy({
            by: ['businessId'],
            _count: true
        })

        // Get total revenue
        const totalRevenue = await prisma.booking.aggregate({
            _sum: { paymentAmount: true },
            _count: true
        })

        return NextResponse.json({
            totalBookings: allBookings.length,
            bookings: allBookings.map(b => ({
                id: b.id,
                business: b.business.name,
                customer: b.customer.name,
                service: b.service.name,
                startTime: b.startTime,
                status: b.status,
                amount: Number(b.paymentAmount)
            })),
            byBusiness: bookingsByBusiness,
            totalRevenue: Number(totalRevenue._sum.paymentAmount || 0),
            totalCount: totalRevenue._count
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
