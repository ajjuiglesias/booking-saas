import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params

        // Verify tag belongs to this business
        const tag = await prisma.customerTag.findUnique({
            where: { id }
        })

        if (!tag) {
            return NextResponse.json({ error: "Tag not found" }, { status: 404 })
        }

        if (tag.businessId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        // Remove tag from all customers
        const customers = await prisma.customer.findMany({
            where: {
                businessId: session.user.id,
                tags: {
                    has: tag.name
                }
            }
        })

        await Promise.all(
            customers.map(customer =>
                prisma.customer.update({
                    where: { id: customer.id },
                    data: {
                        tags: customer.tags.filter(t => t !== tag.name)
                    }
                })
            )
        )

        // Delete the tag
        await prisma.customerTag.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting tag:", error)
        return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 })
    }
}
