"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { CheckCircle, Loader2 } from "lucide-react"

interface MarkPaidButtonProps {
  bookingId: string
  onSuccess?: () => void
}

export function MarkPaidButton({ bookingId, onSuccess }: MarkPaidButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleMarkPaid = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/bookings/${bookingId}/mark-paid`, {
        method: "POST",
      })

      if (response.ok) {
        toast.success("Marked as paid")
        onSuccess?.()
      } else {
        throw new Error("Failed to mark as paid")
      }
    } catch (error) {
      toast.error("Failed to mark as paid")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleMarkPaid}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Marking...
        </>
      ) : (
        <>
          <CheckCircle className="h-4 w-4" />
          Mark Paid
        </>
      )}
    </Button>
  )
}
