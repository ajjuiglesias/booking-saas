import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
    request: NextRequest,
    { params }: { params: { businessId: string } }
) {
    try {
        const businessId = params.businessId

        // Get availability schedule and blocked dates for this business
        const [availability, blockedDates] = await Promise.all([
            prisma.availability.findMany({
                where: { businessId },
                orderBy: { dayOfWeek: 'asc' }
            }),
            prisma.blockedDate.findMany({
                where: { businessId },
                orderBy: { date: 'asc' }
            })
        ])

        return NextResponse.json({ availability, blockedDates })
    } catch (error) {
        console.error("Failed to fetch availability:", error)
        return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 })
    }
}
