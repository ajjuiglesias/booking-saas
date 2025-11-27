import { Resend } from 'resend'
import { format } from 'date-fns'
import BookingConfirmationEmail from '@/emails/booking-confirmation'
import BookingNotificationEmail from '@/emails/booking-notification'

const resend = new Resend(process.env.RESEND_API_KEY)

interface Booking {
    id: string
    startTime: Date
    endTime: Date
    paymentAmount: number | null
    notes: string | null
    customer: {
        name: string
        email: string | null
        phone: string
    }
    service: {
        name: string
        durationMinutes: number
    }
    business: {
        name: string
        email: string
        phone: string | null
        address: string | null
    }
}

/**
 * Send booking confirmation email to customer
 */
export async function sendBookingConfirmation(booking: Booking) {
    try {
        // Skip if customer has no email
        if (!booking.customer.email) {
            console.log('Skipping confirmation email - customer has no email')
            return { success: true, skipped: true }
        }

        const emailData = {
            from: process.env.EMAIL_FROM || 'noreply@resend.dev',
            to: booking.customer.email,
            subject: `Booking Confirmed - ${booking.service.name} on ${format(booking.startTime, 'MMM d, yyyy')}`,
            react: BookingConfirmationEmail({
                customerName: booking.customer.name,
                businessName: booking.business.name,
                serviceName: booking.service.name,
                date: format(booking.startTime, 'EEEE, MMMM d, yyyy'),
                time: `${format(booking.startTime, 'h:mm a')} - ${format(booking.endTime, 'h:mm a')}`,
                duration: booking.service.durationMinutes,
                price: Number(booking.paymentAmount || 0),
                businessAddress: booking.business.address || undefined,
                businessPhone: booking.business.phone || undefined,
                businessEmail: booking.business.email,
                bookingId: booking.id
            })
        }

        const { data, error } = await resend.emails.send(emailData)

        if (error) {
            console.error('Failed to send booking confirmation:', error)
            return { success: false, error }
        }

        console.log('Booking confirmation sent:', data)
        return { success: true, data }
    } catch (error) {
        console.error('Error sending booking confirmation:', error)
        return { success: false, error }
    }
}

/**
 * Send new booking notification to business
 */
export async function sendBookingNotification(booking: Booking) {
    try {
        const emailData = {
            from: process.env.EMAIL_FROM || 'noreply@resend.dev',
            to: booking.business.email,
            subject: `New Booking: ${booking.customer.name} - ${booking.service.name}`,
            react: BookingNotificationEmail({
                businessName: booking.business.name,
                customerName: booking.customer.name,
                customerEmail: booking.customer.email || undefined,
                customerPhone: booking.customer.phone,
                serviceName: booking.service.name,
                date: format(booking.startTime, 'EEEE, MMMM d, yyyy'),
                time: `${format(booking.startTime, 'h:mm a')} - ${format(booking.endTime, 'h:mm a')}`,
                duration: booking.service.durationMinutes,
                price: Number(booking.paymentAmount || 0),
                notes: booking.notes || undefined,
                bookingId: booking.id
            })
        }

        const { data, error } = await resend.emails.send(emailData)

        if (error) {
            console.error('Failed to send booking notification:', error)
            return { success: false, error }
        }

        console.log('Booking notification sent:', data)
        return { success: true, data }
    } catch (error) {
        console.error('Error sending booking notification:', error)
        return { success: false, error }
    }
}
