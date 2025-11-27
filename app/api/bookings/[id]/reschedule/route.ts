import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { canRescheduleBooking } from "@/lib/booking-policies"
import { sendBookingRescheduledEmail, sendBusinessRescheduleNotification } from "@/lib/email"

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { newStartTime, newEndTime } = body

        if (!newStartTime || !newEndTime) {
            return NextResponse.json(
                { error: "Missing newStartTime or newEndTime" },
                { status: 400 }
            )
        }

        // Fetch original booking
        const originalBooking = await prisma.booking.findUnique({
            where: { id },
            include: {
                business: true,
                service: true,
                customer: true,
            },
        })

        if (!originalBooking) {
            return NextResponse.json(
                { error: "Booking not found" },
                { status: 404 }
            )
        }

        // Check if booking can be rescheduled
        const rescheduleCheck = canRescheduleBooking(originalBooking, originalBooking.business)

        if (!rescheduleCheck.canCancel) {
            return NextResponse.json(
                {
                    error: rescheduleCheck.reason,
                    canReschedule: false
                },
                { status: 400 }
            )
        }

        // Check if new time slot is available
        const conflictingBooking = await prisma.booking.findFirst({
            where: {
                businessId: originalBooking.businessId,
                serviceId: originalBooking.serviceId,
                status: { not: "cancelled" },
                OR: [
                    {
                        AND: [
                            { startTime: { lte: new Date(newStartTime) } },
                            { endTime: { gt: new Date(newStartTime) } },
                        ],
                    },
                    {
                        AND: [
                            { startTime: { lt: new Date(newEndTime) } },
                            { endTime: { gte: new Date(newEndTime) } },
                        ],
                    },
                ],
            },
        })

        if (conflictingBooking) {
            return NextResponse.json(
                { error: "This time slot is no longer available" },
                { status: 400 }
            )
        }

        // Create new booking
        const newBooking = await prisma.booking.create({
            data: {
                businessId: originalBooking.businessId,
                serviceId: originalBooking.serviceId,
                customerId: originalBooking.customerId,
                staffId: originalBooking.staffId,
                startTime: new Date(newStartTime),
                endTime: new Date(newEndTime),
                status: "confirmed",
                customerNotes: originalBooking.customerNotes,
                paymentAmount: originalBooking.paymentAmount,
                paymentMethod: originalBooking.paymentMethod,
                rescheduledFrom: originalBooking.id,
            },
            include: {
                business: true,
                service: true,
                customer: true,
            },
        })

        // Update original booking
        await prisma.booking.update({
            where: { id: originalBooking.id },
            data: {
                status: "cancelled",
                cancelledAt: new Date(),
                cancelledBy: "customer",
                cancellationReason: "Rescheduled",
                rescheduledTo: newBooking.id,
                rescheduledAt: new Date(),
            },
        })

        // Send emails
        try {
            await sendBookingRescheduledEmail({
                to: newBooking.customer.email || newBooking.customer.phone,
                oldBooking: originalBooking,
                newBooking,
                business: newBooking.business,
                service: newBooking.service,
            })

            await sendBusinessRescheduleNotification({
                to: newBooking.business.email,
                oldBooking: originalBooking,
                newBooking,
                customer: newBooking.customer,
                service: newBooking.service,
            })
        } catch (emailError) {
            console.error("Failed to send reschedule emails:", emailError)
        }

        return NextResponse.json({
            success: true,
            oldBooking: originalBooking,
            newBooking,
            message: "Booking rescheduled successfully",
        })
    } catch (error) {
        console.error("Error rescheduling booking:", error)
        return NextResponse.json(
            { error: "Failed to reschedule booking" },
            { status: 500 }
        )
    }
}
