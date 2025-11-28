"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentBookings } from "@/components/dashboard/recent-bookings"
import { BookingUrlCard } from "@/components/dashboard/booking-url-card"
import { ManualBookingModal } from "@/components/bookings/manual-booking-modal"
import { Plus } from "lucide-react"

interface DashboardClientProps {
  businessId: string
  bookingUrl: string
  stats: {
    totalBookings: number
    revenue: number
    activeCustomers: number
    growth: number
  }
  recentBookings: Array<{
    id: string
    customerName: string
    customerEmail: string
    serviceName: string
    amount: number
    status: string
    time: string
  }>
}

export function DashboardClient({ businessId, bookingUrl, stats, recentBookings }: DashboardClientProps) {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsBookingModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Booking URL Card */}
      <BookingUrlCard bookingUrl={bookingUrl} />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <StatsCards {...stats} />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                {/* Placeholder for chart */}
                <div className="h-[350px] flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-md border border-dashed">
                  <p className="text-muted-foreground">Revenue Chart Placeholder</p>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Today's Bookings</CardTitle>
                <CardDescription>
                  {recentBookings.length === 0 
                    ? "No bookings scheduled for today" 
                    : `You have ${recentBookings.length} booking${recentBookings.length > 1 ? 's' : ''} today`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentBookings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No bookings yet.</p>
                    <p className="text-sm mt-2">Share your booking link to get started!</p>
                  </div>
                ) : (
                  <RecentBookings bookings={recentBookings} />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <ManualBookingModal 
        open={isBookingModalOpen} 
        onOpenChange={setIsBookingModalOpen}
        businessId={businessId}
      />
    </div>
  )
}
