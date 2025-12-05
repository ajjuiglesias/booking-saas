"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Search, User } from "lucide-react"
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

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string
}

interface PaymentSettings {
  razorpayEnabled: boolean
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

  // Customer search
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false)
  const [customerSearchQuery, setCustomerSearchQuery] = useState("")
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)

  // Filter customers based on search query
  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery) return customers
    
    const query = customerSearchQuery.toLowerCase()
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.phone.toLowerCase().includes(query)
    )
  }, [customers, customerSearchQuery])

  // Payment settings
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash')

  // Form fields
  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "" // Customer-facing notes
  })
  const [internalNotes, setInternalNotes] = useState("") // Staff-only notes
  const [sendConfirmationEmail, setSendConfirmationEmail] = useState(true)

  // Fetch initial data
  useEffect(() => {
    if (open) {
      fetchServices()
      fetchBlockedDates()
      fetchCustomers()
      fetchPaymentSettings()
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
        setServices(data.filter((s: Service) => s.price > 0))
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
        
        if (data.blockedDates && Array.isArray(data.blockedDates)) {
          const dates = data.blockedDates.map((bd: any) => new Date(bd.date))
          setBlockedDates(dates)
        }
        
        if (data.availability && Array.isArray(data.availability)) {
          const enabledDays = data.availability
            .filter((a: any) => a.isAvailable)
            .map((a: any) => a.dayOfWeek)
          setAvailableDays(enabledDays)
        }
        
        if (data.maxAdvanceDays) {
          setMaxAdvanceDays(data.maxAdvanceDays)
        }
      }
    } catch (error) {
      console.error("Failed to load blocked dates:", error)
    }
  }

  const fetchCustomers = async () => {
    setIsLoadingCustomers(true)
    try {
      const response = await fetch("/api/customers")
      if (response.ok) {
        const data = await response.json()
        // API returns { customers: [...], pagination: {...} }
        setCustomers(data.customers || [])
      }
    } catch (error) {
      console.error("Failed to load customers:", error)
    } finally {
      setIsLoadingCustomers(false)
    }
  }

  const fetchPaymentSettings = async () => {
    try {
      const response = await fetch("/api/settings/payment")
      if (response.ok) {
        const data = await response.json()
        setPaymentSettings(data)
      }
    } catch (error) {
      console.error("Failed to load payment settings:", error)
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

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer)
    setCustomerDetails({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone,
      notes: ""
    })
    setCustomerSearchOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedService || !selectedTime || !customerDetails.name || !customerDetails.email) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      // Step 1: Create booking
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
          internalNotes: internalNotes,
          paymentMethod: paymentMethod,
          status: paymentMethod === "online" ? "pending_payment" : "confirmed", // Pending until payment for online
          sendConfirmation: sendConfirmationEmail
        })
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || "Failed to create booking")
        setIsSubmitting(false)
        return
      }

      const booking = await response.json()

      // Step 2: If online payment, create Razorpay order
      if (paymentMethod === 'online') {
        const selectedServiceData = services.find(s => s.id === selectedService)
        if (!selectedServiceData) {
          toast.error("Service not found")
          setIsSubmitting(false)
          return
        }

        const orderResponse = await fetch("/api/payments/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: booking.id,
            amount: selectedServiceData.price,
          })
        })

        if (!orderResponse.ok) {
          const errorData = await orderResponse.json()
          toast.error(errorData.error || "Failed to create payment order")
          setIsSubmitting(false)
          return
        }

        const orderData = await orderResponse.json()
        
        // Generate payment link
        const paymentLink = `${window.location.origin}/payment/${booking.id}`
        
        // Send payment link via email
        try {
          await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "payment-link",
              to: customerDetails.email,
              booking: {
                id: booking.id,
                customerName: customerDetails.name,
                serviceName: selectedServiceData.name,
                startTime: selectedTime,
                paymentAmount: selectedServiceData.price,
                paymentLink: paymentLink
              }
            })
          })
          
          toast.success("Booking created! Payment link sent to customer's email.")
        } catch (emailError) {
          console.error("Failed to send payment link email:", emailError)
          toast.success(`Booking created! Payment link: ${paymentLink}`)
        }
        
        console.log("Payment link:", paymentLink)
      } else {
        // Cash payment - simple success
        toast.success("Booking created successfully!")
      }

      onOpenChange(false)
      resetForm()
      window.location.reload()
    } catch (error) {
      console.error("Booking creation error:", error)
      toast.error("Failed to create booking")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedService("")
    setSelectedDate(undefined)
    setSelectedTime("")
    setSelectedCustomer(null)
    setCustomerDetails({ name: "", email: "", phone: "", notes: "" })
    setInternalNotes("")
    setPaymentMethod('cash')
    setSendConfirmationEmail(true)
  }

  const selectedServiceData = services.find(s => s.id === selectedService)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Booking</DialogTitle>
          <DialogDescription>
            Quickly create a booking for a customer (phone/walk-in)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service & Date - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            {/* Service Selection */}
            <div className="space-y-2">
              <Label htmlFor="service">Service *</Label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - ₹{service.price}
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
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      const checkDate = new Date(date)
                      checkDate.setHours(0, 0, 0, 0)
                      const maxDate = new Date()
                      maxDate.setDate(maxDate.getDate() + maxAdvanceDays)
                      maxDate.setHours(0, 0, 0, 0)
                      
                      if (checkDate < today || checkDate > maxDate) return true
                      
                      const dayOfWeek = date.getDay()
                      if (availableDays.length > 0 && !availableDays.includes(dayOfWeek)) return true
                      
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
                <p className="text-sm text-muted-foreground py-4">No available time slots</p>
              ) : (
                <div className="grid grid-cols-6 gap-2 max-h-[150px] overflow-y-auto p-2 border rounded-md">
                  {timeSlots.map((slot) => {
                    const isSelected = selectedTime === slot.datetime
                    
                    let buttonClass = "text-xs"
                    if (slot.status === 'past') {
                      buttonClass += " bg-gray-100 text-gray-400 cursor-not-allowed"
                    } else if (slot.status === 'booked') {
                      buttonClass += " bg-red-50 text-red-600 border-red-200 cursor-not-allowed"
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

          {/* Customer Search/Selection */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Customer Information
            </h4>
            
            {/* Customer Search */}
            <div className="space-y-2">
              <Label>Search Existing Customer</Label>
              <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={customerSearchOpen}
                    className="w-full justify-between"
                  >
                    {selectedCustomer ? selectedCustomer.name : "Search customers..."}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[500px] p-0" align="start">
                  <div className="flex flex-col">
                    {/* Search Input */}
                    <div className="flex items-center border-b px-3">
                      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                        value={customerSearchQuery}
                        onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    {/* Customer List */}
                    <div className="max-h-[300px] overflow-y-auto p-2">
                      {filteredCustomers.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          No customer found.
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {filteredCustomers.map((customer) => (
                            <div
                              key={customer.id}
                              onClick={() => handleCustomerSelect(customer)}
                              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{customer.name}</span>
                                <span className="text-sm text-muted-foreground">
                                  {customer.email} • {customer.phone}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Or enter new customer details below
              </p>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={customerDetails.phone}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
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
              <Label htmlFor="notes">Customer Notes</Label>
              <Textarea
                id="notes"
                value={customerDetails.notes}
                onChange={(e) => setCustomerDetails({ ...customerDetails, notes: e.target.value })}
                placeholder="Special requests from customer..."
                rows={2}
              />
            </div>
          </div>

          {/* Payment Method & Internal Notes */}
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <div className={cn(
                  "grid gap-2",
                  paymentSettings?.razorpayEnabled ? "grid-cols-2" : "grid-cols-1"
                )}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={cn(
                      "flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all text-sm",
                      paymentMethod === 'cash'
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    💵 Cash
                  </button>
                  
                  {paymentSettings?.razorpayEnabled && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('online')}
                      className={cn(
                        "flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all text-sm",
                        paymentMethod === 'online'
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      💳 Online
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {paymentMethod === 'online' 
                    ? "Booking will be pending until payment is completed"
                    : "Mark as paid later when customer pays"}
                </p>
              </div>

              {/* Send Confirmation Email */}
              <div className="space-y-2">
                <Label>Options</Label>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <Checkbox
                    id="sendEmail"
                    checked={sendConfirmationEmail}
                    onCheckedChange={(checked) => setSendConfirmationEmail(checked as boolean)}
                  />
                  <label
                    htmlFor="sendEmail"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Send confirmation email
                  </label>
                </div>
              </div>
            </div>

            {/* Internal Notes */}
            <div className="space-y-2">
              <Label htmlFor="internalNotes">Internal Notes (Staff Only)</Label>
              <Textarea
                id="internalNotes"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Internal notes not visible to customer..."
                rows={2}
                className="bg-yellow-50 dark:bg-yellow-950/20"
              />
              <p className="text-xs text-muted-foreground">
                These notes are only visible to staff members
              </p>
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
