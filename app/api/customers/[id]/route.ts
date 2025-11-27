import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    try {
        // Fetch customer with all bookings
        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                bookings: {
                    include: {
                        service: {
                            select: {
                                name: true,
                                color: true
                            }
                        }
                    },
                    orderBy: { startTime: 'desc' }
                }
            }
        })

        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 })
        }

        // Verify customer belongs to this business
        const business = await prisma.business.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        })

        if (customer.businessId !== business?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        // Calculate stats
        const now = new Date()
        const stats = {
            totalBookings: customer.bookings.length,
            totalRevenue: customer.bookings
                .filter(b => b.status === 'confirmed' || b.status === 'completed')
                .reduce((sum, b) => sum + Number(b.paymentAmount), 0),
            upcomingBookings: customer.bookings
                .filter(b => new Date(b.startTime) > now && b.status === 'confirmed')
                .length,
            completedBookings: customer.bookings
                .filter(b => b.status === 'completed')
                .length
        }

        return NextResponse.json({
            customer,
            stats
        })
    } catch (error) {
        console.error("Error fetching customer:", error)
        return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 })
    }
}
