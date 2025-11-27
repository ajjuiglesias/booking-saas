"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

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
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const appearanceSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
})

type AppearanceValues = z.infer<typeof appearanceSchema>

export default function AppearanceForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  const form = useForm<AppearanceValues>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: {
      primaryColor: "#6366f1",
    },
  })

  useEffect(() => {
    const fetchAppearance = async () => {
      try {
        const response = await fetch("/api/settings/appearance")
        if (response.ok) {
          const data = await response.json()
          form.reset({
            primaryColor: data.primaryColor || "#6366f1",
          })
        }
      } catch (error) {
        toast.error("Failed to load appearance settings")
      } finally {
        setIsFetching(false)
      }
    }

    fetchAppearance()
  }, [form])

  async function onSubmit(data: AppearanceValues) {
    setIsLoading(true)
    try {
      const response = await fetch("/api/settings/appearance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        router.refresh()
        toast.success("Appearance updated successfully")
      } else {
        throw new Error("Failed to update appearance")
      }
    } catch (error) {
      toast.error("Failed to update appearance")
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const currentColor = form.watch("primaryColor")

  return (
    <>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize the look and feel of your booking page
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="primaryColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Color</FormLabel>
                  <div className="flex gap-4 items-center">
                    <FormControl>
                      <Input type="color" {...field} className="w-20 h-10" />
                    </FormControl>
                    <Input
                      type="text"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="#6366f1"
                      className="flex-1"
                    />
                  </div>
                  <FormDescription>
                    This color will be used for buttons and accents on your booking page
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color Preview */}
            <div className="border rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium">Preview</p>
              <div className="flex gap-2">
                <Button style={{ backgroundColor: currentColor }}>
                  Sample Button
                </Button>
                <Button variant="outline" style={{ borderColor: currentColor, color: currentColor }}>
                  Outline Button
                </Button>
              </div>
            </div>

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
