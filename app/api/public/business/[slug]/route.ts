import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params
    try {
        console.log("Looking for business with slug:", slug)
        const business = await prisma.business.findUnique({
            where: { slug: slug },
            select: {
                id: true,
                name: true,
                slug: true,
                category: true,
                phone: true,
                address: true,
                logoUrl: true,
                primaryColor: true,
                bookingMessage: true,
                timezone: true,
                minNoticeHours: true,
                maxAdvanceDays: true
            }
        })

        console.log("Business found:", business ? business.name : "NOT FOUND")

        if (!business) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 })
        }

        const services = await prisma.service.findMany({
            where: {
                businessId: business.id,
                isActive: true
            },
            select: {
                id: true,
                name: true,
                description: true,
                durationMinutes: true,
                price: true
            }
        })

        return NextResponse.json({ business, services })
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch business" }, { status: 500 })
    }
}
