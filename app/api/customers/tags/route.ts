import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - List all tags for the business
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const tags = await prisma.customerTag.findMany({
            where: { businessId: session.user.id },
            orderBy: { name: "asc" }
        })

        // Get usage count for each tag
        const tagsWithCount = await Promise.all(
            tags.map(async (tag) => {
                const count = await prisma.customer.count({
                    where: {
                        businessId: session.user.id,
                        tags: {
                            has: tag.name
                        }
                    }
                })
                return { ...tag, usageCount: count }
            })
        )

        return NextResponse.json(tagsWithCount)
    } catch (error) {
        console.error("Error fetching tags:", error)
        return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 })
    }
}

// POST - Create a new tag
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { name, color } = body

        if (!name) {
            return NextResponse.json({ error: "Tag name is required" }, { status: 400 })
        }

        // Validate tag name (alphanumeric + spaces only)
        if (!/^[a-zA-Z0-9\s]+$/.test(name)) {
            return NextResponse.json({
                error: "Tag name can only contain letters, numbers, and spaces"
            }, { status: 400 })
        }

        // Check if tag already exists
        const existing = await prisma.customerTag.findUnique({
            where: {
                businessId_name: {
                    businessId: session.user.id,
                    name: name.trim()
                }
            }
        })

        if (existing) {
            return NextResponse.json({ error: "Tag already exists" }, { status: 400 })
        }

        const tag = await prisma.customerTag.create({
            data: {
                businessId: session.user.id,
                name: name.trim(),
                color: color || "#6366f1"
            }
        })

        return NextResponse.json(tag)
    } catch (error) {
        console.error("Error creating tag:", error)
        return NextResponse.json({ error: "Failed to create tag" }, { status: 500 })
    }
}
