import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                business: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                        address: true,
                    },
                },
                service: {
                    select: {
                        name: true,
                        color: true,
                        durationMinutes: true,
                        price: true,
                    },
                },
                customer: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        })

        if (!booking) {
            return NextResponse.json(
                { error: "Booking not found" },
                { status: 404 }
            )
        }

        // Include the IDs in the response for the reschedule page
        const response = {
            ...booking,
            businessId: booking.businessId,
            serviceId: booking.serviceId,
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error("Error fetching booking:", error)
        return NextResponse.json(
            { error: "Failed to fetch booking" },
            { status: 500 }
        )
    }
}
