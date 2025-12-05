import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyWebhookSignature } from "@/lib/razorpay"

/**
 * POST /api/payments/webhook
 * Handle Razorpay webhook events
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.text()
        const signature = request.headers.get("x-razorpay-signature")

        if (!signature) {
            return NextResponse.json(
                { error: "Missing signature" },
                { status: 400 }
            )
        }

        // Verify webhook signature
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
        if (webhookSecret) {
            const isValid = verifyWebhookSignature(body, signature, webhookSecret)
            if (!isValid) {
                console.error("Invalid webhook signature")
                return NextResponse.json(
                    { error: "Invalid signature" },
                    { status: 400 }
                )
            }
        }

        const event = JSON.parse(body)
        console.log("Razorpay webhook event:", event.event)

        switch (event.event) {
            case "payment.captured":
                await handlePaymentCaptured(event.payload.payment.entity)
                break

            case "payment.failed":
                await handlePaymentFailed(event.payload.payment.entity)
                break

            case "refund.created":
                await handleRefundCreated(event.payload.refund.entity)
                break

            default:
                console.log("Unhandled webhook event:", event.event)
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error("Error processing webhook:", error)
        return NextResponse.json(
            { error: "Webhook processing failed" },
            { status: 500 }
        )
    }
}

async function handlePaymentCaptured(payment: any) {
    try {
        const orderId = payment.order_id
        const paymentId = payment.id

        // Find booking by order ID
        const booking = await prisma.booking.findFirst({
            where: { razorpayOrderId: orderId },
        })

        if (!booking) {
            console.error("Booking not found for order:", orderId)
            return
        }

        // Update booking status
        await prisma.booking.update({
            where: { id: booking.id },
            data: {
                paymentStatus: "paid",
                razorpayPaymentId: paymentId,
                paymentMethod: "online",
                paidAt: new Date(),
            },
        })

        console.log("Payment captured for booking:", booking.id)
    } catch (error) {
        console.error("Error handling payment.captured:", error)
    }
}

async function handlePaymentFailed(payment: any) {
    try {
        const orderId = payment.order_id

        // Find booking by order ID
        const booking = await prisma.booking.findFirst({
            where: { razorpayOrderId: orderId },
        })

        if (!booking) {
            console.error("Booking not found for order:", orderId)
            return
        }

        // Update booking status
        await prisma.booking.update({
            where: { id: booking.id },
            data: {
                paymentStatus: "failed",
            },
        })

        console.log("Payment failed for booking:", booking.id)
    } catch (error) {
        console.error("Error handling payment.failed:", error)
    }
}

async function handleRefundCreated(refund: any) {
    try {
        const paymentId = refund.payment_id
        const refundId = refund.id
        const refundAmount = refund.amount / 100 // Convert paise to rupees

        // Find booking by payment ID
        const booking = await prisma.booking.findFirst({
            where: { razorpayPaymentId: paymentId },
        })

        if (!booking) {
            console.error("Booking not found for payment:", paymentId)
            return
        }

        // Update booking with refund details
        await prisma.booking.update({
            where: { id: booking.id },
            data: {
                paymentStatus: "refunded",
                refundId,
                refundedAt: new Date(),
                refundAmount,
            },
        })

        console.log("Refund processed for booking:", booking.id)
    } catch (error) {
        console.error("Error handling refund.created:", error)
    }
}
