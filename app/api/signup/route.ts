import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, generateUniqueSlug } from "@/lib/helpers"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { business, services, availability, bufferMinutes } = body

        // Validate required fields
        if (!business?.name || !business?.email || !business?.password || !business?.category) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            )
        }

        // Parallelize independent operations for better performance
        const [existingBusiness, slug, hashedPassword] = await Promise.all([
            // Check if email already exists
            prisma.business.findUnique({
                where: { email: business.email },
                select: { id: true } // Only select id for faster query
            }),
            // Generate unique slug
            generateUniqueSlug(business.name, async (slug) => {
                const existing = await prisma.business.findUnique({
                    where: { slug },
                    select: { id: true }
                })
                return !!existing
            }),
            // Hash password
            hashPassword(business.password)
        ])

        if (existingBusiness) {
            return NextResponse.json(
                { error: "Email already registered" },
                { status: 400 }
            )
        }

        // Create business with services and availability in a single optimized transaction
        const newBusiness = await prisma.$transaction(async (tx) => {
            // Create business
            const createdBusiness = await tx.business.create({
                data: {
                    name: business.name,
                    slug,
                    email: business.email,
                    password: hashedPassword,
                    category: business.category,
                    timezone: business.timezone || "Asia/Kolkata", // Default to Indian timezone
                    phone: business.phone || null,
                    bufferMinutes: bufferMinutes || 0,
                },
                select: { id: true, slug: true } // Only select needed fields
            })

            // Batch create services and availability in parallel
            const operations = []

            if (services?.length > 0) {
                operations.push(
                    tx.service.createMany({
                        data: services.map((service: any) => ({
                            businessId: createdBusiness.id,
                            name: service.name,
                            description: service.description || null,
                            durationMinutes: service.durationMinutes,
                            price: service.price,
                            isActive: true,
                        })),
                        skipDuplicates: true
                    })
                )
            }

            if (availability?.length > 0) {
                operations.push(
                    tx.availability.createMany({
                        data: availability.map((avail: any) => ({
                            businessId: createdBusiness.id,
                            dayOfWeek: avail.dayOfWeek,
                            startTime: avail.startTime,
                            endTime: avail.endTime,
                            isAvailable: avail.isAvailable,
                        })),
                        skipDuplicates: true
                    })
                )
            }

            // Execute all operations in parallel
            if (operations.length > 0) {
                await Promise.all(operations)
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
        }, {
            status: 201,
            headers: {
                'Cache-Control': 'no-store' // Prevent caching of signup response
            }
        })
    } catch (error: any) {
        // Check for specific Prisma errors
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "Email or slug already exists" },
                { status: 400 }
            )
        }

        // Log error on server side only (not exposed to client)
        console.error("Signup error:", error.message)

        return NextResponse.json(
            { error: "Failed to create account. Please try again." },
            { status: 500 }
        )
    }
}
