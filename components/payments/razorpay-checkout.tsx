"use client"

import { useEffect } from "react"
import Script from "next/script"
import { toast } from "sonner"

interface RazorpayCheckoutProps {
  orderId: string
  amount: number
  currency: string
  keyId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  businessName: string
  onSuccess: (response: any) => void
  onFailure: (error: any) => void
}

declare global {
  interface Window {
    Razorpay: any
  }
}

export function RazorpayCheckout({
  orderId,
  amount,
  currency,
  keyId,
  customerName,
  customerEmail,
  customerPhone,
  businessName,
  onSuccess,
  onFailure,
}: RazorpayCheckoutProps) {
  const handlePayment = () => {
    if (!window.Razorpay) {
      toast.error("Payment gateway not loaded. Please refresh the page.")
      return
    }

    const options = {
      key: keyId,
      amount: amount, // Amount in paise
      currency: currency,
      name: businessName,
      description: "Booking Payment",
      order_id: orderId,
      prefill: {
        name: customerName,
        email: customerEmail,
        contact: customerPhone,
      },
      theme: {
        color: "#6366f1",
      },
      handler: function (response: any) {
        onSuccess(response)
      },
      modal: {
        ondismiss: function () {
          onFailure({ error: "Payment cancelled by user" })
        },
      },
    }

    const razorpay = new window.Razorpay(options)
    razorpay.on("payment.failed", function (response: any) {
      onFailure(response.error)
    })
    razorpay.open()
  }

  return (
    <Script
      src="https://checkout.razorpay.com/v1/checkout.js"
      onLoad={handlePayment}
      onError={() => {
        toast.error("Failed to load payment gateway")
        onFailure({ error: "Payment gateway failed to load" })
      }}
    />
  )
}
