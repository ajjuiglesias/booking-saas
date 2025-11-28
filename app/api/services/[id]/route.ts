import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { id } = await params
        const body = await request.json()
        const { name, description, durationMinutes, price, color, isActive } = body

        // Verify ownership
        const existingService = await prisma.service.findUnique({
            where: { id }
        })

        if (!existingService || existingService.businessId !== session.user.id) {
            return NextResponse.json({ error: "Service not found" }, { status: 404 })
        }

        const service = await prisma.service.update({
            where: { id },
            data: {
                name,
                description,
                durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
                price: price ? parseFloat(price) : undefined,
                color,
                isActive
            }
        })

        return NextResponse.json(service)
    } catch (error) {
        return NextResponse.json({ error: "Failed to update service" }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { id } = await params

        // Verify ownership
        const existingService = await prisma.service.findUnique({
            where: { id }
        })

        if (!existingService || existingService.businessId !== session.user.id) {
            return NextResponse.json({ error: "Service not found" }, { status: 404 })
        }

        await prisma.service.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete service" }, { status: 500 })
    }
}
