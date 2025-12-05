import { PaymentSettingsForm } from "@/components/settings/payment-settings-form"

export default function PaymentSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure your Razorpay payment gateway and refund policies
        </p>
      </div>

      <PaymentSettingsForm />
    </div>
  )
}
