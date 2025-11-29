"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2, Upload, X, ImageIcon } from "lucide-react"
import { FormSkeleton } from "@/components/ui/form-skeletons"
import Image from "next/image"

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
  
  // Logo upload state
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
          setLogoUrl(data.logoUrl || null)
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Only PNG, JPG, JPEG, WebP, and GIF are allowed.")
      return
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 2MB.")
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload immediately
    handleUpload(file)
  }

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload/logo", {
        method: "POST",
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setLogoUrl(data.logoUrl)
        setPreviewUrl(null)
        toast.success("Logo uploaded successfully!")
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to upload logo")
        setPreviewUrl(null)
      }
    } catch (error) {
      toast.error("Failed to upload logo")
      setPreviewUrl(null)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemove = async () => {
    if (!confirm("Are you sure you want to remove your logo?")) return

    setIsRemoving(true)
    try {
      const response = await fetch("/api/upload/logo", {
        method: "DELETE"
      })

      if (response.ok) {
        setLogoUrl(null)
        setPreviewUrl(null)
        toast.success("Logo removed successfully!")
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to remove logo")
      }
    } catch (error) {
      toast.error("Failed to remove logo")
    } finally {
      setIsRemoving(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  if (isFetching) {
    return <FormSkeleton />
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
            {/* Logo Upload Section */}
            <div className="space-y-4 pb-6 border-b">
              <div>
                <h3 className="text-lg font-medium">Business Logo</h3>
                <p className="text-sm text-muted-foreground">
                  Upload your business logo to display on your booking page and in emails.
                </p>
              </div>
              
              <div className="flex items-start gap-6">
                {/* Logo Preview */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                    {previewUrl ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={previewUrl}
                          alt="Logo preview"
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                    ) : logoUrl ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={logoUrl}
                          alt="Business logo"
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                    ) : (
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Upload Controls */}
                <div className="flex-1 space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={triggerFileInput}
                      disabled={isUploading || isRemoving}
                      variant="outline"
                      className="gap-2"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload Logo
                        </>
                      )}
                    </Button>

                    {logoUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleRemove}
                        disabled={isUploading || isRemoving}
                        className="gap-2"
                      >
                        {isRemoving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Removing...
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4" />
                            Remove
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Supported formats: PNG, JPG, JPEG, WebP, GIF</p>
                    <p>• Maximum size: 2MB</p>
                    <p>• Recommended: 200x200 pixels or larger</p>
                  </div>
                </div>
              </div>
            </div>

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
