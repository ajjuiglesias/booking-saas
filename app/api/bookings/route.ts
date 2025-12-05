import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay, parseISO } from "date-fns"

export async function GET(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const start = searchParams.get("start")
    const end = searchParams.get("end")
    const statusFilter = searchParams.get("status") // upcoming, completed, cancelled, all
    const futureOnly = searchParams.get("futureOnly") === "true" // For calendar view

    if (!start || !end) {
        return NextResponse.json({ error: "Start and end dates required" }, { status: 400 })
    }

    try {
        const now = new Date()

        // Build where clause
        const where: any = {
            businessId: session.user.id,
            startTime: {
                gte: parseISO(start),
                lte: parseISO(end)
            }
        }

        // Add status filter
        if (statusFilter === "upcoming") {
            where.status = { in: ["confirmed", "checked_in", "pending"] }
            where.startTime = { gte: now }
        } else if (statusFilter === "completed") {
            where.status = "completed"
        } else if (statusFilter === "cancelled") {
            where.status = "cancelled"
        } else if (statusFilter === "no_show") {
            where.status = "no_show"
        } else if (futureOnly) {
            // For calendar - show only future bookings
            where.startTime = {
                gte: now,
                lte: parseISO(end)
            }
            where.status = { in: ["confirmed", "checked_in", "pending"] }
        }

        const bookings = await prisma.booking.findMany({
            where,
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    }
                },
                service: {
                    select: {
                        id: true,
                        name: true,
                        color: true,
                        price: true,
                        durationMinutes: true,
                    }
                },
            },
            orderBy: {
                startTime: "asc"
            }
        })

        return NextResponse.json(bookings)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }


    try {
        const body = await request.json()
        const { serviceId, startTime, customerName, customerEmail, customerPhone, notes, status = "pending" } = body

        // Validate required fields
        if (!serviceId || !startTime || !customerName || !customerEmail) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Get service details
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            select: {
                durationMinutes: true,
                price: true,
                name: true,
                businessId: true
            }
        })

        if (!service || service.businessId !== session.user.id) {
            return NextResponse.json({ error: "Service not found" }, { status: 404 })
        }

        // Calculate end time
        const start = new Date(startTime)
        const end = new Date(start.getTime() + service.durationMinutes * 60000)

        // Smart customer matching to prevent duplicates
        // Priority: 1. Email match, 2. Phone match, 3. Create new

        // First, try to find by email
        let customer = await prisma.customer.findFirst({
            where: {
                businessId: session.user.id,
                email: customerEmail
            }
        })

        if (customer) {
            // Found by email - update name and phone if changed
            const needsUpdate =
                customer.name !== customerName ||
                customer.phone !== (customerPhone || null)

            if (needsUpdate) {
                customer = await prisma.customer.update({
                    where: { id: customer.id },
                    data: {
                        name: customerName,
                        phone: customerPhone || null
                    }
                })
            }
        } else if (customerPhone) {
            // Not found by email, try phone (if provided)
            customer = await prisma.customer.findFirst({
                where: {
                    businessId: session.user.id,
                    phone: customerPhone
                }
            })

            if (customer) {
                // Found by phone - update name and email
                customer = await prisma.customer.update({
                    where: { id: customer.id },
                    data: {
                        name: customerName,
                        email: customerEmail
                    }
                })
            }
        }

        // If still not found, create new customer
        if (!customer) {
            customer = await prisma.customer.create({
                data: {
                    businessId: session.user.id,
                    name: customerName,
                    email: customerEmail,
                    phone: customerPhone || null
                }
            })
        }

        // Create booking
        const booking = await prisma.booking.create({
            data: {
                businessId: session.user.id,
                serviceId,
                customerId: customer.id,
                startTime: start,
                endTime: end,
                status,
                customerNotes: notes || null,
                internalNotes: body.internalNotes || null, // Staff-only notes
                paymentAmount: service.price,
                paymentStatus: "pending",
                paymentMethod: body.paymentMethod || "cash", // Default to cash for manual bookings
            },
            include: {
                service: true,
                customer: true
            }
        })

        // Send confirmation email (only if sendConfirmation is true)
        const sendConfirmation = body.sendConfirmation !== false // Default to true if not specified

        if (sendConfirmation) {
            try {
                const business = await prisma.business.findUnique({
                    where: { id: session.user.id },
                    select: { name: true, email: true }
                })

                if (business) {
                    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-email`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            type: "booking-confirmation",
                            to: customerEmail,
                            booking: {
                                id: booking.id,
                                customerName,
                                serviceName: service.name,
                                startTime: start.toISOString(),
                                endTime: end.toISOString(),
                                businessName: business.name,
                                businessEmail: business.email
                            }
                        })
                    })
                }
            } catch (emailError) {
                console.error("Failed to send confirmation email:", emailError)
                // Don't fail the booking if email fails
            }
        }

        return NextResponse.json(booking, { status: 201 })
    } catch (error) {
        console.error("Booking creation error:", error)
        return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
    }
}
