import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { canCancelBooking, getPolicyDescription } from "@/lib/booking-policies"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Fetch booking with business data
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                business: true,
            },
        })

        if (!booking) {
            return NextResponse.json(
                { error: "Booking not found" },
                { status: 404 }
            )
        }

        // Check cancellation policy
        const cancellationCheck = canCancelBooking(booking, booking.business)
        const policyDescription = getPolicyDescription(booking.business)

        return NextResponse.json({
            canCancel: cancellationCheck.canCancel,
            reason: cancellationCheck.reason,
            hoursUntilBooking: cancellationCheck.hoursUntilBooking,
            policy: booking.business.cancellationPolicy || "flexible",
            policyDescription,
            requiredHours: booking.business.cancellationHours || 24,
        })
    } catch (error) {
        console.error("Error checking cancellation:", error)
        return NextResponse.json(
            { error: "Failed to check cancellation policy" },
            { status: 500 }
        )
    }
}
