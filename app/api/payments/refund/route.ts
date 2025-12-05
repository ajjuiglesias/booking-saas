import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getRazorpayInstance, calculateRefundAmount, toPaise } from "@/lib/razorpay"

/**
 * POST /api/payments/refund
 * Process a refund for a cancelled booking
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { bookingId } = body

        if (!bookingId) {
            return NextResponse.json(
                { error: "Booking ID is required" },
                { status: 400 }
            )
        }

        // Get booking with payment details
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                business: {
                    include: {
                        paymentSettings: true,
                    },
                },
            },
        })

        if (!booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 })
        }

        // Verify booking belongs to this business
        if (booking.businessId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const paymentSettings = booking.business.paymentSettings

        if (!paymentSettings?.allowRefunds) {
            return NextResponse.json(
                { error: "Refunds are not allowed" },
                { status: 400 }
            )
        }

        if (booking.paymentStatus !== "paid") {
            return NextResponse.json(
                { error: "Booking is not paid" },
                { status: 400 }
            )
        }

        if (!booking.razorpayPaymentId) {
            return NextResponse.json(
                { error: "No payment ID found" },
                { status: 400 }
            )
        }

        if (booking.refundId) {
            return NextResponse.json(
                { error: "Refund already processed" },
                { status: 400 }
            )
        }

        // Calculate refund amount based on settings
        const paidAmount = Number(booking.paymentAmount || 0)
        const refundAmount = calculateRefundAmount(
            paidAmount,
            paymentSettings.refundPercentage
        )

        if (refundAmount <= 0) {
            return NextResponse.json(
                { error: "No refund amount configured" },
                { status: 400 }
            )
        }

        // Initialize Razorpay
        const razorpay = getRazorpayInstance(
            paymentSettings.razorpayKeyId!,
            paymentSettings.razorpayKeySecret!
        )

        // Process refund
        const refund = await razorpay.payments.refund(booking.razorpayPaymentId, {
            amount: toPaise(refundAmount),
            notes: {
                bookingId,
                reason: booking.cancellationReason || "Booking cancelled",
            },
        })

        // Update booking with refund details
        const updatedBooking = await prisma.booking.update({
            where: { id: bookingId },
            data: {
                paymentStatus: "refunded",
                refundId: refund.id,
                refundedAt: new Date(),
                refundAmount,
            },
        })

        return NextResponse.json({
            success: true,
            refundId: refund.id,
            refundAmount,
            booking: updatedBooking,
        })
    } catch (error: any) {
        console.error("Error processing refund:", error)
        return NextResponse.json(
            { error: error.message || "Failed to process refund" },
            { status: 500 }
        )
    }
}
