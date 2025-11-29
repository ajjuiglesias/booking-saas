"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, Check, X, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"

const BUSINESS_CATEGORIES = [
  { value: "salon", label: "Salon & Beauty" },
  { value: "fitness", label: "Fitness & Training" },
  { value: "consulting", label: "Consulting" },
  { value: "home_services", label: "Home Services" },
  { value: "photography", label: "Photography" },
]

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Phoenix", label: "Arizona (MST)" },
  { value: "America/Anchorage", label: "Alaska (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii (HST)" },
]

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120]

interface Service {
  name: string
  durationMinutes: number
  price: string
  description?: string
}

interface AvailabilityDay {
  dayOfWeek: number
  startTime: string
  endTime: string
  isAvailable: boolean
}

const STORAGE_KEY = "booking_saas_signup_draft"

export default function SignupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  
  // Email availability check
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)
  const [emailCheckTimeout, setEmailCheckTimeout] = useState<NodeJS.Timeout | null>(null)

  // Step 1: Business Info
  const [businessData, setBusinessData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    category: "",
    timezone: "America/New_York",
    phone: "",
  })

  // Step 2: Services
  const [services, setServices] = useState<Service[]>([
    { name: "", durationMinutes: 60, price: "", description: "" }
  ])

  // Step 3: Availability
  const [availability, setAvailability] = useState<AvailabilityDay[]>([
    { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", isAvailable: true }, // Monday
    { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", isAvailable: true }, // Tuesday
    { dayOfWeek: 3, startTime: "09:00", endTime: "17:00", isAvailable: true }, // Wednesday
    { dayOfWeek: 4, startTime: "09:00", endTime: "17:00", isAvailable: true }, // Thursday
    { dayOfWeek: 5, startTime: "09:00", endTime: "17:00", isAvailable: true }, // Friday
    { dayOfWeek: 6, startTime: "09:00", endTime: "17:00", isAvailable: false }, // Saturday
    { dayOfWeek: 0, startTime: "09:00", endTime: "17:00", isAvailable: false }, // Sunday
  ])
  const [bufferMinutes, setBufferMinutes] = useState(0)

  // Step 4: Success
  const [bookingUrl, setBookingUrl] = useState("")

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(STORAGE_KEY)
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft)
        if (draft.businessData) setBusinessData(draft.businessData)
        if (draft.services) setServices(draft.services)
        if (draft.availability) setAvailability(draft.availability)
        if (draft.bufferMinutes !== undefined) setBufferMinutes(draft.bufferMinutes)
        if (draft.currentStep) setCurrentStep(draft.currentStep)
        toast.info("Draft restored from previous session")
      } catch (error) {
        console.error("Failed to load draft:", error)
      }
    }
  }, [])

  // Save draft to localStorage whenever data changes
  useEffect(() => {
    const draft = {
      businessData,
      services,
      availability,
      bufferMinutes,
      currentStep
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  }, [businessData, services, availability, bufferMinutes, currentStep])

  // Clear draft on successful signup
  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY)
  }

  // Debounced email availability check
  const checkEmailAvailability = useCallback(async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailAvailable(null)
      return
    }

    setIsCheckingEmail(true)
    try {
      const response = await fetch(`/api/check-email?email=${encodeURIComponent(email)}`)
      const data = await response.json()
      setEmailAvailable(data.available)
    } catch (error) {
      console.error("Email check failed:", error)
    } finally {
      setIsCheckingEmail(false)
    }
  }, [])

  // Handle email input with debouncing
  const handleEmailChange = (email: string) => {
    setBusinessData({ ...businessData, email })
    setEmailAvailable(null)
    
    // Clear existing timeout
    if (emailCheckTimeout) {
      clearTimeout(emailCheckTimeout)
    }
    
    // Set new timeout for email check
    const timeout = setTimeout(() => {
      checkEmailAvailability(email)
    }, 800) // 800ms debounce
    
    setEmailCheckTimeout(timeout)
  }

  const validateStep1 = () => {
    if (!businessData.name || !businessData.email || !businessData.password || !businessData.category) {
      toast.error("Please fill in all required fields")
      return false
    }
    if (businessData.password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return false
    }
    if (businessData.password !== businessData.confirmPassword) {
      toast.error("Passwords do not match")
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (services.length === 0) {
      toast.error("Please add at least one service")
      return false
    }
    for (const service of services) {
      if (!service.name || !service.price) {
        toast.error("Please fill in all service details")
        return false
      }
    }
    return true
  }

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return
    if (currentStep === 2 && !validateStep2()) return
    setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setLoadingProgress(0)
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)
    
    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business: businessData,
          services: services.map(s => ({
            ...s,
            price: parseFloat(s.price),
          })),
          availability: availability.filter(a => a.isAvailable),
          bufferMinutes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account")
      }

      setLoadingProgress(100)
      setBookingUrl(data.bookingUrl)
      setCurrentStep(4)
      clearDraft() // Clear draft on success
      toast.success("Account created successfully!")
    } catch (error: any) {
      clearInterval(progressInterval)
      toast.error(error.message || "Something went wrong")
    } finally {
      setIsLoading(false)
      setLoadingProgress(0)
    }
  }

  const addService = () => {
    setServices([...services, { name: "", durationMinutes: 60, price: "", description: "" }])
  }

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index))
  }

  const updateService = (index: number, field: keyof Service, value: any) => {
    const updated = [...services]
    updated[index] = { ...updated[index], [field]: value }
    setServices(updated)
  }

  const updateAvailability = (dayOfWeek: number, field: keyof AvailabilityDay, value: any) => {
    setAvailability(availability.map(a =>
      a.dayOfWeek === dayOfWeek ? { ...a, [field]: value } : a
    ))
  }

  const applyToAllDays = () => {
    const firstDay = availability.find(a => a.isAvailable)
    if (firstDay) {
      setAvailability(availability.map(a => ({
        ...a,
        startTime: firstDay.startTime,
        endTime: firstDay.endTime,
      })))
      toast.success("Applied to all days")
    }
  }

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step < currentStep
                      ? "bg-green-500 text-white"
                      : step === currentStep
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step < currentStep ? <Check className="w-5 h-5" /> : step}
                </div>
                {step < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step < currentStep ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Business Info</span>
            <span>Services</span>
            <span>Availability</span>
            <span>Success</span>
          </div>
        </div>

        {/* Step 1: Business Info */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Tell us about your business</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Business Name *</Label>
                <Input
                  id="name"
                  value={businessData.name}
                  onChange={(e) => setBusinessData({ ...businessData, name: e.target.value })}
                  placeholder="My Awesome Business"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={businessData.email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="you@business.com"
                    className={
                      emailAvailable === false ? "border-red-500 pr-10" : 
                      emailAvailable === true ? "border-green-500 pr-10" : "pr-10"
                    }
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isCheckingEmail && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {!isCheckingEmail && emailAvailable === true && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                    {!isCheckingEmail && emailAvailable === false && (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
                {emailAvailable === false && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Email already registered
                  </p>
                )}
                {emailAvailable === true && (
                  <p className="text-sm text-green-500 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Email available
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={businessData.password}
                    onChange={(e) => setBusinessData({ ...businessData, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={businessData.confirmPassword}
                    onChange={(e) => setBusinessData({ ...businessData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Business Category *</Label>
                <Select
                  value={businessData.category}
                  onValueChange={(value) => setBusinessData({ ...businessData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone *</Label>
                <Select
                  value={businessData.timezone}
                  onValueChange={(value) => setBusinessData({ ...businessData, timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={businessData.phone}
                  onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </CardContent>
            <div className="p-6 pt-0 flex justify-end">
              <Button onClick={handleNext}>Next</Button>
            </div>
          </Card>
        )}

        {/* Step 2: Services */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Services</CardTitle>
              <CardDescription>Add the services you offer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {services.map((service, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Service {index + 1}</h3>
                    {services.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeService(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Service Name *</Label>
                      <Input
                        value={service.name}
                        onChange={(e) => updateService(index, "name", e.target.value)}
                        placeholder="e.g., Haircut"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={service.price}
                        onChange={(e) => updateService(index, "price", e.target.value)}
                        placeholder="50.00"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Duration *</Label>
                    <Select
                      value={service.durationMinutes.toString()}
                      onValueChange={(value) => updateService(index, "durationMinutes", parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_OPTIONS.map((duration) => (
                          <SelectItem key={duration} value={duration.toString()}>
                            {duration} minutes
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description (Optional)</Label>
                    <Textarea
                      value={service.description}
                      onChange={(e) => updateService(index, "description", e.target.value)}
                      placeholder="Describe this service..."
                      rows={2}
                    />
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addService} className="w-full">
                + Add Another Service
              </Button>
            </CardContent>
            <div className="p-6 pt-0 flex justify-between">
              <Button variant="outline" onClick={handleBack}>Back</Button>
              <Button onClick={handleNext}>Next</Button>
            </div>
          </Card>
        )}

        {/* Step 3: Availability */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Set Your Availability</CardTitle>
              <CardDescription>When are you available for bookings?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={applyToAllDays}>
                  Apply to All Days
                </Button>
              </div>
              {availability.map((day) => (
                <div key={day.dayOfWeek} className="flex items-center gap-4">
                  <div className="w-32">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={day.isAvailable}
                        onChange={(e) => updateAvailability(day.dayOfWeek, "isAvailable", e.target.checked)}
                        className="rounded"
                      />
                      <span className="font-medium">{dayNames[day.dayOfWeek]}</span>
                    </label>
                  </div>
                  {day.isAvailable && (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xs">Start Time</Label>
                        <Input
                          type="time"
                          value={day.startTime}
                          onChange={(e) => updateAvailability(day.dayOfWeek, "startTime", e.target.value)}
                          className="w-32"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">End Time</Label>
                        <Input
                          type="time"
                          value={day.endTime}
                          onChange={(e) => updateAvailability(day.dayOfWeek, "endTime", e.target.value)}
                          className="w-32"
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}
              <div className="pt-4 space-y-2">
                <Label>Buffer Time Between Bookings</Label>
                <Select
                  value={bufferMinutes.toString()}
                  onValueChange={(value) => setBufferMinutes(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No buffer</SelectItem>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <div className="p-6 pt-0">
              {isLoading && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>Creating your account...</span>
                    <span>{loadingProgress}%</span>
                  </div>
                  <Progress value={loadingProgress} className="h-2" />
                </div>
              )}
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack} disabled={isLoading}>Back</Button>
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Step 4: Success */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl">🎉 You're All Set!</CardTitle>
              <CardDescription className="text-center">
                Your booking page is ready to accept appointments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <Label className="text-sm font-medium mb-2 block">Your Booking Page URL:</Label>
                <div className="flex gap-2">
                  <Input value={bookingUrl} readOnly className="font-mono text-sm" />
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(bookingUrl)
                      toast.success("Copied to clipboard!")
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Share this link with your customers so they can book appointments with you!
                </p>
              </div>
            </CardContent>
            <div className="p-6 pt-0 flex flex-col gap-3">
              <Button onClick={() => router.push("/dashboard")} className="w-full">
                Go to Dashboard
              </Button>
              <Button variant="outline" onClick={() => window.open(bookingUrl, "_blank")} className="w-full">
                View Booking Page
              </Button>
            </div>
          </Card>
        )}

        {currentStep < 4 && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
