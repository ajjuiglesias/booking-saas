import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, unlink } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "logos")
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Only PNG, JPG, JPEG, WebP, and GIF are allowed." },
                { status: 400 }
            )
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 2MB." },
                { status: 400 }
            )
        }

        // Get file extension
        const ext = file.name.split(".").pop()?.toLowerCase() || "png"

        // Create filename with business ID and timestamp
        const filename = `${session.user.id}-${Date.now()}.${ext}`
        const filepath = path.join(UPLOAD_DIR, filename)

        // Get current business to check for old logo
        const business = await prisma.business.findUnique({
            where: { id: session.user.id },
            select: { logoUrl: true }
        })

        // Delete old logo if exists
        if (business?.logoUrl) {
            const oldLogoPath = path.join(process.cwd(), "public", business.logoUrl)
            if (existsSync(oldLogoPath)) {
                try {
                    await unlink(oldLogoPath)
                } catch (error) {
                    console.error("Failed to delete old logo:", error)
                }
            }
        }

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Ensure upload directory exists
        const fs = require("fs")
        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true })
        }

        await writeFile(filepath, buffer)

        // Update business with new logo URL
        const logoUrl = `/uploads/logos/${filename}`
        await prisma.business.update({
            where: { id: session.user.id },
            data: { logoUrl }
        })

        return NextResponse.json({
            success: true,
            logoUrl
        })
    } catch (error: any) {
        console.error("Logo upload error:", error)
        return NextResponse.json(
            { error: "Failed to upload logo" },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get current business
        const business = await prisma.business.findUnique({
            where: { id: session.user.id },
            select: { logoUrl: true }
        })

        if (!business?.logoUrl) {
            return NextResponse.json({ error: "No logo to remove" }, { status: 404 })
        }

        // Delete logo file
        const logoPath = path.join(process.cwd(), "public", business.logoUrl)
        if (existsSync(logoPath)) {
            try {
                await unlink(logoPath)
            } catch (error) {
                console.error("Failed to delete logo file:", error)
            }
        }

        // Update business to remove logo URL
        await prisma.business.update({
            where: { id: session.user.id },
            data: { logoUrl: null }
        })

        return NextResponse.json({
            success: true,
            message: "Logo removed successfully"
        })
    } catch (error: any) {
        console.error("Logo removal error:", error)
        return NextResponse.json(
            { error: "Failed to remove logo" },
            { status: 500 }
        )
    }
}
