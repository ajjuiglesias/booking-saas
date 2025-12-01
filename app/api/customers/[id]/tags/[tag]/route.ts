import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; tag: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id, tag } = await params

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

        // Remove tag
        const updated = await prisma.customer.update({
            where: { id },
            data: {
                tags: customer.tags.filter(t => t !== decodeURIComponent(tag))
            }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error("Error removing tag:", error)
        return NextResponse.json({ error: "Failed to remove tag" }, { status: 500 })
    }
}
