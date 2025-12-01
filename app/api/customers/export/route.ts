import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Fetch all customers for this business
        const customers = await prisma.customer.findMany({
            where: { businessId: session.user.id },
            orderBy: { name: "asc" },
            select: {
                name: true,
                email: true,
                phone: true,
                tags: true,
                segment: true,
                totalSpent: true,
                totalBookings: true,
                lastBookingDate: true,
                notes: true,
                createdAt: true
            }
        })

        // Generate CSV
        const headers = [
            "Name",
            "Email",
            "Phone",
            "Tags",
            "Segment",
            "Total Spent",
            "Total Bookings",
            "Last Booking",
            "Notes",
            "Created At"
        ]

        const rows = customers.map(customer => [
            customer.name,
            customer.email || "",
            customer.phone,
            customer.tags.join(";"),
            customer.segment || "",
            customer.totalSpent.toString(),
            customer.totalBookings.toString(),
            customer.lastBookingDate?.toISOString() || "",
            customer.notes || "",
            customer.createdAt.toISOString()
        ])

        const csv = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n")

        // Return CSV file
        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="customers-${new Date().toISOString().split('T')[0]}.csv"`
            }
        })
    } catch (error) {
        console.error("Export error:", error)
        return NextResponse.json({ error: "Failed to export customers" }, { status: 500 })
    }
}
