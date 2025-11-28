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
} from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const notificationsSchema = z.object({
  emailNotifications: z.boolean(),
  notifyOnNewBooking: z.boolean(),
  notifyOnCancellation: z.boolean(),
  notifyOnReschedule: z.boolean(),
  reminderEmailEnabled: z.boolean(),
  reminderEmailHours: z.number().min(1).max(168),
})

type NotificationsValues = z.infer<typeof notificationsSchema>

export default function NotificationsForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  const form = useForm<NotificationsValues>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      emailNotifications: true,
      notifyOnNewBooking: true,
      notifyOnCancellation: true,
      notifyOnReschedule: true,
      reminderEmailEnabled: true,
      reminderEmailHours: 24,
    },
  })

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch("/api/settings/notifications")
        if (response.ok) {
          const data = await response.json()
          form.reset(data)
        }
      } catch (error) {
        toast.error("Failed to load notification settings")
      } finally {
        setIsFetching(false)
      }
    }

    fetchNotifications()
  }, [form])

  async function onSubmit(data: NotificationsValues) {
    setIsLoading(true)
    try {
      const response = await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        router.refresh()
        toast.success("Notification settings updated successfully")
      } else {
        throw new Error("Failed to update settings")
      }
    } catch (error) {
      toast.error("Failed to update notification settings")
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return <FormSkeleton />
  }

  const reminderEnabled = form.watch("reminderEmailEnabled")

  return (
    <>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Manage how you receive notifications about bookings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="emailNotifications"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Email Notifications</FormLabel>
                    <FormDescription>
                      Receive email notifications for booking events
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notifyOnNewBooking"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">New Booking Notifications</FormLabel>
                    <FormDescription>
                      Get notified when a customer makes a new booking
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notifyOnCancellation"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Cancellation Notifications</FormLabel>
                    <FormDescription>
                      Get notified when a customer cancels a booking
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notifyOnReschedule"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Reschedule Notifications</FormLabel>
                    <FormDescription>
                      Get notified when a customer reschedules a booking
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reminderEmailEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Reminder Emails</FormLabel>
                    <FormDescription>
                      Send reminder emails to customers before appointments
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {reminderEnabled && (
              <FormField
                control={form.control}
                name="reminderEmailHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reminder Time (hours before appointment)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      How many hours before the appointment to send the reminder
                    </FormDescription>
                  </FormItem>
                )}
              />
            )}

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
