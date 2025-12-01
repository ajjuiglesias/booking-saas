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

    // Pagination
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")

    // Search
    const search = searchParams.get("search") || ""

    // Filters
    const segment = searchParams.get("segment")
    const tags = searchParams.get("tags")?.split(",").filter(Boolean)
    const minSpent = searchParams.get("minSpent")
    const maxSpent = searchParams.get("maxSpent")
    const minBookings = searchParams.get("minBookings")
    const source = searchParams.get("source")

    // Sorting
    const sortBy = searchParams.get("sortBy") || "name"
    const sortOrder = (searchParams.get("sortOrder") || "asc") as "asc" | "desc"

    try {
        // Build where clause
        const whereClause: any = {
            businessId: business.id
        }

        // Search across name, email, phone
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } }
            ]
        }

        // Filter by segment
        if (segment) {
            whereClause.segment = segment
        }

        // Filter by tags (customer must have ALL specified tags)
        if (tags && tags.length > 0) {
            whereClause.tags = {
                hasEvery: tags
            }
        }

        // Filter by spending range
        if (minSpent || maxSpent) {
            whereClause.totalSpent = {}
            if (minSpent) whereClause.totalSpent.gte = parseFloat(minSpent)
            if (maxSpent) whereClause.totalSpent.lte = parseFloat(maxSpent)
        }

        // Filter by booking count
        if (minBookings) {
            whereClause.totalBookings = {
                gte: parseInt(minBookings)
            }
        }

        // Filter by source
        if (source) {
            whereClause.source = source
        }

        // Get total count for pagination
        const total = await prisma.customer.count({ where: whereClause })

        // Build orderBy clause
        let orderBy: any
        if (sortBy === "lastBooking") {
            orderBy = { lastBookingDate: sortOrder }
        } else if (sortBy === "totalSpent") {
            orderBy = { totalSpent: sortOrder }
        } else if (sortBy === "totalBookings") {
            orderBy = { totalBookings: sortOrder }
        } else if (sortBy === "createdAt") {
            orderBy = { createdAt: sortOrder }
        } else {
            orderBy = { name: sortOrder }
        }

        // Fetch customers
        const customers = await prisma.customer.findMany({
            where: whereClause,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                notes: true,
                tags: true,
                segment: true,
                totalSpent: true,
                totalBookings: true,
                lastBookingDate: true,
                source: true,
                noShowCount: true,
                createdAt: true,
                updatedAt: true
            }
        })

        return NextResponse.json({
            customers,
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
