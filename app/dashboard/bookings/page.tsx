"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar, Clock, User, Filter } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CancelBookingButton } from "@/components/bookings/cancel-booking-button"
import { MarkNoShowButton } from "@/components/bookings/mark-noshow-button"
import { MarkPaidButton } from "@/components/bookings/mark-paid-button"
import { TableSkeleton } from "@/components/ui/skeletons"
import { EmptyState } from "@/components/ui/empty-state"

interface Booking {
  id: string
  startTime: string
  endTime: string
  status: string
  customer: {
    name: string
    email: string | null
    phone: string
  }
  service: {
    name: string
    color: string | null
  }
  paymentAmount: any
  paymentStatus: string
  paymentMethod: string | null
  checkedInAt: string | null
}

export default function BookingHistoryPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("upcoming")

  useEffect(() => {
    fetchBookings(activeTab)
  }, [activeTab])

  const fetchBookings = async (status: string) => {
    setIsLoading(true)
    try {
      // Get date range (last 6 months to next 6 months)
      const start = new Date()
      start.setMonth(start.getMonth() - 6)
      const end = new Date()
      end.setMonth(end.getMonth() + 6)

      const params = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString(),
        status: status,
      })

      const response = await fetch(`/api/bookings?${params}`)
      if (response.ok) {
        const data = await response.json()
        setBookings(data)
      }
    } catch (error) {
      console.error("Failed to load bookings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      confirmed: "default", // Blue - confirmed but not checked in yet
      checked_in: "secondary", // Gray - customer has arrived
      pending: "outline",
      pending_payment: "outline", // Outline - waiting for payment
      completed: "secondary", // Gray - service completed
      cancelled: "destructive", // Red - cancelled
      no_show: "destructive", // Red - no show
    }

    const labels: Record<string, string> = {
      confirmed: "Confirmed",
      checked_in: "✓ Checked In",
      pending: "Pending",
      pending_payment: "⏳ Awaiting Payment",
      completed: "Completed",
      cancelled: "Cancelled",
      no_show: "No-Show",
    }

    // Custom styling for specific statuses
    const customClass: Record<string, string> = {
      checked_in: "bg-blue-100 text-blue-800 border-blue-300",
      pending_payment: "bg-yellow-100 text-yellow-800 border-yellow-300",
      confirmed: "bg-green-100 text-green-800 border-green-300",
    }

    return (
      <Badge 
        variant={variants[status] || "outline"}
        className={customClass[status] || ""}
      >
        {labels[status] || status.toUpperCase()}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Booking History</h2>
        <p className="text-muted-foreground">
          View and manage all your bookings
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          <TabsTrigger value="no_show">No-Shows</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === "upcoming" && "Upcoming Bookings"}
                {activeTab === "completed" && "Completed Bookings"}
                {activeTab === "cancelled" && "Cancelled Bookings"}
                {activeTab === "no_show" && "No-Show Bookings"}
                {activeTab === "all" && "All Bookings"}
              </CardTitle>
              <CardDescription>
                {bookings.length} booking{bookings.length !== 1 ? "s" : ""} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableSkeleton rows={5} />
                  </TableBody>
                </Table>
              ) : bookings.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No bookings found"
                  description={
                    activeTab === "upcoming"
                      ? "You don't have any upcoming bookings."
                      : activeTab === "completed"
                      ? "You haven't completed any bookings yet."
                      : activeTab === "cancelled"
                      ? "You don't have any cancelled bookings."
                      : activeTab === "no_show"
                      ? "You don't have any no-show bookings."
                      : "No bookings found matching your criteria."
                  }
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{booking.customer.name}</p>
                            <p className="text-sm text-gray-500">
                              {booking.customer.email || booking.customer.phone}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: booking.service.color || "#6366f1" }}
                            />
                            {booking.service.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {format(new Date(booking.startTime), "MMM d, yyyy")}
                            </p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(booking.startTime), "h:mm a")} -{" "}
                              {format(new Date(booking.endTime), "h:mm a")}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge 
                              variant={
                                booking.paymentStatus === 'paid' ? 'default' : 
                                booking.paymentStatus === 'failed' ? 'destructive' : 
                                booking.paymentStatus === 'refunded' ? 'secondary' : 
                                'outline'
                              }
                            >
                              {booking.paymentStatus?.toUpperCase() || 'PENDING'}
                            </Badge>
                            {booking.paymentMethod && (
                              <span className="text-xs text-muted-foreground">
                                {booking.paymentMethod === 'online' ? '💳 Online' : '💵 Cash'}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {booking.paymentAmount
                            ? `$${Number(booking.paymentAmount).toFixed(2)}`
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {/* Mark Paid button for pending cash payments */}
                            {booking.paymentMethod === 'cash' && booking.paymentStatus === 'pending' && (
                              <MarkPaidButton
                                bookingId={booking.id}
                                onSuccess={() => fetchBookings(activeTab)}
                              />
                            )}
                            
                            {booking.status === "confirmed" && (
                              <CancelBookingButton
                                bookingId={booking.id}
                                onCancelled={() => fetchBookings(activeTab)}
                                variant="ghost"
                                size="sm"
                              />
                            )}
                            {booking.status === "completed" && (
                              <MarkNoShowButton
                                bookingId={booking.id}
                                onMarked={() => fetchBookings(activeTab)}
                                variant="ghost"
                                size="sm"
                              />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
