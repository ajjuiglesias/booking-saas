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
                primaryColor: true,
                logoUrl: true,
            }
        })

        if (!business) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 })
        }

        return NextResponse.json(business)
    } catch (error) {
        console.error("Error fetching appearance settings:", error)
        return NextResponse.json({ error: "Failed to fetch appearance settings" }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { primaryColor, logoUrl } = body

        // Validate color format
        if (primaryColor && !/^#[0-9A-F]{6}$/i.test(primaryColor)) {
            return NextResponse.json({ error: "Invalid color format" }, { status: 400 })
        }

        const updatedBusiness = await prisma.business.update({
            where: { email: session.user.email },
            data: {
                ...(primaryColor && { primaryColor }),
                ...(logoUrl !== undefined && { logoUrl: logoUrl || null }),
            },
            select: {
                primaryColor: true,
                logoUrl: true,
            }
        })

        return NextResponse.json(updatedBusiness)
    } catch (error) {
        console.error("Error updating appearance:", error)
        return NextResponse.json({ error: "Failed to update appearance" }, { status: 500 })
    }
}
