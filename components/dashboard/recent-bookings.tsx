import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
            <Avatar className="h-9 w-9">
              <AvatarImage src={`https://avatar.vercel.sh/${booking.customerEmail}`} alt="Avatar" />
              <AvatarFallback>{booking.customerName[0]}</AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">{booking.customerName}</p>
              <p className="text-sm text-muted-foreground">
                {booking.serviceName}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <div className="text-sm text-muted-foreground">{booking.time}</div>
              <div className="font-medium">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(booking.amount)}
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
