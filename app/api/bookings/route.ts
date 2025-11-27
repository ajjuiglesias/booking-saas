import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay, parseISO } from "date-fns"

export async function GET(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const start = searchParams.get("start")
    const end = searchParams.get("end")
    const statusFilter = searchParams.get("status") // upcoming, completed, cancelled, all
    const futureOnly = searchParams.get("futureOnly") === "true" // For calendar view

    if (!start || !end) {
        return NextResponse.json({ error: "Start and end dates required" }, { status: 400 })
    }

    try {
        const now = new Date()

        // Build where clause
        const where: any = {
            businessId: session.user.id,
            startTime: {
                gte: parseISO(start),
                lte: parseISO(end)
            }
        }

        // Add status filter
        if (statusFilter === "upcoming") {
            where.status = { in: ["confirmed", "pending"] }
            where.startTime = { gte: now }
        } else if (statusFilter === "completed") {
            where.status = "completed"
        } else if (statusFilter === "cancelled") {
            where.status = "cancelled"
        } else if (statusFilter === "no_show") {
            where.status = "no_show"
        } else if (futureOnly) {
            // For calendar - show only future bookings
            where.startTime = {
                gte: now,
                lte: parseISO(end)
            }
            where.status = { in: ["confirmed", "pending"] }
        }

        const bookings = await prisma.booking.findMany({
            where,
            include: {
                customer: true,
                service: true
            },
            orderBy: {
                startTime: "asc"
            }
        })

        return NextResponse.json(bookings)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        // Implementation for manual booking creation will go here
        // Need to handle customer creation/lookup, service validation, etc.

        return NextResponse.json({ message: "Not implemented yet" }, { status: 501 })
    } catch (error) {
        return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
    }
}
