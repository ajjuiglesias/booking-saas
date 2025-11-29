import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const email = searchParams.get('email')

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 })
        }

        const existingBusiness = await prisma.business.findUnique({
            where: { email },
            select: { id: true }
        })

        return NextResponse.json({
            available: !existingBusiness
        })
    } catch (error) {
        return NextResponse.json({ error: "Failed to check email" }, { status: 500 })
    }
}
