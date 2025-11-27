"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Mail, Phone, Calendar, DollarSign, CheckCircle, Clock } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

interface CustomerDetailModalProps {
  customerId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onBookingCreated?: () => void
}

interface Booking {
  id: string
  startTime: string
  endTime: string
  status: string
  paymentAmount: number | null
  service: {
    name: string
    color: string | null
  }
}

interface CustomerData {
  id: string
  name: string
  email: string | null
  phone: string
  notes: string | null
  createdAt: string
  bookings: Booking[]
}

interface Stats {
  totalBookings: number
  totalRevenue: number
  upcomingBookings: number
  completedBookings: number
}

export function CustomerDetailModal({ 
  customerId, 
  open, 
  onOpenChange,
  onBookingCreated 
}: CustomerDetailModalProps) {
  const [customer, setCustomer] = useState<CustomerData | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (open && customerId) {
      fetchCustomerDetails()
    }
  }, [open, customerId])

  const fetchCustomerDetails = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/customers/${customerId}`)
      if (response.ok) {
        const data = await response.json()
        setCustomer(data.customer)
        setStats(data.stats)
      } else {
        toast.error("Failed to load customer details")
      }
    } catch (error) {
      toast.error("Failed to load customer details")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'confirmed':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customer Details</DialogTitle>
          <DialogDescription>
            View customer information and booking history
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : customer && stats ? (
          <div className="space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Name:</span>
                  <span>{customer.name}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Customer since {format(new Date(customer.createdAt), "MMM d, yyyy")}</span>
                </div>
                {customer.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-1">Notes:</p>
                    <p className="text-sm text-muted-foreground">{customer.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalBookings}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${stats.totalRevenue.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.upcomingBookings}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completedBookings}</div>
                </CardContent>
              </Card>
            </div>

            {/* Booking History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Booking History</CardTitle>
                <CardDescription>
                  {customer.bookings.length} total booking{customer.bookings.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {customer.bookings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No bookings yet
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Service</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customer.bookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: booking.service.color || '#6366f1' }}
                                />
                                <span className="font-medium">{booking.service.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{format(new Date(booking.startTime), "MMM d, yyyy")}</div>
                                <div className="text-muted-foreground">
                                  {format(new Date(booking.startTime), "h:mm a")} - {format(new Date(booking.endTime), "h:mm a")}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>${Number(booking.paymentAmount || 0).toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(booking.status)}>
                                {booking.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {/* Quick booking button - to be implemented */}
              {/* <Button onClick={() => {}}>
                <Calendar className="mr-2 h-4 w-4" />
                Create Booking
              </Button> */}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Customer not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
