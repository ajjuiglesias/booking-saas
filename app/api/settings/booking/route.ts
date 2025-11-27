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
            where: { email: session.user.email },
            select: {
                minNoticeHours: true,
                maxAdvanceDays: true,
                bufferMinutes: true,
                bookingMessage: true,
                cancellationPolicy: true,
                cancellationHours: true,
            }
        })

        if (!business) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 })
        }

        return NextResponse.json(business)
    } catch (error) {
        console.error("Error fetching booking settings:", error)
        return NextResponse.json({ error: "Failed to fetch booking settings" }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { minNoticeHours, maxAdvanceDays, bufferMinutes, bookingMessage, cancellationPolicy, cancellationHours } = body

        // Validate required fields
        if (minNoticeHours === undefined || maxAdvanceDays === undefined || bufferMinutes === undefined || !cancellationPolicy || cancellationHours === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Validate ranges
        if (minNoticeHours < 0 || minNoticeHours > 168) {
            return NextResponse.json({ error: "Minimum notice must be between 0 and 168 hours" }, { status: 400 })
        }
        if (maxAdvanceDays < 1 || maxAdvanceDays > 365) {
            return NextResponse.json({ error: "Maximum advance days must be between 1 and 365" }, { status: 400 })
        }
        if (bufferMinutes < 0 || bufferMinutes > 120) {
            return NextResponse.json({ error: "Buffer time must be between 0 and 120 minutes" }, { status: 400 })
        }

        const updatedBusiness = await prisma.business.update({
            where: { email: session.user.email },
            data: {
                minNoticeHours,
                maxAdvanceDays,
                bufferMinutes,
                bookingMessage: bookingMessage || null,
                cancellationPolicy,
                cancellationHours,
            },
            select: {
                minNoticeHours: true,
                maxAdvanceDays: true,
                bufferMinutes: true,
                bookingMessage: true,
                cancellationPolicy: true,
                cancellationHours: true,
            }
        })

        return NextResponse.json(updatedBusiness)
    } catch (error) {
        console.error("Error updating booking settings:", error)
        return NextResponse.json({ error: "Failed to update booking settings" }, { status: 500 })
    }
}
