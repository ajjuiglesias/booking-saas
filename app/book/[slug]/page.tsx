"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { format, addDays, isSameDay } from "date-fns"
import Image from "next/image"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Check, ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { BookingPageSkeleton, TimeSlotsSkeleton } from "@/components/ui/booking-skeletons"

interface Service {
  id: string
  name: string
  description: string
  durationMinutes: number
  price: number
}

interface TimeSlot {
  time: string
  datetime: string
  available: boolean
  status: 'available' | 'past' | 'booked'
}

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [business, setBusiness] = useState<any>(null)
  const [services, setServices] = useState<Service[]>([])
  
  // Selection state
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    email: "",
    phone: "",
    notes: ""
  })

  // Data fetching
  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        // We need a public API endpoint for this. 
        // For now, let's assume we have one or mock it.
        // In a real app, you'd create /api/public/business/[slug]
        const response = await fetch(`/api/public/business/${slug}`)
        if (response.ok) {
          const data = await response.json()
          setBusiness(data.business)
          setServices(data.services)
        } else {
          throw new Error("Business not found")
        }
      } catch (error) {
        toast.error("Failed to load business info")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchBusinessData()
  }, [slug])

  // Time slots fetching
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [blockedDates, setBlockedDates] = useState<Date[]>([])
  const [availableDays, setAvailableDays] = useState<number[]>([]) // Array of available day numbers (0-6)

  // Fetch blocked dates and available days when business is loaded
  useEffect(() => {
    if (business) {
      const fetchAvailabilityData = async () => {
        try {
          const response = await fetch(`/api/public/availability/${business.id}`)
          if (response.ok) {
            const data = await response.json()
            
            // Set blocked dates
            if (data.blockedDates && Array.isArray(data.blockedDates)) {
              const dates = data.blockedDates.map((bd: any) => new Date(bd.date))
              setBlockedDates(dates)
            }
            
            // Set available days (days of week that are enabled)
            if (data.availability && Array.isArray(data.availability)) {
              const enabledDays = data.availability
                .filter((a: any) => a.isAvailable)
                .map((a: any) => Number(a.dayOfWeek))
              setAvailableDays(enabledDays)
            }
          } else {
            console.error('Failed to fetch availability:', response.status)
          }
        } catch (error) {
          console.error("Failed to load availability data:", error)
        }
      }
      fetchAvailabilityData()
    }
  }, [business])

  useEffect(() => {
    if (selectedDate && selectedService && business) {
      const fetchSlots = async () => {
        setIsLoadingSlots(true)
        try {
          const params = new URLSearchParams({
            businessId: business.id,
            serviceId: selectedService.id,
            date: selectedDate.toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          })
          const response = await fetch(`/api/timeslots?${params}`)
          if (response.ok) {
            const data = await response.json()
            setTimeSlots(data)
            
            // If no slots available and this is today, try to find next available date
            if (data.length === 0 && isSameDay(selectedDate, new Date())) {
              findNextAvailableDate()
            }
          }
        } catch (error) {
          toast.error("Failed to load time slots")
        } finally {
          setIsLoadingSlots(false)
        }
      }
      fetchSlots()
    }
  }, [selectedDate, selectedService, business])

  // Find next available date with slots
  const findNextAvailableDate = async () => {
    if (!selectedService || !business) return
    
    const maxDays = business.maxAdvanceDays || 30
    let currentDate = addDays(new Date(), 1) // Start from tomorrow
    
    for (let i = 0; i < maxDays; i++) {
      // Check if date is blocked
      const isBlocked = blockedDates.some(blocked => 
        isSameDay(blocked, currentDate)
      )
      
      // Check if day of week is available
      const dayOfWeek = currentDate.getDay()
      const isDayAvailable = availableDays.includes(dayOfWeek)
      
      if (!isBlocked && isDayAvailable) {
        // Check if this date has slots
        try {
          const params = new URLSearchParams({
            businessId: business.id,
            serviceId: selectedService.id,
            date: currentDate.toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          })
          const response = await fetch(`/api/timeslots?${params}`)
          if (response.ok) {
            const slots = await response.json()
            if (slots.length > 0) {
              // Found a date with available slots!
              setSelectedDate(currentDate)
              return
            }
          }
        } catch (error) {
          console.error("Error checking slots for date:", error)
        }
      }
      
      currentDate = addDays(currentDate, 1)
    }
  }

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleBooking = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/public/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          serviceId: selectedService?.id,
          customerId: "new", // Logic to handle new vs existing
          customer: customerDetails,
          startTime: selectedTime, // This needs to be the full ISO string from the slot
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Don't set isSubmitting to false - keep loader showing during redirect
        router.push(`/booking-confirmation/${data.id}`)
      } else {
        throw new Error("Booking failed")
      }
    } catch (error) {
      toast.error("Failed to create booking")
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <BookingPageSkeleton />
  }

  if (!business) {
    return <div className="min-h-screen flex items-center justify-center">Business not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {business.logoUrl ? (
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-24 h-24 mb-2">
                <Image
                  src={business.logoUrl}
                  alt={`${business.name} logo`}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <h1 className="text-2xl font-bold dark:text-white">{business.name}</h1>
            </div>
          ) : (
            <h1 className="text-2xl font-bold dark:text-white">{business.name}</h1>
          )}
          <p className="text-muted-foreground mt-2">Book an appointment</p>
        </div>

        {/* Progress */}
        <div className="mb-8 flex justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div 
              key={s}
              className={cn(
                "h-2 w-16 rounded-full transition-colors",
                step >= s ? "bg-indigo-600 dark:bg-indigo-500" : "bg-gray-200 dark:bg-gray-700"
              )}
            />
          ))}
        </div>

        <Card>
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle>Select a Service</CardTitle>
                <CardDescription>Choose the service you would like to book</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={cn(
                      "flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:border-indigo-600 transition-colors",
                      selectedService?.id === service.id && "border-indigo-600 bg-indigo-50"
                    )}
                    onClick={() => setSelectedService(service)}
                  >
                    <div>
                      <h3 className="font-medium">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">{service.durationMinutes} mins</p>
                    </div>
                    <div className="font-semibold">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(service.price)}
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  disabled={!selectedService}
                  onClick={() => setStep(2)}
                >
                  Continue
                </Button>
              </CardFooter>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle>Select Date & Time</CardTitle>
                <CardDescription>
                  {selectedService?.name} ({selectedService?.durationMinutes} mins)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => {
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        const checkDate = new Date(date)
                        checkDate.setHours(0, 0, 0, 0)
                        
                        // Use business maxAdvanceDays or default to 30 days
                        const maxDays = business?.maxAdvanceDays || 30
                        const maxDate = new Date()
                        maxDate.setDate(maxDate.getDate() + maxDays)
                        maxDate.setHours(0, 0, 0, 0)
                        
                        // Disable past dates and dates beyond max advance days
                        if (checkDate < today || checkDate > maxDate) return true
                        
                        // Disable if this day of week is not available
                        // Only apply this check if we have availability data loaded
                        if (availableDays.length > 0) {
                          const dayOfWeek = date.getDay()
                          if (!availableDays.includes(dayOfWeek)) return true
                        }
                        
                        // Disable blocked dates - normalize both dates for comparison
                        return blockedDates.some(blockedDate => {
                          const blocked = new Date(blockedDate)
                          blocked.setHours(0, 0, 0, 0)
                          return blocked.getTime() === checkDate.getTime()
                        })
                      }}
                      className="rounded-md border mx-auto"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-4">Available Times</h4>
                    {isLoadingSlots ? (
                      <TimeSlotsSkeleton />
                    ) : timeSlots.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No slots available for this date.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-2">
                        {timeSlots.map((slot) => {
                          const isSelected = selectedTime === slot.datetime
                          
                          // Determine button styling based on status
                          let buttonClass = "w-full text-sm"
                          if (slot.status === 'past') {
                            buttonClass += " bg-gray-100 text-gray-400 cursor-not-allowed"
                          } else if (slot.status === 'booked') {
                            buttonClass += " bg-red-50 text-red-400 border-red-200 cursor-not-allowed"
                          } else if (isSelected) {
                            buttonClass += " bg-indigo-600 text-white hover:bg-indigo-700"
                          } else {
                            buttonClass += " bg-white border-gray-300 hover:bg-gray-50"
                          }
                          
                          return (
                            <Button
                              key={slot.time}
                              variant="outline"
                              className={buttonClass}
                              disabled={!slot.available}
                              onClick={() => setSelectedTime(slot.datetime)}
                            >
                              {slot.time}
                            </Button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button 
                  disabled={!selectedTime}
                  onClick={() => setStep(3)}
                >
                  Continue
                </Button>
              </CardFooter>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle>Your Details</CardTitle>
                <CardDescription>Enter your information to confirm the booking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input 
                      value={customerDetails.name}
                      onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input 
                      value={customerDetails.phone}
                      onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    value={customerDetails.email}
                    onChange={(e) => setCustomerDetails({...customerDetails, email: e.target.value})}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea 
                    value={customerDetails.notes}
                    onChange={(e) => setCustomerDetails({...customerDetails, notes: e.target.value})}
                    placeholder="Any special requests?"
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mt-6">
                  <h4 className="font-medium mb-2">Booking Summary</h4>
                  <div className="text-sm space-y-1 text-gray-600">
                    <div className="flex justify-between">
                      <span>Service:</span>
                      <span className="font-medium text-gray-900">{selectedService?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span className="font-medium text-gray-900">
                        {selectedDate && format(selectedDate, "MMMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span className="font-medium text-gray-900">
                        {selectedTime && format(new Date(selectedTime), "h:mm a")}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t mt-2">
                      <span>Total:</span>
                      <span className="font-bold text-gray-900">
                        {selectedService && new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(selectedService.price)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button onClick={handleBooking} disabled={!customerDetails.name || !customerDetails.phone || !customerDetails.email || isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating booking...
                    </>
                  ) : (
                    "Confirm Booking"
                  )}
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
