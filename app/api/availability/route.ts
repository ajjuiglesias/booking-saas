import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const [availability, business, blockedDates] = await Promise.all([
            prisma.availability.findMany({
                where: { businessId: session.user.id },
                orderBy: { dayOfWeek: 'asc' }
            }),
            prisma.business.findUnique({
                where: { id: session.user.id },
                select: { bufferMinutes: true }
            }),
            prisma.blockedDate.findMany({
                where: { businessId: session.user.id },
                orderBy: { date: 'asc' }
            })
        ])

        return NextResponse.json({
            availability,
            bufferMinutes: business?.bufferMinutes || 0,
            blockedDates
        })
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { availability, bufferMinutes } = body

        // Update buffer time
        if (typeof bufferMinutes === 'number') {
            await prisma.business.update({
                where: { id: session.user.id },
                data: { bufferMinutes }
            })
        }

        // Update availability
        // This is a full replacement strategy for simplicity
        if (availability && Array.isArray(availability)) {
            await prisma.$transaction(async (tx) => {
                // Delete existing
                await tx.availability.deleteMany({
                    where: { businessId: session.user.id }
                })

                // Create new
                if (availability.length > 0) {
                    await tx.availability.createMany({
                        data: availability.map((a: any) => ({
                            businessId: session.user.id,
                            dayOfWeek: a.dayOfWeek,
                            startTime: a.startTime,
                            endTime: a.endTime,
                            isAvailable: a.isAvailable
                        }))
                    })
                }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Update availability error:", error)
        return NextResponse.json({ error: "Failed to update availability" }, { status: 500 })
    }
}
