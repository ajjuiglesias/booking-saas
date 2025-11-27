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

/**
 * Send booking cancellation email to customer
 */
export async function sendBookingCancellationEmail(params: {
    to: string
    booking: any
    business: any
    service: any
    cancelledBy: string
}) {
    try {
        if (!params.to || !params.to.includes('@')) {
            console.log('Skipping cancellation email - invalid email')
            return { success: true, skipped: true }
        }

        const emailData = {
            from: process.env.EMAIL_FROM || 'noreply@resend.dev',
            to: params.to,
            subject: `Booking Cancelled - ${params.business.name}`,
            html: `
                <h2>Booking Cancelled</h2>
                <p>Your booking has been cancelled.</p>
                <p><strong>Service:</strong> ${params.service.name}</p>
                <p><strong>Date:</strong> ${format(new Date(params.booking.startTime), 'EEEE, MMMM d, yyyy')}</p>
                <p><strong>Time:</strong> ${format(new Date(params.booking.startTime), 'h:mm a')}</p>
                <p><strong>Cancelled by:</strong> ${params.cancelledBy}</p>
                <p>If you have any questions, please contact ${params.business.name}.</p>
            `
        }

        const { data, error } = await resend.emails.send(emailData)
        return error ? { success: false, error } : { success: true, data }
    } catch (error) {
        console.error('Error sending cancellation email:', error)
        return { success: false, error }
    }
}

/**
 * Send cancellation notification to business
 */
export async function sendBusinessCancellationNotification(params: {
    to: string
    booking: any
    customer: any
    service: any
    cancelledBy: string
    reason?: string
}) {
    try {
        const emailData = {
            from: process.env.EMAIL_FROM || 'noreply@resend.dev',
            to: params.to,
            subject: `Booking Cancelled - ${params.customer.name}`,
            html: `
                <h2>Booking Cancelled</h2>
                <p><strong>Customer:</strong> ${params.customer.name}</p>
                <p><strong>Service:</strong> ${params.service.name}</p>
                <p><strong>Date:</strong> ${format(new Date(params.booking.startTime), 'EEEE, MMMM d, yyyy')}</p>
                <p><strong>Time:</strong> ${format(new Date(params.booking.startTime), 'h:mm a')}</p>
                <p><strong>Cancelled by:</strong> ${params.cancelledBy}</p>
                ${params.reason ? `<p><strong>Reason:</strong> ${params.reason}</p>` : ''}
            `
        }

        const { data, error } = await resend.emails.send(emailData)
        return error ? { success: false, error } : { success: true, data }
    } catch (error) {
        console.error('Error sending business cancellation notification:', error)
        return { success: false, error }
    }
}

/**
 * Send booking rescheduled email to customer
 */
export async function sendBookingRescheduledEmail(params: {
    to: string
    oldBooking: any
    newBooking: any
    business: any
    service: any
}) {
    try {
        if (!params.to || !params.to.includes('@')) {
            console.log('Skipping reschedule email - invalid email')
            return { success: true, skipped: true }
        }

        const emailData = {
            from: process.env.EMAIL_FROM || 'noreply@resend.dev',
            to: params.to,
            subject: `Booking Rescheduled - ${params.business.name}`,
            html: `
                <h2>Booking Rescheduled</h2>
                <p>Your booking has been rescheduled.</p>
                <p><strong>Service:</strong> ${params.service.name}</p>
                <p><strong>Old Date:</strong> ${format(new Date(params.oldBooking.startTime), 'EEEE, MMMM d, yyyy at h:mm a')}</p>
                <p><strong>New Date:</strong> ${format(new Date(params.newBooking.startTime), 'EEEE, MMMM d, yyyy at h:mm a')}</p>
                <p>If you need to make changes, please contact ${params.business.name}.</p>
            `
        }

        const { data, error } = await resend.emails.send(emailData)
        return error ? { success: false, error } : { success: true, data }
    } catch (error) {
        console.error('Error sending reschedule email:', error)
        return { success: false, error }
    }
}

/**
 * Send reschedule notification to business
 */
export async function sendBusinessRescheduleNotification(params: {
    to: string
    oldBooking: any
    newBooking: any
    customer: any
    service: any
}) {
    try {
        const emailData = {
            from: process.env.EMAIL_FROM || 'noreply@resend.dev',
            to: params.to,
            subject: `Booking Rescheduled - ${params.customer.name}`,
            html: `
                <h2>Booking Rescheduled</h2>
                <p><strong>Customer:</strong> ${params.customer.name}</p>
                <p><strong>Service:</strong> ${params.service.name}</p>
                <p><strong>Old Date:</strong> ${format(new Date(params.oldBooking.startTime), 'EEEE, MMMM d, yyyy at h:mm a')}</p>
                <p><strong>New Date:</strong> ${format(new Date(params.newBooking.startTime), 'EEEE, MMMM d, yyyy at h:mm a')}</p>
            `
        }

        const { data, error } = await resend.emails.send(emailData)
        return error ? { success: false, error } : { success: true, data }
    } catch (error) {
        console.error('Error sending business reschedule notification:', error)
        return { success: false, error }
    }
}
