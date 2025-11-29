import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET() {
    try {
        const session = await auth()

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
        }

        // Get the business for this user
        const business = await prisma.business.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                name: true,
                email: true,
                slug: true
            }
        })

        if (!business) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 })
        }

        // Get bookings for this business
        const bookings = await prisma.booking.findMany({
            where: { businessId: business.id },
            include: {
                customer: true,
                service: true
            },
            orderBy: { createdAt: 'desc' }
        })

        // Get all businesses (for comparison)
        const allBusinesses = await prisma.business.findMany({
            select: { id: true, name: true, email: true }
        })

        return NextResponse.json({
            currentUser: session.user.email,
            business: business,
            bookingsCount: bookings.length,
            bookings: bookings.map(b => ({
                id: b.id,
                customer: b.customer.name,
                service: b.service.name,
                startTime: b.startTime,
                status: b.status,
                amount: Number(b.paymentAmount)
            })),
            allBusinesses: allBusinesses
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
