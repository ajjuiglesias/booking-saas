import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/bookings/[id]/mark-paid
 * Mark a cash payment booking as paid
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const bookingId = params.id

        // Get booking to verify ownership
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            select: { businessId: true, paymentMethod: true, paymentStatus: true },
        })

        if (!booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 })
        }

        if (booking.businessId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        // Only allow marking cash payments as paid
        if (booking.paymentMethod !== "cash") {
            return NextResponse.json(
                { error: "Only cash payments can be manually marked as paid" },
                { status: 400 }
            )
        }

        // Update payment status
        const updatedBooking = await prisma.booking.update({
            where: { id: bookingId },
            data: {
                paymentStatus: "paid",
                paidAt: new Date(),
            },
        })

        return NextResponse.json({
            success: true,
            booking: updatedBooking,
        })
    } catch (error) {
        console.error("Error marking booking as paid:", error)
        return NextResponse.json(
            { error: "Failed to mark booking as paid" },
            { status: 500 }
        )
    }
}
