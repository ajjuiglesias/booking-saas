import { prisma } from "@/lib/prisma"
import { updateCustomerLTV } from "@/lib/customer-ltv"

/**
 * Auto-complete past bookings
 * This should be run as a cron job (daily or hourly)
 */
export async function autoCompletePastBookings() {
    try {
        const now = new Date()

        // Find all confirmed bookings that have ended
        const completedBookings = await prisma.booking.findMany({
            where: {
                status: "confirmed",
                endTime: {
                    lt: now,
                },
            },
            select: {
                id: true,
                customerId: true,
            },
        })

        // Update booking status
        await prisma.booking.updateMany({
            where: {
                id: {
                    in: completedBookings.map(b => b.id),
                },
            },
            data: {
                status: "completed",
            },
        })

        // Update customer LTV for each completed booking
        const uniqueCustomerIds = [...new Set(completedBookings.map(b => b.customerId))]
        await Promise.all(
            uniqueCustomerIds.map(customerId => updateCustomerLTV(customerId))
        )

        console.log(`Auto-completed ${completedBookings.length} past bookings and updated ${uniqueCustomerIds.length} customer LTV records`)
        return { success: true, count: completedBookings.length }
    } catch (error) {
        console.error("Error auto-completing bookings:", error)
        return { success: false, error }
    }
}

/**
 * Mark no-show bookings
 * For bookings that passed but customer didn't show up
 */
export async function markNoShow(bookingId: string) {
    try {
        const booking = await prisma.booking.update({
            where: { id: bookingId },
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

        return { success: true, booking }
    } catch (error) {
        console.error("Error marking no-show:", error)
        return { success: false, error }
    }
}
