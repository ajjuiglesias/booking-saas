import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/bookings/[id]/check-in
 * Check in a customer via QR scan
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
        paymentMethod: true,
        paymentStatus: true,
        checkedInAt: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Check if already checked in
    if (booking.checkedInAt) {
      return NextResponse.json(
        {
          error: "Already checked in",
          checkedInAt: booking.checkedInAt,
        },
        { status: 400 }
      )
    }

    // Check if booking is cancelled
    if (booking.status === "cancelled" || booking.status === "no_show") {
      return NextResponse.json(
        { error: `Cannot check in: booking is ${booking.status}` },
        { status: 400 }
      )
    }

    // Check if within grace period
    // Allow check-in: from now until 30 minutes AFTER start time
    const now = new Date()
    const startTime = new Date(booking.startTime)
    const gracePeriodEnd = new Date(startTime.getTime() + 30 * 60 * 1000) // 30 min after start

    // Only block if MORE than 30 minutes past the booking time
    if (now > gracePeriodEnd) {
      return NextResponse.json(
        {
          error: "Check-in window has closed (30 minutes past booking time)",
          startTime: booking.startTime,
          gracePeriodEnd,
          currentTime: now,
        },
        { status: 400 }
      )
    }

    const isEarly = now < startTime
    const isLate = now > startTime && now <= gracePeriodEnd

    // Update booking: check in + mark cash as paid
    const updateData: any = {
      status: "checked_in",
      checkedInAt: now,
      checkInMethod: "qr_scan",
    }

    // Auto-mark cash payments as paid on check-in
    if (booking.paymentMethod === "cash" && booking.paymentStatus === "pending") {
      updateData.paymentStatus = "paid"
      updateData.paidAt = now
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        customer: true,
        service: true,
        business: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Checked in successfully",
      booking: updatedBooking,
      isEarly,
      isLate,
      paymentMarkedPaid: booking.paymentMethod === "cash" && booking.paymentStatus === "pending",
    })
  } catch (error) {
    console.error("Error checking in:", error)
    return NextResponse.json(
      { error: "Failed to check in" },
      { status: 500 }
    )
  }
}
