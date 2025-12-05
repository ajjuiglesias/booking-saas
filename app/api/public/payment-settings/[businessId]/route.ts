import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/public/payment-settings/[businessId]
 * Get public payment settings for a business (for booking page)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ businessId: string }> }
) {
    try {
        const { businessId } = await params

        const settings = await prisma.paymentSettings.findUnique({
            where: { businessId },
            select: {
                razorpayEnabled: true,
                razorpayKeyId: true, // Public key is safe to expose
                razorpayMode: true,
                acceptOnlinePayment: true,
                acceptCashPayment: true,
                requireAdvancePayment: true,
                advancePaymentPercent: true,
                // Don't expose secret key or refund settings
            },
        })

        if (!settings) {
            // Return default settings if not configured
            return NextResponse.json({
                razorpayEnabled: false,
                acceptOnlinePayment: false,
                acceptCashPayment: true,
                requireAdvancePayment: false,
                advancePaymentPercent: 100,
            })
        }

        return NextResponse.json(settings)
    } catch (error) {
        console.error("Error fetching public payment settings:", error)
        return NextResponse.json(
            { error: "Failed to fetch payment settings" },
            { status: 500 }
        )
    }
}
