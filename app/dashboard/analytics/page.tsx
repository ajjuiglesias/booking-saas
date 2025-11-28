"use client"

import { useState, useEffect } from "react"
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns"
import { Calendar, DollarSign, Users, TrendingUp } from "lucide-react"
import { KPICard } from "@/components/analytics/kpi-card"
import { RevenueChart } from "@/components/analytics/revenue-chart"
import { BookingsChart } from "@/components/analytics/bookings-chart"
import { ServiceChart } from "@/components/analytics/service-chart"
import { ExportButton } from "@/components/analytics/export-button"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { AnalyticsSkeleton } from "@/components/ui/skeletons"
import { Skeleton } from "@/components/ui/skeleton"

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  })
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day")
  const [isLoading, setIsLoading] = useState(true)

  // Data states
  const [overview, setOverview] = useState<any>(null)
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [bookingsData, setBookingsData] = useState<any[]>([])
  const [servicesData, setServicesData] = useState<any[]>([])

  // Fetch all analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true)
      try {
        const fromStr = format(dateRange.from, "yyyy-MM-dd")
        const toStr = format(dateRange.to, "yyyy-MM-dd")

        // Fetch overview KPIs
        const overviewRes = await fetch(`/api/analytics/overview?from=${fromStr}&to=${toStr}`)
        if (overviewRes.ok) {
          const data = await overviewRes.json()
          setOverview(data)
        }

        // Fetch revenue data
        const revenueRes = await fetch(`/api/analytics/revenue?from=${fromStr}&to=${toStr}&groupBy=${groupBy}`)
        if (revenueRes.ok) {
          const data = await revenueRes.json()
          setRevenueData(data.data)
        }

        // Fetch bookings data
        const bookingsRes = await fetch(`/api/analytics/bookings?from=${fromStr}&to=${toStr}&groupBy=${groupBy}`)
        if (bookingsRes.ok) {
          const data = await bookingsRes.json()
          setBookingsData(data.data)
        }

        // Fetch services data
        const servicesRes = await fetch(`/api/analytics/services?from=${fromStr}&to=${toStr}`)
        if (servicesRes.ok) {
          const data = await servicesRes.json()
          setServicesData(data.data)
        }

      } catch (error) {
        toast.error("Failed to load analytics")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [dateRange, groupBy])

  // Quick date range presets
  const setPreset = (preset: string) => {
    const now = new Date()
    switch (preset) {
      case "today":
        setDateRange({ from: now, to: now })
        break
      case "week":
        setDateRange({ from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), to: now })
        break
      case "month":
        setDateRange({ from: startOfMonth(now), to: endOfMonth(now) })
        break
      case "lastMonth":
        const lastMonth = subMonths(now, 1)
        setDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) })
        break
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <div className="flex items-center gap-2">
          <ExportButton 
            data={revenueData} 
            filename="revenue-data"
            label="Export Revenue"
          />
          <ExportButton 
            data={bookingsData} 
            filename="bookings-data"
            label="Export Bookings"
          />
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center gap-2">
        <Button 
          variant={dateRange.from.toDateString() === new Date().toDateString() ? "default" : "outline"}
          size="sm"
          onClick={() => setPreset("today")}
        >
          Today
        </Button>
        <Button 
          variant="outline"
          size="sm"
          onClick={() => setPreset("week")}
        >
          Last 7 Days
        </Button>
        <Button 
          variant="outline"
          size="sm"
          onClick={() => setPreset("month")}
        >
          This Month
        </Button>
        <Button 
          variant="outline"
          size="sm"
          onClick={() => setPreset("lastMonth")}
        >
          Last Month
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Revenue"
          value={overview?.totalRevenue || 0}
          change={overview?.growth.revenue}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          format="currency"
          isLoading={isLoading}
        />
        <KPICard
          title="Total Bookings"
          value={overview?.totalBookings || 0}
          change={overview?.growth.bookings}
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <KPICard
          title="Active Customers"
          value={overview?.activeCustomers || 0}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <KPICard
          title="Conversion Rate"
          value={overview?.conversionRate || 0}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          format="percentage"
          isLoading={isLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-7">
        <RevenueChart data={revenueData} isLoading={isLoading} />
        <ServiceChart data={servicesData} isLoading={isLoading} />
      </div>

      <div className="grid gap-4">
        <BookingsChart data={bookingsData} isLoading={isLoading} />
      </div>

      {/* Popular Service */}
      {overview?.popularService && (
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold mb-2">Most Popular Service</h3>
          <p className="text-2xl font-bold">{overview.popularService.name}</p>
          <p className="text-sm text-muted-foreground">
            {overview.popularService.bookings} bookings in this period
          </p>
        </div>
      )}
    </div>
  )
}
