import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { addMinutes, parseISO } from "date-fns"
import { sendBookingConfirmation, sendBookingNotification } from "@/lib/email"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { businessId, serviceId, customer, startTime, timezone } = body

        // 1. Validate inputs
        if (!businessId || !serviceId || !customer || !startTime) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // 2. Get service details
        const service = await prisma.service.findUnique({
            where: { id: serviceId }
        })

        if (!service) {
            return NextResponse.json({ error: "Service not found" }, { status: 404 })
        }

        // 3. Calculate end time
        const start = parseISO(startTime)
        const end = addMinutes(start, service.durationMinutes)

        // 4. Create or find customer
        // Check if customer exists by phone within this business
        let customerRecord = await prisma.customer.findUnique({
            where: {
                businessId_phone: {
                    businessId,
                    phone: customer.phone
                }
            }
        })

        if (!customerRecord) {
            customerRecord = await prisma.customer.create({
                data: {
                    businessId,
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone,
                    notes: customer.notes
                }
            })
        } else {
            // Update info if provided
            await prisma.customer.update({
                where: { id: customerRecord.id },
                data: {
                    name: customer.name,
                    email: customer.email,
                    notes: customer.notes ? `${customerRecord.notes}\n${customer.notes}` : customerRecord.notes
                }
            })
        }

        // 5. Create booking
        const booking = await prisma.booking.create({
            data: {
                businessId,
                serviceId,
                customerId: customerRecord.id,
                startTime: start,
                endTime: end,
                status: "confirmed",
                customerNotes: customer.notes,
                paymentStatus: "pending",
                paymentAmount: service.price
            },
            include: {
                customer: true,
                service: true,
                business: true
            }
        })

        // 6. Send emails (don't fail booking if emails fail)
        try {
            await Promise.all([
                sendBookingConfirmation(booking),
                sendBookingNotification(booking)
            ])
        } catch (emailError) {
            console.error("Failed to send emails:", emailError)
            // Continue anyway - booking is created
        }

        return NextResponse.json({
            success: true,
            id: booking.id,
            message: "Booking confirmed"
        })

    } catch (error) {
        console.error("Booking creation error:", error)
        return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
    }
}
