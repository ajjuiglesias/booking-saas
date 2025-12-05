import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/cron/auto-no-show
 * Automatically mark bookings as no-show if not checked in within grace period
 * Should be called by cron job every 15-30 minutes
 */
export async function GET(request: NextRequest) {
    try {
        // Verify this is a cron job (optional: add auth header check)
        const authHeader = request.headers.get("authorization")
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const now = new Date()
        const gracePeriodMinutes = 30

        // Find bookings that should be marked as no-show:
        // - Status is "confirmed" (not checked in)
        // - Start time + grace period has passed
        // - Not already processed
        const bookingsToMarkNoShow = await prisma.booking.findMany({
            where: {
                status: "confirmed",
                checkedInAt: null,
                startTime: {
                    lt: new Date(now.getTime() - gracePeriodMinutes * 60 * 1000),
                },
            },
            select: {
                id: true,
                startTime: true,
                customer: {
                    select: {
                        id: true,
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

        // Update all to no-show
        const updatePromises = bookingsToMarkNoShow.map((booking) =>
            prisma.booking.update({
                where: { id: booking.id },
                data: {
                    status: "no_show",
                },
            })
        )

        // Also increment customer no-show count
        const customerUpdatePromises = bookingsToMarkNoShow.map((booking) =>
            prisma.customer.update({
                where: { id: booking.customer.id },
                data: {
                    noShowCount: {
                        increment: 1,
                    },
                },
            })
        )

        await Promise.all([...updatePromises, ...customerUpdatePromises])

        return NextResponse.json({
            success: true,
            processed: bookingsToMarkNoShow.length,
            bookings: bookingsToMarkNoShow.map((b) => ({
                id: b.id,
                customer: b.customer.name,
                service: b.service.name,
                startTime: b.startTime,
            })),
        })
    } catch (error) {
        console.error("Auto no-show cron error:", error)
        return NextResponse.json(
            { error: "Failed to process no-shows" },
            { status: 500 }
        )
    }
}
