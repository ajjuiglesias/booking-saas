"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "sonner"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface Service {
  id: string
  name: string
  durationMinutes: number
  price: number
}

interface TimeSlot {
  time: string
  datetime: string
  available: boolean
  status?: 'available' | 'past' | 'booked'
}

interface ManualBookingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessId: string
}

export function ManualBookingModal({ open, onOpenChange, businessId }: ManualBookingModalProps) {
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [blockedDates, setBlockedDates] = useState<Date[]>([])
  const [availableDays, setAvailableDays] = useState<number[]>([])
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(30)

  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    email: "",
    phone: "",
    notes: ""
  })

  // Fetch services and blocked dates
  useEffect(() => {
    if (open) {
      fetchServices()
      fetchBlockedDates()
    }
  }, [open])

  // Fetch time slots when service and date are selected
  useEffect(() => {
    if (selectedService && selectedDate) {
      fetchTimeSlots()
    }
  }, [selectedService, selectedDate])

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services")
      if (response.ok) {
        const data = await response.json()
        setServices(data.filter((s: Service) => s.price > 0)) // Only active services
      }
    } catch (error) {
      toast.error("Failed to load services")
    }
  }

  const fetchBlockedDates = async () => {
    try {
      const response = await fetch("/api/availability")
      if (response.ok) {
        const data = await response.json()
        
        // Set blocked dates
        if (data.blockedDates && Array.isArray(data.blockedDates)) {
          const dates = data.blockedDates.map((bd: any) => new Date(bd.date))
          setBlockedDates(dates)
        }
        
        // Set available days
        if (data.availability && Array.isArray(data.availability)) {
          const enabledDays = data.availability
            .filter((a: any) => a.isAvailable)
            .map((a: any) => a.dayOfWeek)
          setAvailableDays(enabledDays)
        }
        
        // Set max advance days
        if (data.maxAdvanceDays) {
          setMaxAdvanceDays(data.maxAdvanceDays)
        }
      }
    } catch (error) {
      console.error("Failed to load blocked dates:", error)
    }
  }

  const fetchTimeSlots = async () => {
    if (!selectedService || !selectedDate) return

    setIsLoadingSlots(true)
    try {
      const params = new URLSearchParams({
        businessId,
        serviceId: selectedService,
        date: selectedDate.toISOString()
      })
      const response = await fetch(`/api/timeslots?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTimeSlots(data)
      }
    } catch (error) {
      toast.error("Failed to load time slots")
    } finally {
      setIsLoadingSlots(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedService || !selectedTime || !customerDetails.name || !customerDetails.email) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService,
          startTime: selectedTime,
          customerName: customerDetails.name,
          customerEmail: customerDetails.email,
          customerPhone: customerDetails.phone,
          notes: customerDetails.notes,
          status: "confirmed" // Admin bookings are auto-confirmed
        })
      })

      if (response.ok) {
        toast.success("Booking created successfully!")
        onOpenChange(false)
        // Reset form
        setSelectedService("")
        setSelectedDate(undefined)
        setSelectedTime("")
        setCustomerDetails({ name: "", email: "", phone: "", notes: "" })
        // Refresh the page to show new booking
        window.location.reload()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to create booking")
      }
    } catch (error) {
      toast.error("Failed to create booking")
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedServiceData = services.find(s => s.id === selectedService)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Booking</DialogTitle>
          <DialogDescription>
            Manually create a booking for a customer
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Selection */}
          <div className="space-y-2">
            <Label htmlFor="service">Service *</Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger>
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} - ₹{service.price} ({service.durationMinutes} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => {
                    // Disable past dates and dates beyond max advance days
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const checkDate = new Date(date)
                    checkDate.setHours(0, 0, 0, 0)
                    const maxDate = new Date()
                    maxDate.setDate(maxDate.getDate() + maxAdvanceDays)
                    maxDate.setHours(0, 0, 0, 0)
                    
                    if (checkDate < today || checkDate > maxDate) return true
                    
                    // Disable if this day of week is not available
                    const dayOfWeek = date.getDay()
                    if (availableDays.length > 0 && !availableDays.includes(dayOfWeek)) return true
                    
                    // Disable blocked dates - normalize both dates for comparison
                    return blockedDates.some(blockedDate => {
                      const blocked = new Date(blockedDate)
                      blocked.setHours(0, 0, 0, 0)
                      return blocked.getTime() === checkDate.getTime()
                    })
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          {selectedService && selectedDate && (
            <div className="space-y-2">
              <Label>Time *</Label>
              {isLoadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : timeSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No available time slots for this date</p>
              ) : (
                <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-md">
                  {timeSlots.map((slot) => {
                    const isSelected = selectedTime === slot.datetime
                    
                    // Determine button styling based on status (same as public booking page)
                    let buttonClass = "text-xs"
                    if (slot.status === 'past') {
                      buttonClass += " bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800"
                    } else if (slot.status === 'booked') {
                      buttonClass += " bg-red-50 text-red-600 border-red-200 cursor-not-allowed dark:bg-red-950 dark:text-red-400 dark:border-red-900"
                    } else if (isSelected) {
                      buttonClass += " bg-primary text-primary-foreground"
                    }
                    
                    return (
                      <Button
                        key={slot.datetime}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        disabled={!slot.available}
                        onClick={() => setSelectedTime(slot.datetime)}
                        className={buttonClass}
                      >
                        {slot.time}
                      </Button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Customer Details */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium">Customer Information</h4>
            
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={customerDetails.name}
                onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={customerDetails.email}
                onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={customerDetails.phone}
                onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={customerDetails.notes}
                onChange={(e) => setCustomerDetails({ ...customerDetails, notes: e.target.value })}
                placeholder="Any special requests or notes..."
                rows={3}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Booking"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
