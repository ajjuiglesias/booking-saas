"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2, Users, UserPlus, Eye, Calendar } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { CustomerDetailModal } from "@/components/customers/customer-detail-modal"
import { Skeleton } from "@/components/ui/skeleton"
import { TableSkeleton } from "@/components/ui/skeletons"
import { EmptyState } from "@/components/ui/empty-state"

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string
  totalBookings: number
  lastBooking: string | null
  lastBookingStatus: string | null
  createdAt: string
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  })
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)

  const fetchCustomers = async (searchTerm: string = search, page: number = pagination.page) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        page: page.toString(),
        limit: pagination.limit.toString()
      })
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
    fetchCustomers()
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== undefined) {
        fetchCustomers(search, 1)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handlePageChange = (newPage: number) => {
    fetchCustomers(search, newPage)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
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

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        {search && (
          <Button variant="ghost" onClick={() => setSearch("")}>
            Clear
          </Button>
        )}
      </div>

      {/* Customer Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Total Bookings</TableHead>
              <TableHead>Last Booking</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton rows={5} columns={5} />
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <EmptyState
                    icon={Users}
                    title="No customers found"
                    description={search ? "No customers found matching your search." : "No customers yet. They'll appear here after their first booking."}
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
                    <Badge variant="secondary">{customer.totalBookings}</Badge>
                  </TableCell>
                  <TableCell>
                    {customer.lastBooking ? (
                      <div className="text-sm">
                        <div>{format(new Date(customer.lastBooking), "MMM d, yyyy")}</div>
                        <Badge 
                          variant={customer.lastBookingStatus === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {customer.lastBookingStatus}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No bookings</span>
                    )}
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
                      <Eye className="h-4 w-4" />
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
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} customers
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

      {/* Customer Detail Modal */}
      {selectedCustomerId && (
        <CustomerDetailModal
          customerId={selectedCustomerId}
          open={!!selectedCustomerId}
          onOpenChange={(open) => !open && setSelectedCustomerId(null)}
          onBookingCreated={() => fetchCustomers()}
        />
      )}
    </div>
  )
}
