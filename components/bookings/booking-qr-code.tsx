"use client"

import { QRCodeSVG } from "qrcode.react"

interface BookingQRCodeProps {
  bookingId: string
  size?: number
  level?: "L" | "M" | "Q" | "H"
}

export function BookingQRCode({ bookingId, size = 200, level = "H" }: BookingQRCodeProps) {
  const checkInUrl = `${process.env.NEXT_PUBLIC_APP_URL}/check-in/${bookingId}`

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="p-4 bg-white rounded-lg border">
        <QRCodeSVG
          value={checkInUrl}
          size={size}
          level={level}
          includeMargin={true}
        />
      </div>
      <p className="text-sm text-muted-foreground text-center">
        Scan this QR code at check-in
      </p>
    </div>
  )
}
