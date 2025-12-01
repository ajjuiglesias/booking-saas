"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Users, UserPlus, Calendar, Upload, Download, Tag as TagIcon, 
  TrendingUp, Eye, Loader2 
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { CustomerDetailModal } from "@/components/customers/customer-detail-modal"
import { ImportModal } from "@/components/customers/import-modal"
import { TagManager } from "@/components/customers/tag-manager"
import { CustomerFilters, FilterState } from "@/components/customers/customer-filters"
import { Skeleton } from "@/components/ui/skeleton"
import { TableSkeleton } from "@/components/ui/skeletons"
import { EmptyState } from "@/components/ui/empty-state"

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string
  totalBookings: number
  totalSpent: number
  segment: string | null
  tags: string[]
  lastBookingDate: string | null
  createdAt: string
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

const SEGMENT_COLORS: Record<string, string> = {
  vip: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  regular: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  new: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  at_risk: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  lost: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  })
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showTagManager, setShowTagManager] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    segment: "all",
    tags: [],
    minSpent: "",
    maxSpent: "",
    minBookings: "",
    sortBy: "name",
    sortOrder: "asc",
  })

  const fetchCustomers = async (page: number = pagination.page) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      })

      if (filters.search) params.append("search", filters.search)
      if (filters.segment && filters.segment !== "all") params.append("segment", filters.segment)
      if (filters.minSpent) params.append("minSpent", filters.minSpent)
      if (filters.maxSpent) params.append("maxSpent", filters.maxSpent)
      if (filters.minBookings) params.append("minBookings", filters.minBookings)

      const response = await fetch(`/api/customers?${params}`)
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers)
        setPagination(data.pagination)
      } else {
        toast.error("Failed to load customers")
      }
    } catch (error) {
      toast.error("Failed to load customers")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers(1)
  }, [filters])

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch("/api/customers/export")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `customers-${format(new Date(), "yyyy-MM-dd")}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success("Customers exported successfully")
      } else {
        toast.error("Failed to export customers")
      }
    } catch (error) {
      toast.error("Failed to export customers")
    } finally {
      setIsExporting(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    fetchCustomers(newPage)
  }

  const formatSegment = (segment: string | null) => {
    if (!segment) return null
    return segment.replace("_", " ").toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowTagManager(true)}
            className="gap-2"
          >
            <TagIcon className="w-4 h-4" />
            Manage Tags
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowImportModal(true)}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
            className="gap-2"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-[60px]" />
            ) : (
              <div className="text-2xl font-bold">{pagination.total}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIP Customers</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-[60px]" />
            ) : (
              <div className="text-2xl font-bold">
                {customers.filter(c => c.segment === "vip").length}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-[60px]" />
            ) : (
              <div className="text-2xl font-bold">
                {customers.filter(c => c.totalBookings > 0).length}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-[60px]" />
            ) : (
              <div className="text-2xl font-bold">
                {pagination.total > 0 
                  ? (customers.reduce((sum, c) => sum + c.totalBookings, 0) / customers.length).toFixed(1)
                  : "0"
                }
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <CustomerFilters onFilterChange={setFilters} />

      {/* Customer Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Segment</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
              <TableHead className="text-right">Bookings</TableHead>
              <TableHead>Last Booking</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton rows={5} columns={8} />
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <EmptyState
                    icon={Users}
                    title="No customers found"
                    description={filters.search || filters.segment !== "all" 
                      ? "No customers match your filters." 
                      : "No customers yet. They'll appear here after their first booking."}
                  />
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow 
                  key={customer.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedCustomerId(customer.id)}
                >
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {customer.email && <div>{customer.email}</div>}
                      <div className="text-muted-foreground">{customer.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {customer.segment && (
                      <Badge className={SEGMENT_COLORS[customer.segment] || ""}>
                        {formatSegment(customer.segment)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {customer.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {customer.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{customer.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${Number(customer.totalSpent).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">{customer.totalBookings}</TableCell>
                  <TableCell>
                    {customer.lastBookingDate 
                      ? format(new Date(customer.lastBookingDate), "MMM d, yyyy")
                      : "Never"
                    }
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedCustomerId(customer.id)
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} customers
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedCustomerId && (
        <CustomerDetailModal
          customerId={selectedCustomerId}
          open={!!selectedCustomerId}
          onOpenChange={(open) => !open && setSelectedCustomerId(null)}
        />
      )}

      <ImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onSuccess={() => fetchCustomers(1)}
      />

      <TagManager
        open={showTagManager}
        onOpenChange={setShowTagManager}
        onTagsUpdated={() => fetchCustomers()}
      />
    </div>
  )
}
