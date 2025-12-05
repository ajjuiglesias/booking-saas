import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyPaymentSignature } from "@/lib/razorpay"

/**
 * POST /api/payments/verify
 * Verify Razorpay payment signature and update booking
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = body

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
            return NextResponse.json(
                { error: "Missing required payment details" },
                { status: 400 }
            )
        }

        // Get booking with payment settings
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

        const paymentSettings = booking.business.paymentSettings

        if (!paymentSettings?.razorpayKeySecret) {
            return NextResponse.json(
                { error: "Payment settings not configured" },
                { status: 400 }
            )
        }

        // Verify payment signature
        const isValid = verifyPaymentSignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            paymentSettings.razorpayKeySecret
        )

        if (!isValid) {
            return NextResponse.json(
                { error: "Invalid payment signature" },
                { status: 400 }
            )
        }

        // Update booking with payment details and confirm the booking
        const updatedBooking = await prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: "confirmed", // Change from pending_payment to confirmed
                paymentStatus: "paid",
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                paymentMethod: "online",
                paidAt: new Date(),
            },
        })

        return NextResponse.json({
            success: true,
            booking: updatedBooking,
        })
    } catch (error) {
        console.error("Error verifying payment:", error)
        return NextResponse.json(
            { error: "Failed to verify payment" },
            { status: 500 }
        )
    }
}
