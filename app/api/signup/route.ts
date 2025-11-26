import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, generateUniqueSlug } from "@/lib/helpers"

export async function POST(request: NextRequest) {
    console.log("=== SIGNUP API CALLED ===")
    try {
        console.log("Parsing request body...")
        const body = await request.json()
        console.log("Request body parsed successfully:", JSON.stringify(body, null, 2))
        const { business, services, availability, bufferMinutes } = body

        // Validate required fields
        if (!business?.name || !business?.email || !business?.password || !business?.category) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            )
        }

        // Check if email already exists
        const existingBusiness = await prisma.business.findUnique({
            where: { email: business.email },
        })

        if (existingBusiness) {
            return NextResponse.json(
                { error: "Email already registered" },
                { status: 400 }
            )
        }

        // Generate unique slug
        const slug = await generateUniqueSlug(business.name, async (slug) => {
            const existing = await prisma.business.findUnique({ where: { slug } })
            return !!existing
        })

        // Hash password
        console.log("Hashing password...")
        const hashedPassword = await hashPassword(business.password)
        console.log("Password hashed")

        // Create business with services and availability in a transaction
        console.log("Starting transaction...")
        const newBusiness = await prisma.$transaction(async (tx: typeof prisma) => {
            // Create business
            const createdBusiness = await tx.business.create({
                data: {
                    name: business.name,
                    slug,
                    email: business.email,
                    password: hashedPassword,
                    category: business.category,
                    timezone: business.timezone || "America/New_York",
                    phone: business.phone || null,
                    bufferMinutes: bufferMinutes || 0,
                },
            })

            // Create services
            if (services && services.length > 0) {
                await tx.service.createMany({
                    data: services.map((service: any) => ({
                        businessId: createdBusiness.id,
                        name: service.name,
                        description: service.description || null,
                        durationMinutes: service.durationMinutes,
                        price: service.price,
                        isActive: true,
                    })),
                })
            }

            // Create availability
            if (availability && availability.length > 0) {
                await tx.availability.createMany({
                    data: availability.map((avail: any) => ({
                        businessId: createdBusiness.id,
                        dayOfWeek: avail.dayOfWeek,
                        startTime: avail.startTime,
                        endTime: avail.endTime,
                        isAvailable: avail.isAvailable,
                    })),
                })
            }

            return createdBusiness
        })

        // Generate booking URL
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        const bookingUrl = `${appUrl}/book/${slug}`

        return NextResponse.json({
            success: true,
            businessId: newBusiness.id,
            slug: newBusiness.slug,
            bookingUrl,
        })
    } catch (error: any) {
        console.error("Signup error details:", error)
        // Check for specific Prisma errors
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "Email or slug already exists" },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: error.message || "Failed to create account. Please try again." },
            { status: 500 }
        )
    }
}
