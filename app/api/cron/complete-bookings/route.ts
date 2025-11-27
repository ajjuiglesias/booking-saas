import { NextRequest, NextResponse } from "next/server"
import { autoCompletePastBookings } from "@/lib/booking-status"

/**
 * Cron job endpoint to auto-complete past bookings
 * Call this endpoint daily/hourly from a cron service
 * 
 * Example: GET /api/cron/complete-bookings
 * 
 * You can use services like:
 * - Vercel Cron Jobs
 * - GitHub Actions
 * - External cron services (cron-job.org)
 */
export async function GET(request: NextRequest) {
    try {
        // Optional: Add authentication to prevent unauthorized access
        const authHeader = request.headers.get("authorization")
        const cronSecret = process.env.CRON_SECRET

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const result = await autoCompletePastBookings()

        return NextResponse.json({
            success: true,
            message: `Completed ${result.count} bookings`,
            ...result,
        })
    } catch (error) {
        console.error("Cron job error:", error)
        return NextResponse.json(
            { error: "Failed to complete bookings" },
            { status: 500 }
        )
    }
}
