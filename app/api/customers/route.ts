import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get business ID from session
    const business = await prisma.business.findUnique({
        where: { email: session.user.email },
        select: { id: true }
    })

    if (!business) {
        return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const sortBy = searchParams.get("sortBy") || "name"
    const sortOrder = searchParams.get("sortOrder") || "asc"

    try {
        // Build where clause for search
        const whereClause: any = {
            businessId: business.id
        }

        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } }
            ]
        }

        // Get total count for pagination
        const total = await prisma.customer.count({ where: whereClause })

        // Fetch customers with booking count and last booking
        const customers = await prisma.customer.findMany({
            where: whereClause,
            include: {
                _count: {
                    select: { bookings: true }
                },
                bookings: {
                    orderBy: { startTime: 'desc' },
                    take: 1,
                    select: {
                        startTime: true,
                        status: true
                    }
                }
            },
            orderBy: sortBy === 'bookings'
                ? { bookings: { _count: sortOrder as 'asc' | 'desc' } }
                : { [sortBy]: sortOrder },
            skip: (page - 1) * limit,
            take: limit
        })

        // Format response
        const formattedCustomers = customers.map(customer => ({
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            totalBookings: customer._count.bookings,
            lastBooking: customer.bookings[0]?.startTime || null,
            lastBookingStatus: customer.bookings[0]?.status || null,
            createdAt: customer.createdAt
        }))

        return NextResponse.json({
            customers: formattedCustomers,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error("Error fetching customers:", error)
        return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
    }
}
