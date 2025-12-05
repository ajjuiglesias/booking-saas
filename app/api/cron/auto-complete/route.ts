import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/cron/auto-complete
 * Automatically mark checked-in bookings as completed after service end time
 * Should be called by cron job every 30 minutes
 */
export async function GET(request: NextRequest) {
    try {
        // Verify this is a cron job (optional: add auth header check)
        const authHeader = request.headers.get("authorization")
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const now = new Date()

        // Find bookings that should be marked as completed:
        // - Status is "checked_in"
        // - End time has passed
        const bookingsToComplete = await prisma.booking.findMany({
            where: {
                status: "checked_in",
                endTime: {
                    lt: now,
                },
            },
            select: {
                id: true,
                startTime: true,
                endTime: true,
                customer: {
                    select: {
                        name: true,
                    },
                },
                service: {
                    select: {
                        name: true,
                    },
                },
            },
        })

        // Update all to completed
        const updatePromises = bookingsToComplete.map((booking) =>
            prisma.booking.update({
                where: { id: booking.id },
                data: {
                    status: "completed",
                },
            })
        )

        await Promise.all(updatePromises)

        return NextResponse.json({
            success: true,
            processed: bookingsToComplete.length,
            bookings: bookingsToComplete.map((b) => ({
                id: b.id,
                customer: b.customer.name,
                service: b.service.name,
                endTime: b.endTime,
            })),
        })
    } catch (error) {
        console.error("Auto complete cron error:", error)
        return NextResponse.json(
            { error: "Failed to auto-complete bookings" },
            { status: 500 }
        )
    }
}
