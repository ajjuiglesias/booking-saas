import { prisma } from "@/lib/prisma"

/**
 * Update customer LTV and stats when a booking is completed
 */
export async function updateCustomerLTV(customerId: string) {
    try {
        // Get all completed bookings for this customer
        const completedBookings = await prisma.booking.findMany({
            where: {
                customerId,
                status: "completed"
            },
            select: {
                paymentAmount: true,
                startTime: true
            },
            orderBy: {
                startTime: "desc"
            }
        })

        // Calculate total spent
        const totalSpent = completedBookings.reduce(
            (sum, booking) => sum + Number(booking.paymentAmount),
            0
        )

        // Get last booking date
        const lastBookingDate = completedBookings[0]?.startTime || null

        // Update customer
        await prisma.customer.update({
            where: { id: customerId },
            data: {
                totalSpent,
                totalBookings: completedBookings.length,
                lastBookingDate
            }
        })

        // Update segment
        await updateCustomerSegment(customerId)
    } catch (error) {
        console.error("Error updating customer LTV:", error)
    }
}

/**
 * Auto-assign customer segment based on behavior
 */
export async function updateCustomerSegment(customerId: string) {
    try {
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            select: {
                totalSpent: true,
                totalBookings: true,
                lastBookingDate: true,
                createdAt: true
            }
        })

        if (!customer) return

        const now = new Date()
        const daysSinceLastBooking = customer.lastBookingDate
            ? Math.floor((now.getTime() - customer.lastBookingDate.getTime()) / (1000 * 60 * 60 * 24))
            : null

        const daysSinceCreated = Math.floor(
            (now.getTime() - customer.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        )

        let segment: string

        // Determine segment
        if (daysSinceLastBooking && daysSinceLastBooking > 180) {
            segment = "lost"
        } else if (daysSinceLastBooking && daysSinceLastBooking > 90) {
            segment = "at_risk"
        } else if (Number(customer.totalSpent) > 1000 || customer.totalBookings > 20) {
            segment = "vip"
        } else if (customer.totalBookings >= 5) {
            segment = "regular"
        } else if (customer.totalBookings < 5 && daysSinceCreated < 30) {
            segment = "new"
        } else {
            segment = "regular"
        }

        // Update segment
        await prisma.customer.update({
            where: { id: customerId },
            data: { segment }
        })
    } catch (error) {
        console.error("Error updating customer segment:", error)
    }
}

/**
 * Bulk update all customer segments (for cron job)
 */
export async function updateAllCustomerSegments(businessId: string) {
    try {
        const customers = await prisma.customer.findMany({
            where: { businessId },
            select: { id: true }
        })

        await Promise.all(
            customers.map(customer => updateCustomerSegment(customer.id))
        )

        console.log(`Updated segments for ${customers.length} customers`)
    } catch (error) {
        console.error("Error updating all customer segments:", error)
    }
}
