"use client"

import { useState, useEffect } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface CustomerFiltersProps {
  onFilterChange: (filters: FilterState) => void
}

export interface FilterState {
  search: string
  segment: string
  tags: string[]
  minSpent: string
  maxSpent: string
  minBookings: string
  sortBy: string
  sortOrder: "asc" | "desc"
}

const SEGMENTS = [
  { value: "all", label: "All Segments" },
  { value: "vip", label: "VIP" },
  { value: "regular", label: "Regular" },
  { value: "new", label: "New" },
  { value: "at_risk", label: "At Risk" },
  { value: "lost", label: "Lost" },
]

const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "totalSpent", label: "Total Spent" },
  { value: "totalBookings", label: "Total Bookings" },
  { value: "lastBooking", label: "Last Booking" },
  { value: "createdAt", label: "Created Date" },
]

export function CustomerFilters({ onFilterChange }: CustomerFiltersProps) {
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

  const [searchDebounce, setSearchDebounce] = useState("")

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchDebounce }))
    }, 300)

    return () => clearTimeout(timer)
  }, [searchDebounce])

  // Notify parent of filter changes
  useEffect(() => {
    onFilterChange(filters)
  }, [filters, onFilterChange])

  const handleSegmentChange = (value: string) => {
    setFilters((prev) => ({ ...prev, segment: value }))
  }

  const handleSortChange = (value: string) => {
    setFilters((prev) => ({ ...prev, sortBy: value }))
  }

  const toggleSortOrder = () => {
    setFilters((prev) => ({
      ...prev,
      sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
    }))
  }

  const clearFilters = () => {
    setSearchDebounce("")
    setFilters({
      search: "",
      segment: "all",
      tags: [],
      minSpent: "",
      maxSpent: "",
      minBookings: "",
      sortBy: "name",
      sortOrder: "asc",
    })
  }

  const hasActiveFilters =
    filters.search ||
    filters.segment !== "all" ||
    filters.tags.length > 0 ||
    filters.minSpent ||
    filters.maxSpent ||
    filters.minBookings

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search customers by name, email, or phone..."
          value={searchDebounce}
          onChange={(e) => setSearchDebounce(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchDebounce && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => setSearchDebounce("")}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-3">
        {/* Segment Filter */}
        <Select value={filters.segment} onValueChange={handleSegmentChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Segment" />
          </SelectTrigger>
          <SelectContent>
            {SEGMENTS.map((segment) => (
              <SelectItem key={segment.value} value={segment.value}>
                {segment.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Min Spent */}
        <Input
          type="number"
          placeholder="Min spent ($)"
          value={filters.minSpent}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, minSpent: e.target.value }))
          }
          className="w-[140px]"
        />

        {/* Max Spent */}
        <Input
          type="number"
          placeholder="Max spent ($)"
          value={filters.maxSpent}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, maxSpent: e.target.value }))
          }
          className="w-[140px]"
        />

        {/* Min Bookings */}
        <Input
          type="number"
          placeholder="Min bookings"
          value={filters.minBookings}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, minBookings: e.target.value }))
          }
          className="w-[140px]"
        />

        {/* Sort By */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Sort by:</span>
          <Select value={filters.sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
            <X className="w-4 h-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.search}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => setSearchDebounce("")}
              />
            </Badge>
          )}
          {filters.segment !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Segment: {SEGMENTS.find((s) => s.value === filters.segment)?.label}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => handleSegmentChange("all")}
              />
            </Badge>
          )}
          {filters.minSpent && (
            <Badge variant="secondary" className="gap-1">
              Min: ${filters.minSpent}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, minSpent: "" }))
                }
              />
            </Badge>
          )}
          {filters.maxSpent && (
            <Badge variant="secondary" className="gap-1">
              Max: ${filters.maxSpent}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, maxSpent: "" }))
                }
              />
            </Badge>
          )}
          {filters.minBookings && (
            <Badge variant="secondary" className="gap-1">
              Min bookings: {filters.minBookings}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, minBookings: "" }))
                }
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
