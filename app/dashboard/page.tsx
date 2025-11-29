import { Metadata } from "next"
import { DashboardClient } from "@/components/dashboard/dashboard-client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, format, addDays } from "date-fns"

export const metadata: Metadata = {
  title: "Dashboard - BookingSaaS",
  description: "Overview of your business performance",
}

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user?.email) {
    return <div>Not authenticated</div>
  }
  
  // Fetch business data using email to ensure correct business
  const business = await prisma.business.findUnique({
    where: { email: session.user.email },
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
  
  // For today's bookings, we need to account for timezone
  // Get bookings for today and tomorrow to catch all timezone variations
  const todayStart = startOfDay(now)
  const tomorrowEnd = endOfDay(addDays(now, 1))

  // Fetch real stats from database
  const [
    totalBookingsThisMonth,
    totalBookingsLastMonth,
    totalBookingsAllTime,
    revenueThisMonth,
    revenueLastMonth,
    revenueAllTime,
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
    // Total bookings all time
    prisma.booking.count({
      where: {
        businessId: business.id
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
    // Revenue all time
    prisma.booking.aggregate({
      where: {
        businessId: business.id,
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
    // Today's bookings (expanded range to catch timezone issues)
    prisma.booking.findMany({
      where: {
        businessId: business.id,
        startTime: { gte: todayStart, lte: tomorrowEnd }
      },
      include: {
        customer: true,
        service: true
      },
      orderBy: { startTime: 'asc' },
      take: 10
    })
  ])

  // Calculate growth percentage
  const bookingGrowth = totalBookingsLastMonth > 0 
    ? ((totalBookingsThisMonth - totalBookingsLastMonth) / totalBookingsLastMonth) * 100 
    : totalBookingsThisMonth > 0 ? 100 : 0

  // Use all-time stats if current month is empty
  const displayBookings = totalBookingsThisMonth > 0 ? totalBookingsThisMonth : totalBookingsAllTime
  const displayRevenue = Number(revenueThisMonth._sum.paymentAmount || 0) > 0 
    ? Number(revenueThisMonth._sum.paymentAmount || 0)
    : Number(revenueAllTime._sum.paymentAmount || 0)

  const stats = {
    totalBookings: displayBookings,
    revenue: displayRevenue,
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
