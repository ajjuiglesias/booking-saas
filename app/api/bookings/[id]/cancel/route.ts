import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { canCancelBooking } from "@/lib/booking-policies"
import { sendBookingCancellationEmail, sendBusinessCancellationNotification } from "@/lib/email"

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { cancelledBy, reason } = body

        // Validate cancelledBy
        if (!cancelledBy || !["customer", "business"].includes(cancelledBy)) {
            return NextResponse.json(
                { error: "Invalid cancelledBy value" },
                { status: 400 }
            )
        }

        // Fetch booking with related data
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                business: true,
                service: true,
                customer: true,
            },
        })

        if (!booking) {
            return NextResponse.json(
                { error: "Booking not found" },
                { status: 404 }
            )
        }

        // Check if booking can be cancelled
        const cancellationCheck = canCancelBooking(booking, booking.business)

        if (!cancellationCheck.canCancel) {
            return NextResponse.json(
                {
                    error: cancellationCheck.reason,
                    canCancel: false
                },
                { status: 400 }
            )
        }

        // Update booking status
        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: {
                status: "cancelled",
                cancelledAt: new Date(),
                cancelledBy,
                cancellationReason: reason || null,
            },
            include: {
                business: true,
                service: true,
                customer: true,
            },
        })

        // Send cancellation emails
        try {
            // Email to customer
            await sendBookingCancellationEmail({
                to: updatedBooking.customer.email || updatedBooking.customer.phone,
                booking: updatedBooking,
                business: updatedBooking.business,
                service: updatedBooking.service,
                cancelledBy,
            })

            // Email to business
            await sendBusinessCancellationNotification({
                to: updatedBooking.business.email,
                booking: updatedBooking,
                customer: updatedBooking.customer,
                service: updatedBooking.service,
                cancelledBy,
                reason,
            })
        } catch (emailError) {
            console.error("Failed to send cancellation emails:", emailError)
            // Don't fail the request if emails fail
        }

        return NextResponse.json({
            success: true,
            booking: updatedBooking,
            message: "Booking cancelled successfully",
        })
    } catch (error) {
        console.error("Error cancelling booking:", error)
        return NextResponse.json(
            { error: "Failed to cancel booking" },
            { status: 500 }
        )
    }
}
