import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST - Add tag to customer
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()
        const { tag } = body

        if (!tag) {
            return NextResponse.json({ error: "Tag is required" }, { status: 400 })
        }

        // Verify customer belongs to this business
        const customer = await prisma.customer.findUnique({
            where: { id }
        })

        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 })
        }

        if (customer.businessId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        // Check if customer already has this tag
        if (customer.tags.includes(tag)) {
            return NextResponse.json({ error: "Customer already has this tag" }, { status: 400 })
        }

        // Limit to 10 tags per customer
        if (customer.tags.length >= 10) {
            return NextResponse.json({
                error: "Maximum 10 tags per customer"
            }, { status: 400 })
        }

        // Add tag
        const updated = await prisma.customer.update({
            where: { id },
            data: {
                tags: [...customer.tags, tag]
            }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error("Error adding tag:", error)
        return NextResponse.json({ error: "Failed to add tag" }, { status: 500 })
    }
}
