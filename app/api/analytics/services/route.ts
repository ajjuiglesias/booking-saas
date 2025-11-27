import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

        if (!fromParam || !toParam) {
            return NextResponse.json({ error: "Missing date range" }, { status: 400 })
        }

        const from = new Date(fromParam)
        const to = new Date(toParam)

        // Get all services with their bookings
        const services = await prisma.service.findMany({
            where: { businessId: business.id, isActive: true },
            include: {
                bookings: {
                    where: {
                        startTime: { gte: from, lte: to },
                        status: "confirmed"
                    },
                    select: {
                        paymentAmount: true
                    }
                }
            }
        })

        // Calculate metrics for each service
        const data = services.map(service => ({
            name: service.name,
            bookings: service.bookings.length,
            revenue: service.bookings.reduce((sum, b) => sum + Number(b.paymentAmount || 0), 0),
            color: service.color || "#6366f1"
        }))
            .filter(s => s.bookings > 0) // Only show services with bookings
            .sort((a, b) => b.bookings - a.bookings) // Sort by popularity

        return NextResponse.json({ data })

    } catch (error) {
        console.error("Error fetching services data:", error)
        return NextResponse.json({ error: "Failed to fetch services data" }, { status: 500 })
    }
}
