import { prisma } from "@/lib/prisma"

/**
 * Auto-complete past bookings
 * This should be run as a cron job (daily or hourly)
 */
export async function autoCompletePastBookings() {
    try {
        const now = new Date()

        // Find all confirmed bookings that have ended
        const result = await prisma.booking.updateMany({
            where: {
                status: "confirmed",
                endTime: {
                    lt: now,
                },
            },
            data: {
                status: "completed",
            },
        })

        console.log(`Auto-completed ${result.count} past bookings`)
        return { success: true, count: result.count }
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
