import { format, parse, addMinutes, startOfDay, endOfDay, isWithinInterval, isBefore, isAfter, addDays } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

/**
 * Format a date to a specific format
 */
export function formatDate(date: Date | string, formatStr: string = 'PPP'): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return format(d, formatStr)
}

/**
 * Format time to HH:mm
 */
export function formatTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return format(d, 'HH:mm')
}

/**
 * Parse time string (HH:mm) to minutes since midnight
 */
export function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
}

/**
 * Convert minutes since midnight to time string (HH:mm)
 */
export function minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Convert date to specific timezone
 */
export function toTimezone(date: Date, timezone: string): Date {
    return toZonedTime(date, timezone)
}

/**
 * Convert date from specific timezone to UTC
 */
export function fromTimezone(date: Date, timezone: string): Date {
    return fromZonedTime(date, timezone)
}

/**
 * Check if a time slot overlaps with existing bookings
 */
export function hasTimeOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
): boolean {
    return (
        (start1 < end2 && end1 > start2) ||
        (start2 < end1 && end2 > start1)
    )
}

/**
 * Generate time slots for a given date
 */
export interface TimeSlot {
    time: string
    datetime: Date
    available: boolean
}

export interface GenerateTimeSlotsParams {
    date: Date
    startTime: string // "09:00"
    endTime: string // "17:00"
    durationMinutes: number
    bufferMinutes?: number
    existingBookings?: Array<{ startTime: Date; endTime: Date }>
    timezone?: string
    minNoticeHours?: number
}

export function generateTimeSlots({
    date,
    startTime,
    endTime,
    durationMinutes,
    bufferMinutes = 0,
    existingBookings = [],
    timezone = 'America/New_York',
    minNoticeHours = 2,
}: GenerateTimeSlotsParams): TimeSlot[] {
    const slots: TimeSlot[] = []
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)
    const slotDuration = durationMinutes + bufferMinutes

    // Get current time in the business timezone
    const now = new Date()
    const minBookingTime = addMinutes(now, minNoticeHours * 60)

    // Create slots every 15 minutes
    for (let minutes = startMinutes; minutes + durationMinutes <= endMinutes; minutes += 15) {
        const timeStr = minutesToTime(minutes)

        // Create datetime for this slot
        const slotDate = new Date(date)
        const [hours, mins] = timeStr.split(':').map(Number)
        slotDate.setHours(hours, mins, 0, 0)

        const slotStart = slotDate
        const slotEnd = addMinutes(slotStart, durationMinutes)

        // Check if slot is in the past or within minimum notice period
        if (isBefore(slotStart, minBookingTime)) {
            continue
        }

        // Check if slot overlaps with existing bookings
        const isBooked = existingBookings.some(booking =>
            hasTimeOverlap(slotStart, slotEnd, booking.startTime, booking.endTime)
        )

        slots.push({
            time: timeStr,
            datetime: slotStart,
            available: !isBooked,
        })
    }

    return slots
}

/**
 * Get day of week (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeek(date: Date): number {
    return date.getDay()
}

/**
 * Check if date is within allowed booking window
 */
export function isWithinBookingWindow(
    date: Date,
    maxAdvanceDays: number
): boolean {
    const now = new Date()
    const maxDate = addDays(now, maxAdvanceDays)
    return isWithinInterval(date, { start: now, end: maxDate })
}

/**
 * Format duration in minutes to human readable string
 */
export function formatDuration(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) {
        return `${hours} hr${hours > 1 ? 's' : ''}`
    }
    return `${hours} hr${hours > 1 ? 's' : ''} ${mins} min`
}
