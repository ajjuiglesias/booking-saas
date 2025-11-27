import { Booking, Business } from "@prisma/client"

export interface CancellationCheck {
    canCancel: boolean
    reason?: string
    hoursUntilBooking: number
}

/**
 * Check if a booking can be cancelled based on business cancellation policy
 */
export function canCancelBooking(
    booking: Booking,
    business: Business
): CancellationCheck {
    const now = new Date()
    const bookingTime = new Date(booking.startTime)
    const hoursUntilBooking = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    // Cannot cancel past bookings
    if (hoursUntilBooking < 0) {
        return {
            canCancel: false,
            reason: "This booking has already passed",
            hoursUntilBooking: 0
        }
    }

    // Cannot cancel already cancelled bookings
    if (booking.status === "cancelled") {
        return {
            canCancel: false,
            reason: "This booking has already been cancelled",
            hoursUntilBooking
        }
    }

    // Check cancellation policy
    const policy = business.cancellationPolicy || "flexible"
    const requiredHours = business.cancellationHours || 24

    switch (policy) {
        case "flexible":
            return {
                canCancel: true,
                hoursUntilBooking
            }

        case "strict":
            return {
                canCancel: false,
                reason: "This booking cannot be cancelled due to strict cancellation policy",
                hoursUntilBooking
            }

        case "moderate":
            if (hoursUntilBooking >= requiredHours) {
                return {
                    canCancel: true,
                    hoursUntilBooking
                }
            }
            return {
                canCancel: false,
                reason: `Cancellations must be made at least ${requiredHours} hours in advance`,
                hoursUntilBooking
            }

        default:
            return {
                canCancel: true,
                hoursUntilBooking
            }
    }
}

/**
 * Check if a booking can be rescheduled
 */
export function canRescheduleBooking(
    booking: Booking,
    business: Business
): CancellationCheck {
    // Use same logic as cancellation for now
    // In the future, you might have different reschedule policies
    return canCancelBooking(booking, business)
}

/**
 * Get user-friendly policy description
 */
export function getPolicyDescription(business: Business): string {
    const policy = business.cancellationPolicy || "flexible"
    const hours = business.cancellationHours || 24

    switch (policy) {
        case "flexible":
            return "You can cancel or reschedule your booking anytime before your appointment."

        case "strict":
            return "This booking cannot be cancelled or rescheduled."

        case "moderate":
            return `You can cancel or reschedule up to ${hours} hours before your appointment.`

        default:
            return "Please contact us regarding cancellations or rescheduling."
    }
}
