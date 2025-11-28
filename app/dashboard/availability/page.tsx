"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { AvailabilitySkeleton } from "@/components/ui/availability-skeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"

interface AvailabilityDay {
  dayOfWeek: number
  startTime: string
  endTime: string
  isAvailable: boolean
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default function AvailabilityPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [availability, setAvailability] = useState<AvailabilityDay[]>([])
  const [bufferMinutes, setBufferMinutes] = useState(0)
  const [slotDuration, setSlotDuration] = useState(30) // Default 30 minutes
  const [blockedDates, setBlockedDates] = useState<Date[]>([])

  useEffect(() => {
    fetchAvailability()
  }, [])

  const fetchAvailability = async () => {
    try {
      const response = await fetch("/api/availability")
      if (response.ok) {
        const data = await response.json()
        
        // Ensure all days are present
        const fullAvailability = Array.from({ length: 7 }).map((_, i) => {
          const existing = data.availability.find((a: any) => a.dayOfWeek === i)
          return existing || {
            dayOfWeek: i,
            startTime: "09:00",
            endTime: "17:00",
            isAvailable: false
          }
        })
        
        setAvailability(fullAvailability)
        setBufferMinutes(data.bufferMinutes || 0)
        setSlotDuration(data.slotDuration || 30)
        
        // Load blocked dates
        if (data.blockedDates && Array.isArray(data.blockedDates)) {
          const dates = data.blockedDates.map((bd: any) => new Date(bd.date))
          setBlockedDates(dates)
        }
      } else {
        throw new Error("Failed to load")
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to load settings, using defaults")
      // Fallback to defaults
      const defaultAvailability = Array.from({ length: 7 }).map((_, i) => ({
        dayOfWeek: i,
        startTime: "09:00",
        endTime: "17:00",
        isAvailable: false
      }))
      setAvailability(defaultAvailability)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availability: availability.filter(a => a.isAvailable),
          bufferMinutes,
          slotDuration,
          blockedDates: blockedDates.map(date => date.toISOString())
        })
      })

      if (response.ok) {
        toast.success("Availability saved")
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      toast.error("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const updateDay = (dayIndex: number, field: keyof AvailabilityDay, value: any) => {
    setAvailability(prev => prev.map(day => 
      day.dayOfWeek === dayIndex ? { ...day, [field]: value } : day
    ))
  }

  const copyToAll = (sourceDayIndex: number) => {
    const sourceDay = availability.find(d => d.dayOfWeek === sourceDayIndex)
    if (!sourceDay) return

    setAvailability(prev => prev.map(day => 
      day.dayOfWeek !== sourceDayIndex && day.isAvailable ? {
        ...day,
        startTime: sourceDay.startTime,
        endTime: sourceDay.endTime
      } : day
    ))
    toast.success("Copied hours to all active days")
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Availability</h2>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>Set your regular business hours</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            // Show skeletons for day rows while loading
            Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="w-40 flex items-center gap-3">
                  <Skeleton className="h-6 w-11 rounded-full" />
                  <Skeleton className="h-4 w-[80px]" />
                </div>
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-4 w-6" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                  <Skeleton className="h-9 w-[90px]" />
                </div>
              </div>
            ))
          ) : (
            availability.map((day) => (
              <div key={day.dayOfWeek} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="w-40 flex items-center gap-3">
                  <Switch
                    checked={day.isAvailable}
                    onCheckedChange={(checked) => updateDay(day.dayOfWeek, "isAvailable", checked)}
                  />
                  <span className="font-medium">{DAYS[day.dayOfWeek]}</span>
                </div>

                {day.isAvailable ? (
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={day.startTime}
                        onChange={(e) => updateDay(day.dayOfWeek, "startTime", e.target.value)}
                        className="w-32"
                      />
                      <span>to</span>
                      <Input
                        type="time"
                        value={day.endTime}
                        onChange={(e) => updateDay(day.dayOfWeek, "endTime", e.target.value)}
                        className="w-32"
                      />
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => copyToAll(day.dayOfWeek)}>
                      Copy to all
                    </Button>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm italic">Unavailable</div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Booking Settings</CardTitle>
          <CardDescription>Configure buffer times and limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 max-w-xs">
            {/* Time Slot Duration */}
            <div className="space-y-2">
              <Label>Time Slot Duration</Label>
              <Select
                value={slotDuration.toString()}
                onValueChange={(val) => setSlotDuration(parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Length of each available booking slot.
              </p>
            </div>

            {/* Buffer Time */}
            <div className="space-y-2">
              <Label>Buffer Time Between Appointments</Label>
              <Select
                value={bufferMinutes.toString()}
                onValueChange={(val) => setBufferMinutes(parseInt(val))}
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
                  <SelectItem value="60">1 hour</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Extra time added after each appointment for cleanup/prep.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Block Dates Card */}
      <Card>
        <CardHeader>
          <CardTitle>Block Dates</CardTitle>
          <CardDescription>
            Select dates when you're unavailable to accept bookings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Calendar
              mode="multiple"
              selected={blockedDates}
              onSelect={(dates) => setBlockedDates(dates || [])}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              className="rounded-md border"
            />
            {blockedDates.length > 0 && (
              <div className="space-y-2">
                <Label>Blocked Dates ({blockedDates.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {blockedDates.map((date, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm"
                    >
                      <span>{format(date, "MMM d, yyyy")}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setBlockedDates(blockedDates.filter((_, i) => i !== index))
                        }}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
