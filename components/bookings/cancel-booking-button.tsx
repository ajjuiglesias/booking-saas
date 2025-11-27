"use client"

import { useState } from "react"
import { XCircle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface CancelBookingButtonProps {
  bookingId: string
  onCancelled?: () => void
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export function CancelBookingButton({
  bookingId,
  onCancelled,
  variant = "destructive",
  size = "sm",
}: CancelBookingButtonProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleCancel = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cancelledBy: "business",
          reason: reason || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to cancel booking")
      }

      toast.success("Booking cancelled successfully")
      setOpen(false)
      setReason("")
      
      if (onCancelled) {
        onCancelled()
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel booking")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size}>
          <XCircle className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this booking? The customer will be notified via email.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="cancel-reason">Reason for cancellation (optional)</Label>
          <Textarea
            id="cancel-reason"
            placeholder="e.g., Staff unavailable, Emergency closure..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Keep Booking
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleCancel()
            }}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? "Cancelling..." : "Cancel Booking"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
