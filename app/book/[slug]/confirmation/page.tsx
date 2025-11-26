"use client"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Calendar, Clock, MapPin } from "lucide-react"
import Link from "next/link"

export default function ConfirmationPage() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get("id")

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
          <CardDescription>
            Your appointment has been successfully scheduled.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg text-left space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-indigo-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Date</p>
                <p className="text-sm text-gray-600">Check your email for details</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-indigo-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Time</p>
                <p className="text-sm text-gray-600">Please arrive 5 mins early</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            A confirmation email has been sent to your inbox.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button className="w-full" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
