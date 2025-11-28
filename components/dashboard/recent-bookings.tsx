import { Badge } from "@/components/ui/badge"

interface Booking {
  id: string
  customerName: string
  customerEmail: string
  serviceName: string
  amount: number
  status: string
  time: string
}

export function RecentBookings({ bookings }: { bookings: Booking[] }) {
  return (
    <div className="space-y-8">
      {bookings.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No bookings for today yet.</p>
      ) : (
        bookings.map((booking) => (
          <div key={booking.id} className="flex items-center">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">{booking.customerName}</p>
              <p className="text-sm text-muted-foreground">
                {booking.serviceName}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <div className="text-sm text-muted-foreground">{booking.time}</div>
              <div className="font-medium">
                ₹{booking.amount.toFixed(2)}
              </div>
              <Badge 
                variant={
                  booking.status === 'confirmed' ? 'default' : 
                  booking.status === 'completed' ? 'secondary' : 'outline'
                }
                className={
                  booking.status === 'confirmed' ? 'bg-green-500 hover:bg-green-600' : ''
                }
              >
                {booking.status}
              </Badge>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
