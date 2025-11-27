import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const business = await prisma.business.findUnique({
            where: { email: session.user.email },
            select: {
                name: true,
                email: true,
                phone: true,
                category: true,
                address: true,
                timezone: true,
            }
        })

        if (!business) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 })
        }

        return NextResponse.json(business)
    } catch (error) {
        console.error("Error fetching profile:", error)
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { name, email, phone, category, address, timezone } = body

        // Validate required fields
        if (!name || !email || !category || !timezone) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Check if email is being changed and if it's already taken
        if (email !== session.user.email) {
            const existingBusiness = await prisma.business.findUnique({
                where: { email }
            })
            if (existingBusiness) {
                return NextResponse.json({ error: "Email already in use" }, { status: 400 })
            }
        }

        const updatedBusiness = await prisma.business.update({
            where: { email: session.user.email },
            data: {
                name,
                email,
                phone: phone || null,
                category,
                address: address || null,
                timezone,
            },
            select: {
                name: true,
                email: true,
                phone: true,
                category: true,
                address: true,
                timezone: true,
            }
        })

        return NextResponse.json(updatedBusiness)
    } catch (error) {
        console.error("Error updating profile:", error)
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }
}
