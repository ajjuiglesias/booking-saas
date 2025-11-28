"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { FormSkeleton } from "@/components/ui/form-skeletons"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const bookingSettingsSchema = z.object({
  minNoticeHours: z.number().min(0, "Must be at least 0 hours").max(168, "Cannot exceed 1 week"),
  maxAdvanceDays: z.number().min(1, "Must be at least 1 day").max(365, "Cannot exceed 1 year"),
  bufferMinutes: z.number().min(0, "Must be at least 0 minutes").max(120, "Cannot exceed 2 hours"),
  bookingMessage: z.string().optional(),
  cancellationPolicy: z.string().min(1, "Please select a policy"),
  cancellationHours: z.number().min(0, "Must be at least 0 hours").max(168, "Cannot exceed 1 week"),
})

type BookingSettingsValues = z.infer<typeof bookingSettingsSchema>

export default function BookingSettingsForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  const form = useForm<BookingSettingsValues>({
    resolver: zodResolver(bookingSettingsSchema),
    defaultValues: {
      minNoticeHours: 2,
      maxAdvanceDays: 30,
      bufferMinutes: 0,
      bookingMessage: "",
      cancellationPolicy: "flexible",
      cancellationHours: 24,
    },
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings/booking")
        if (response.ok) {
          const data = await response.json()
          form.reset({
            minNoticeHours: data.minNoticeHours || 2,
            maxAdvanceDays: data.maxAdvanceDays || 30,
            bufferMinutes: data.bufferMinutes || 0,
            bookingMessage: data.bookingMessage || "",
            cancellationPolicy: data.cancellationPolicy || "flexible",
            cancellationHours: data.cancellationHours || 24,
          })
        }
      } catch (error) {
        toast.error("Failed to load booking settings")
      } finally {
        setIsFetching(false)
      }
    }

    fetchSettings()
  }, [form])

  async function onSubmit(data: BookingSettingsValues) {
    setIsLoading(true)
    try {
      const response = await fetch("/api/settings/booking", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        router.refresh()
        toast.success("Booking settings updated successfully")
      } else {
        throw new Error("Failed to update settings")
      }
    } catch (error) {
      toast.error("Failed to update booking settings")
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return <FormSkeleton />
  }

  return (
    <>
      <CardHeader>
        <CardTitle>Booking Settings</CardTitle>
        <CardDescription>
          Configure how customers can book appointments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="minNoticeHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Notice (hours)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    How far in advance customers must book (e.g., 2 hours)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxAdvanceDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Advance Booking (days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    How far into the future customers can book (e.g., 30 days)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bufferMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Buffer Time (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Time between appointments for preparation/cleanup
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bookingMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Booking Confirmation Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Thank you for booking with us! We look forward to seeing you."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This message will be shown to customers after booking
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cancellationPolicy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cancellation Policy</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a policy" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="flexible">Flexible - Free cancellation</SelectItem>
                      <SelectItem value="moderate">Moderate - Cancellation fee may apply</SelectItem>
                      <SelectItem value="strict">Strict - No refunds</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cancellationHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cancellation Notice (hours)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    How far in advance customers can cancel (e.g., 24 hours)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </>
  )
}
