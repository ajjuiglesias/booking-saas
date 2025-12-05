import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getRazorpayInstance, toPaise } from "@/lib/razorpay"

/**
 * POST /api/payments/create-order
 * Create a Razorpay order for a booking
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { bookingId, amount } = body

        if (!bookingId || !amount) {
            return NextResponse.json(
                { error: "Booking ID and amount are required" },
                { status: 400 }
            )
        }

        // Get booking to verify it exists and get business ID
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                business: {
                    include: {
                        paymentSettings: true,
                    },
                },
                customer: true,
                service: true,
            },
        })

        if (!booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 })
        }

        const paymentSettings = booking.business.paymentSettings

        if (!paymentSettings) {
            return NextResponse.json(
                { error: "Payment settings not configured. Please configure payment settings in Dashboard → Settings → Payment" },
                { status: 400 }
            )
        }

        if (!paymentSettings.razorpayEnabled) {
            return NextResponse.json(
                { error: "Online payments not enabled. Please enable Razorpay in payment settings." },
                { status: 400 }
            )
        }

        if (!paymentSettings.razorpayKeyId || !paymentSettings.razorpayKeySecret) {
            return NextResponse.json(
                { error: "Razorpay credentials not configured. Please add your Razorpay API keys in payment settings." },
                { status: 400 }
            )
        }

        // Initialize Razorpay
        const razorpay = getRazorpayInstance(
            paymentSettings.razorpayKeyId,
            paymentSettings.razorpayKeySecret
        )

        // Create Razorpay order
        const order = await razorpay.orders.create({
            amount: toPaise(amount), // Convert to paise
            currency: "INR",
            receipt: `booking_${bookingId}`,
            notes: {
                bookingId,
                customerId: booking.customerId,
                customerName: booking.customer.name,
                serviceName: booking.service.name,
            },
        })

        // Update booking with order ID
        await prisma.booking.update({
            where: { id: bookingId },
            data: {
                razorpayOrderId: order.id,
                paymentAmount: amount,
            },
        })

        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: paymentSettings.razorpayKeyId,
        })
    } catch (error) {
        console.error("Error creating Razorpay order:", error)
        return NextResponse.json(
            { error: "Failed to create payment order" },
            { status: 500 }
        )
    }
}
