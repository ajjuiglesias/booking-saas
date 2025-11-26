"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

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
        setBufferMinutes(data.bufferMinutes)
      }
    } catch (error) {
      toast.error("Failed to load settings")
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
          bufferMinutes
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

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
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
          {availability.map((day) => (
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
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Booking Settings</CardTitle>
          <CardDescription>Configure buffer times and limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-xs">
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
        </CardContent>
      </Card>
    </div>
  )
}
