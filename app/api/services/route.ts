import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const services = await prisma.service.findMany({
            where: {
                businessId: session.user.id
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(services)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { name, description, durationMinutes, price, color } = body

        if (!name || !durationMinutes || !price) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const service = await prisma.service.create({
            data: {
                businessId: session.user.id,
                name,
                description,
                durationMinutes: parseInt(durationMinutes),
                price: parseFloat(price),
                color: color || "#6366f1",
                isActive: true
            }
        })

        return NextResponse.json(service)
    } catch (error) {
        console.error("Create service error:", error)
        return NextResponse.json({ error: "Failed to create service" }, { status: 500 })
    }
}
