import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { updateAllCustomerSegments } from "@/lib/customer-ltv"

/**
 * Manually trigger segment update for all customers
 * Useful for fixing existing customers without segments
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const businessId = session.user.id

        // Update all customer segments
        await updateAllCustomerSegments(businessId)

        return NextResponse.json({
            success: true,
            message: "Customer segments updated successfully"
        })
    } catch (error) {
        console.error("Error updating customer segments:", error)
        return NextResponse.json(
            { error: "Failed to update customer segments" },
            { status: 500 }
        )
    }
}
