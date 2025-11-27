"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, Mail, Phone, DollarSign } from "lucide-react"
import { format } from "date-fns"
import { CancelBookingButton } from "@/components/bookings/cancel-booking-button"

interface BookingDetailModalProps {
  booking: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onBookingUpdated?: () => void
}

export function BookingDetailModal({
  booking,
  open,
  onOpenChange,
  onBookingUpdated,
}: BookingDetailModalProps) {
  if (!booking) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default"
      case "cancelled":
        return "destructive"
      case "completed":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Booking Details</DialogTitle>
          <DialogDescription>
            View and manage this booking
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Service */}
          <div className="flex items-start gap-3">
            <div
              className="w-3 h-3 rounded-full mt-1"
              style={{ backgroundColor: booking.service?.color || "#6366f1" }}
            />
            <div className="flex-1">
              <p className="font-semibold text-lg">{booking.service?.name}</p>
              <Badge variant={getStatusColor(booking.status)} className="mt-1">
                {booking.status}
              </Badge>
            </div>
          </div>

          {/* Date & Time */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(booking.startTime), "EEEE, MMMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span>
                {format(new Date(booking.startTime), "h:mm a")} -{" "}
                {format(new Date(booking.endTime), "h:mm a")}
              </span>
            </div>
          </div>

          {/* Customer */}
          <div className="border-t pt-4 space-y-2">
            <p className="text-sm font-medium text-gray-500">Customer</p>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span>{booking.customer?.name}</span>
            </div>
            {booking.customer?.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{booking.customer.email}</span>
              </div>
            )}
            {booking.customer?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{booking.customer.phone}</span>
              </div>
            )}
          </div>

          {/* Payment */}
          {booking.paymentAmount && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="h-4 w-4" />
                  <span>Amount</span>
                </div>
                <span className="font-semibold">
                  ${Number(booking.paymentAmount).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          {booking.customerNotes && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-600">{booking.customerNotes}</p>
            </div>
          )}

          {/* Actions */}
          {booking.status !== "cancelled" && (
            <div className="border-t pt-4">
              <CancelBookingButton
                bookingId={booking.id}
                onCancelled={() => {
                  onOpenChange(false)
                  if (onBookingUpdated) {
                    onBookingUpdated()
                  }
                }}
                variant="destructive"
                size="default"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
