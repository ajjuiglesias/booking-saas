"use client"

import { useState } from "react"
import { UserX } from "lucide-react"
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
import { toast } from "sonner"

interface MarkNoShowButtonProps {
  bookingId: string
  onMarked?: () => void
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export function MarkNoShowButton({
  bookingId,
  onMarked,
  variant = "outline",
  size = "sm",
}: MarkNoShowButtonProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleMarkNoShow = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/bookings/${bookingId}/no-show`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to mark as no-show")
      }

      toast.success("Booking marked as no-show")
      setOpen(false)
      
      if (onMarked) {
        onMarked()
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to mark as no-show")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size}>
          <UserX className="h-4 w-4 mr-2" />
          No-Show
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mark as No-Show</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure this customer didn't show up? This will:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Mark the booking as "no-show"</li>
              <li>Increase the customer's no-show count</li>
              <li>Help track unreliable customers</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleMarkNoShow()
            }}
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? "Marking..." : "Mark as No-Show"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
