import { Metadata } from "next"
import { DashboardClient } from "@/components/dashboard/dashboard-client"
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
    revenue: Number(revenueThisMonth._sum.paymentAmount || 0),
    activeCustomers: activeCustomers,
    growth: Math.round(bookingGrowth * 10) / 10
  }

  // Format today's bookings for display
  const recentBookings = todaysBookings.map(booking => ({
    id: booking.id,
    customerName: booking.customer.name,
    customerEmail: booking.customer.email,
    serviceName: booking.service.name,
    amount: Number(booking.paymentAmount),
    status: booking.status,
    time: format(new Date(booking.startTime), "h:mm a")
  }))

  return (
    <DashboardClient 
      businessId={business.id}
      bookingUrl={bookingUrl}
      stats={stats}
      recentBookings={recentBookings}
    />
  )
}
