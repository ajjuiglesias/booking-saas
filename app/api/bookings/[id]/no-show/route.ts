import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params

        // Fetch booking
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                customer: true,
            },
        })

        if (!booking) {
            return NextResponse.json(
                { error: "Booking not found" },
                { status: 404 }
            )
        }

        // Verify booking belongs to this business
        if (booking.businessId !== session.user.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            )
        }

        // Check if booking is in the past
        if (new Date(booking.endTime) > new Date()) {
            return NextResponse.json(
                { error: "Cannot mark future booking as no-show" },
                { status: 400 }
            )
        }

        // Update booking to no-show
        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: {
                status: "no_show",
            },
        })

        // Increment customer no-show count
        await prisma.customer.update({
            where: { id: booking.customerId },
            data: {
                noShowCount: {
                    increment: 1,
                },
            },
        })

        return NextResponse.json({
            success: true,
            booking: updatedBooking,
            message: "Booking marked as no-show",
        })
    } catch (error) {
        console.error("Error marking no-show:", error)
        return NextResponse.json(
            { error: "Failed to mark as no-show" },
            { status: 500 }
        )
    }
}
