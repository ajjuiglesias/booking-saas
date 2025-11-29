import { NextResponse } from "next/server"
import { addMinutes, format, setHours, setMinutes } from "date-fns"

export async function GET() {
    const date = new Date("2025-12-01")
    const startTime = "09:00"
    const endTime = "17:00"

    const [startHour, startMinute] = startTime.split(":").map(Number)
    const [endHour, endMinute] = endTime.split(":").map(Number)

    let currentTime = setMinutes(setHours(date, startHour), startMinute)
    const end = setMinutes(setHours(date, endHour), endMinute)
    const now = new Date()

    const slots = []
    let iterations = 0

    while (currentTime < end && iterations < 20) {
        iterations++
        const slotEnd = addMinutes(currentTime, 30)

        if (slotEnd > end) break

        const isPast = currentTime < now

        slots.push({
            time: format(currentTime, "h:mm a"),
            datetime: currentTime.toISOString(),
            isPast,
            available: !isPast
        })

        currentTime = addMinutes(currentTime, 30)
    }

    return NextResponse.json({
        testDate: date.toISOString(),
        now: now.toISOString(),
        startTime: setMinutes(setHours(date, startHour), startMinute).toISOString(),
        endTime: end.toISOString(),
        iterations,
        slotsGenerated: slots.length,
        slots
    })
}
