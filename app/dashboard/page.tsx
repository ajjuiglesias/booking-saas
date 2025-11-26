import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDateRangePicker } from "@/components/dashboard/date-range-picker"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentBookings } from "@/components/dashboard/recent-bookings"
import { BookingUrlCard } from "@/components/dashboard/booking-url-card"
import { Plus } from "lucide-react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, format } from "date-fns"

export const metadata: Metadata = {
  title: "Dashboard - BookingSaaS",
  description: "Overview of your business performance",
}

export default async function DashboardPage() {
  const session = await auth()
  
  // Fetch business data
  const business = await prisma.business.findUnique({
    where: { email: session?.user?.email! },
    select: { id: true, slug: true, name: true }
  })

  if (!business) {
    return <div>Business not found</div>
  }

  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/book/${business.slug}`

  // Calculate date ranges
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const lastMonthStart = startOfMonth(subMonths(now, 1))
  const lastMonthEnd = endOfMonth(subMonths(now, 1))
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)

  // Fetch real stats from database
  const [
    totalBookingsThisMonth,
    totalBookingsLastMonth,
    revenueThisMonth,
    revenueLastMonth,
    activeCustomers,
    todaysBookings
  ] = await Promise.all([
    // Total bookings this month
    prisma.booking.count({
      where: {
        businessId: business.id,
        startTime: { gte: monthStart, lte: monthEnd }
      }
    }),
    // Total bookings last month
    prisma.booking.count({
      where: {
        businessId: business.id,
        startTime: { gte: lastMonthStart, lte: lastMonthEnd }
      }
    }),
    // Revenue this month
    prisma.booking.aggregate({
      where: {
        businessId: business.id,
        startTime: { gte: monthStart, lte: monthEnd },
        status: { in: ['confirmed', 'completed'] }
      },
      _sum: { paymentAmount: true }
    }),
    // Revenue last month
    prisma.booking.aggregate({
      where: {
        businessId: business.id,
        startTime: { gte: lastMonthStart, lte: lastMonthEnd },
        status: { in: ['confirmed', 'completed'] }
      },
      _sum: { paymentAmount: true }
    }),
    // Active customers (unique customers with bookings)
    prisma.customer.count({
      where: {
        businessId: business.id,
        bookings: { some: {} }
      }
    }),
    // Today's bookings
    prisma.booking.findMany({
      where: {
        businessId: business.id,
        startTime: { gte: todayStart, lte: todayEnd }
      },
      include: {
        customer: true,
        service: true
      },
      orderBy: { startTime: 'asc' },
      take: 5
    })
  ])

  // Calculate growth percentage
  const bookingGrowth = totalBookingsLastMonth > 0 
    ? ((totalBookingsThisMonth - totalBookingsLastMonth) / totalBookingsLastMonth) * 100 
    : 0

  const stats = {
    totalBookings: totalBookingsThisMonth,
    revenue: revenueThisMonth._sum.paymentAmount || 0,
    activeCustomers: activeCustomers,
    growth: Math.round(bookingGrowth * 10) / 10
  }

  // Format today's bookings for display
  const recentBookings = todaysBookings.map(booking => ({
    id: booking.id,
    customerName: booking.customer.name,
    customerEmail: booking.customer.email,
    serviceName: booking.service.name,
    amount: booking.paymentAmount,
    status: booking.status,
    time: format(new Date(booking.startTime), "h:mm a")
  }))

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          {/* <CalendarDateRangePicker /> */}
          <Button>
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
          <TabsTrigger value="analytics" disabled>Analytics</TabsTrigger>
          <TabsTrigger value="reports" disabled>Reports</TabsTrigger>
          <TabsTrigger value="notifications" disabled>Notifications</TabsTrigger>
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
                <div className="h-[350px] flex items-center justify-center bg-gray-50 rounded-md border border-dashed">
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
    </div>
  )
}
