import { Badge } from "@/components/ui/badge"
import { Clock, IndianRupee } from "lucide-react"

interface Booking {
  id: string
  customerName: string
  customerEmail: string
  serviceName: string
  amount: number
  status: string
  time: string
}

const getStatusConfig = (status: string) => {
  const configs: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string, label: string, icon: string }> = {
    confirmed: { 
      variant: "default", 
      className: "bg-green-100 text-green-800 border-green-300", 
      label: "Confirmed",
      icon: "✓"
    },
    checked_in: { 
      variant: "secondary", 
      className: "bg-blue-100 text-blue-800 border-blue-300", 
      label: "Checked In",
      icon: "✓✓"
    },
    pending_payment: { 
      variant: "outline", 
      className: "bg-yellow-100 text-yellow-800 border-yellow-300", 
      label: "Awaiting Payment",
      icon: "⏳"
    },
    completed: { 
      variant: "secondary", 
      className: "bg-gray-100 text-gray-800 border-gray-300", 
      label: "Completed",
      icon: "✓"
    },
    cancelled: { 
      variant: "destructive", 
      className: "", 
      label: "Cancelled",
      icon: "✕"
    },
    no_show: { 
      variant: "destructive", 
      className: "", 
      label: "No-Show",
      icon: "✕"
    },
  }
  return configs[status] || { variant: "outline" as const, className: "", label: status, icon: "" }
}

export function RecentBookings({ bookings }: { bookings: Booking[] }) {
  return (
    <div className="space-y-4">
      {bookings.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No bookings for today yet.</p>
      ) : (
        bookings.map((booking) => {
          const statusConfig = getStatusConfig(booking.status)
          return (
            <div key={booking.id} className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
              {/* Left: Status Badge */}
              <div className="flex-shrink-0">
                <Badge 
                  variant={statusConfig.variant}
                  className={`${statusConfig.className} font-medium`}
                >
                  {statusConfig.icon && <span className="mr-1">{statusConfig.icon}</span>}
                  {statusConfig.label}
                </Badge>
              </div>

              {/* Middle: Customer & Service Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{booking.customerName}</p>
                <p className="text-xs text-muted-foreground truncate">{booking.serviceName}</p>
              </div>

              {/* Right: Time & Price */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <div className="flex items-center gap-1 text-sm font-medium">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>{booking.time}</span>
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                  <IndianRupee className="h-3 w-3" />
                  <span>{booking.amount.toFixed(0)}</span>
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
