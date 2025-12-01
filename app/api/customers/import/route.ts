import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface ImportRow {
    name: string
    email?: string
    phone: string
    tags?: string
    notes?: string
}

interface ImportResult {
    success: boolean
    imported: number
    updated: number
    skipped: number
    errors: Array<{ row: number; error: string }>
}

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
        if (!file.name.endsWith(".csv")) {
            return NextResponse.json({ error: "File must be a CSV" }, { status: 400 })
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "File too large. Maximum size is 5MB" }, { status: 400 })
        }

        // Read and parse CSV
        const text = await file.text()
        const lines = text.split("\n").filter(line => line.trim())

        if (lines.length === 0) {
            return NextResponse.json({ error: "CSV file is empty" }, { status: 400 })
        }

        // Validate row count (max 1000)
        if (lines.length > 1001) { // 1 header + 1000 rows
            return NextResponse.json({
                error: "Too many rows. Maximum 1000 customers per import"
            }, { status: 400 })
        }

        // Parse header
        const header = lines[0].split(",").map(h => h.trim().toLowerCase())
        const requiredFields = ["name", "phone"]
        const missingFields = requiredFields.filter(f => !header.includes(f))

        if (missingFields.length > 0) {
            return NextResponse.json({
                error: `Missing required fields: ${missingFields.join(", ")}`
            }, { status: 400 })
        }

        const result: ImportResult = {
            success: true,
            imported: 0,
            updated: 0,
            skipped: 0,
            errors: []
        }

        // Process each row
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line) continue

            try {
                // Parse CSV row (simple parser - doesn't handle quoted commas)
                const values = line.split(",").map(v => v.trim())
                const row: any = {}

                header.forEach((field, index) => {
                    row[field] = values[index] || ""
                })

                // Validate required fields
                if (!row.name || !row.phone) {
                    result.errors.push({
                        row: i + 1,
                        error: "Missing name or phone"
                    })
                    result.skipped++
                    continue
                }

                // Validate phone format (basic validation)
                const phone = row.phone.replace(/[^\d]/g, "")
                if (phone.length < 10) {
                    result.errors.push({
                        row: i + 1,
                        error: "Invalid phone number"
                    })
                    result.skipped++
                    continue
                }

                // Parse tags
                const tags = row.tags
                    ? row.tags.split(";").map((t: string) => t.trim()).filter(Boolean)
                    : []

                // Check if customer exists
                const existing = await prisma.customer.findFirst({
                    where: {
                        businessId: session.user.id,
                        phone: row.phone
                    }
                })

                if (existing) {
                    // Update existing customer
                    await prisma.customer.update({
                        where: { id: existing.id },
                        data: {
                            name: row.name,
                            email: row.email || existing.email,
                            notes: row.notes || existing.notes,
                            tags: [...new Set([...existing.tags, ...tags])], // Merge tags
                            source: "csv_import"
                        }
                    })
                    result.updated++
                } else {
                    // Create new customer
                    await prisma.customer.create({
                        data: {
                            businessId: session.user.id,
                            name: row.name,
                            email: row.email || null,
                            phone: row.phone,
                            notes: row.notes || null,
                            tags,
                            source: "csv_import"
                        }
                    })
                    result.imported++
                }
            } catch (error: any) {
                result.errors.push({
                    row: i + 1,
                    error: error.message || "Unknown error"
                })
                result.skipped++
            }
        }

        return NextResponse.json(result)
    } catch (error: any) {
        console.error("CSV import error:", error)
        return NextResponse.json({
            error: "Failed to import CSV"
        }, { status: 500 })
    }
}
