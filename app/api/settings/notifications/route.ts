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
                emailNotifications: true,
                smsNotifications: true,
                notifyOnNewBooking: true,
                notifyOnCancellation: true,
                notifyOnReschedule: true,
                reminderEmailEnabled: true,
                reminderEmailHours: true,
            }
        })

        if (!business) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 })
        }

        return NextResponse.json(business)
    } catch (error) {
        console.error("Error fetching notification settings:", error)
        return NextResponse.json({ error: "Failed to fetch notification settings" }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const {
            emailNotifications,
            smsNotifications,
            notifyOnNewBooking,
            notifyOnCancellation,
            notifyOnReschedule,
            reminderEmailEnabled,
            reminderEmailHours
        } = body

        // Validate reminder hours
        if (reminderEmailHours !== undefined && (reminderEmailHours < 1 || reminderEmailHours > 168)) {
            return NextResponse.json({ error: "Reminder hours must be between 1 and 168" }, { status: 400 })
        }

        const updatedBusiness = await prisma.business.update({
            where: { email: session.user.email },
            data: {
                emailNotifications: emailNotifications ?? true,
                smsNotifications: smsNotifications ?? false,
                notifyOnNewBooking: notifyOnNewBooking ?? true,
                notifyOnCancellation: notifyOnCancellation ?? true,
                notifyOnReschedule: notifyOnReschedule ?? true,
                reminderEmailEnabled: reminderEmailEnabled ?? true,
                reminderEmailHours: reminderEmailHours ?? 24,
            },
            select: {
                emailNotifications: true,
                smsNotifications: true,
                notifyOnNewBooking: true,
                notifyOnCancellation: true,
                notifyOnReschedule: true,
                reminderEmailEnabled: true,
                reminderEmailHours: true,
            }
        })

        return NextResponse.json(updatedBusiness)
    } catch (error) {
        console.error("Error updating notification settings:", error)
        return NextResponse.json({ error: "Failed to update notification settings" }, { status: 500 })
    }
}
