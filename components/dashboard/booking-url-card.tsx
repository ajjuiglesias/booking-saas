"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface BookingUrlCardProps {
  bookingUrl: string
}

export function BookingUrlCard({ bookingUrl }: BookingUrlCardProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(bookingUrl)
    toast.success("Booking URL copied to clipboard!")
  }

  const handleOpen = () => {
    window.open(bookingUrl, '_blank')
  }

  return (
    <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border-indigo-200 dark:border-indigo-800">
      <CardHeader>
        <CardTitle className="text-lg dark:text-white">Your Booking Page</CardTitle>
        <CardDescription>Share this link with your customers to accept bookings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 dark:text-gray-100 rounded-md text-sm font-mono border dark:border-gray-700">
            {bookingUrl}
          </code>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleOpen}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
