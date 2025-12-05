import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/settings/payment
 * Get payment settings for the business
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const businessId = session.user.id

        // Get or create payment settings
        let settings = await prisma.paymentSettings.findUnique({
            where: { businessId },
        })

        // Create default settings if they don't exist
        if (!settings) {
            settings = await prisma.paymentSettings.create({
                data: {
                    businessId,
                    razorpayEnabled: false,
                    razorpayMode: "test",
                    acceptOnlinePayment: true,
                    acceptCashPayment: true,
                    requireAdvancePayment: false,
                    advancePaymentPercent: 100,
                    allowRefunds: true,
                    refundPercentage: 100,
                },
            })
        }

        // Don't send secret key to client
        const { razorpayKeySecret, ...safeSettings } = settings

        return NextResponse.json(safeSettings)
    } catch (error) {
        console.error("Error fetching payment settings:", error)
        return NextResponse.json(
            { error: "Failed to fetch payment settings" },
            { status: 500 }
        )
    }
}

/**
 * PUT /api/settings/payment
 * Update payment settings
 */
export async function PUT(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const businessId = session.user.id
        const body = await request.json()

        const {
            razorpayEnabled,
            razorpayKeyId,
            razorpayKeySecret,
            razorpayMode,
            acceptOnlinePayment,
            acceptCashPayment,
            requireAdvancePayment,
            advancePaymentPercent,
            allowRefunds,
            refundPercentage,
        } = body

        // Validate percentages
        if (advancePaymentPercent < 0 || advancePaymentPercent > 100) {
            return NextResponse.json(
                { error: "Advance payment percent must be between 0 and 100" },
                { status: 400 }
            )
        }

        if (refundPercentage < 0 || refundPercentage > 100) {
            return NextResponse.json(
                { error: "Refund percentage must be between 0 and 100" },
                { status: 400 }
            )
        }

        // Update or create settings
        const settings = await prisma.paymentSettings.upsert({
            where: { businessId },
            update: {
                razorpayEnabled,
                razorpayKeyId,
                ...(razorpayKeySecret && { razorpayKeySecret }), // Only update if provided
                razorpayMode,
                acceptOnlinePayment,
                acceptCashPayment,
                requireAdvancePayment,
                advancePaymentPercent,
                allowRefunds,
                refundPercentage,
            },
            create: {
                businessId,
                razorpayEnabled,
                razorpayKeyId,
                razorpayKeySecret,
                razorpayMode,
                acceptOnlinePayment,
                acceptCashPayment,
                requireAdvancePayment,
                advancePaymentPercent,
                allowRefunds,
                refundPercentage,
            },
        })

        // Don't send secret key to client
        const { razorpayKeySecret: _, ...safeSettings } = settings

        return NextResponse.json(safeSettings)
    } catch (error) {
        console.error("Error updating payment settings:", error)
        return NextResponse.json(
            { error: "Failed to update payment settings" },
            { status: 500 }
        )
    }
}
