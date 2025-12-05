"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"
import { Loader2, CreditCard, Shield, RefreshCw } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface PaymentSettings {
  razorpayEnabled: boolean
  razorpayKeyId: string | null
  razorpayMode: string
  acceptOnlinePayment: boolean
  acceptCashPayment: boolean
  requireAdvancePayment: boolean
  advancePaymentPercent: number
  allowRefunds: boolean
  refundPercentage: number
}

export function PaymentSettingsForm() {
  const [settings, setSettings] = useState<PaymentSettings>({
    razorpayEnabled: false,
    razorpayKeyId: null,
    razorpayMode: "test",
    acceptOnlinePayment: true,
    acceptCashPayment: true,
    requireAdvancePayment: false,
    advancePaymentPercent: 100,
    allowRefunds: true,
    refundPercentage: 100,
  })

  const [keySecret, setKeySecret] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings/payment")
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      toast.error("Failed to load payment settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/settings/payment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          ...(keySecret && { razorpayKeySecret: keySecret }),
        }),
      })

      if (response.ok) {
        toast.success("Payment settings saved successfully")
        setKeySecret("") // Clear secret after saving
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      toast.error("Failed to save payment settings")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Razorpay Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Razorpay Configuration
          </CardTitle>
          <CardDescription>
            Configure your Razorpay payment gateway credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Online Payments</Label>
              <p className="text-sm text-muted-foreground">
                Accept payments through Razorpay
              </p>
            </div>
            <Switch
              checked={settings.razorpayEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, razorpayEnabled: checked })
              }
            />
          </div>

          {settings.razorpayEnabled && (
            <>
              <Separator />

              <div className="space-y-2">
                <Label>Mode</Label>
                <Select
                  value={settings.razorpayMode}
                  onValueChange={(value) =>
                    setSettings({ ...settings, razorpayMode: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">Test Mode</SelectItem>
                    <SelectItem value="live">Live Mode</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Use test mode for development, live mode for production
                </p>
              </div>

              <div className="space-y-2">
                <Label>Razorpay Key ID</Label>
                <Input
                  placeholder="rzp_test_xxxxx or rzp_live_xxxxx"
                  value={settings.razorpayKeyId || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, razorpayKeyId: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Razorpay Key Secret</Label>
                <Input
                  type="password"
                  placeholder="Enter to update (leave blank to keep existing)"
                  value={keySecret}
                  onChange={(e) => setKeySecret(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Your secret key is encrypted and never shown
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Payment Options
          </CardTitle>
          <CardDescription>
            Configure which payment methods to accept
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Accept Online Payment</Label>
              <p className="text-sm text-muted-foreground">
                Allow customers to pay online via Razorpay
              </p>
            </div>
            <Switch
              checked={settings.acceptOnlinePayment}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, acceptOnlinePayment: checked })
              }
              disabled={!settings.razorpayEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Accept Cash Payment</Label>
              <p className="text-sm text-muted-foreground">
                Allow customers to pay cash at the venue
              </p>
            </div>
            <Switch
              checked={settings.acceptCashPayment}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, acceptCashPayment: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Advance Payment</Label>
              <p className="text-sm text-muted-foreground">
                Make payment mandatory before booking confirmation
              </p>
            </div>
            <Switch
              checked={settings.requireAdvancePayment}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, requireAdvancePayment: checked })
              }
            />
          </div>

          {settings.requireAdvancePayment && (
            <div className="space-y-2">
              <Label>Advance Payment Amount: {settings.advancePaymentPercent}%</Label>
              <Slider
                value={[settings.advancePaymentPercent]}
                onValueChange={(value) =>
                  setSettings({ ...settings, advancePaymentPercent: value[0] })
                }
                min={0}
                max={100}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>0% (No advance)</span>
                <span>50% (Half payment)</span>
                <span>100% (Full payment)</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refund Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Refund Policy
          </CardTitle>
          <CardDescription>
            Configure refund settings for cancelled bookings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Refunds</Label>
              <p className="text-sm text-muted-foreground">
                Enable refunds for cancelled bookings
              </p>
            </div>
            <Switch
              checked={settings.allowRefunds}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, allowRefunds: checked })
              }
            />
          </div>

          {settings.allowRefunds && (
            <div className="space-y-2">
              <Label>Refund Percentage: {settings.refundPercentage}%</Label>
              <Slider
                value={[settings.refundPercentage]}
                onValueChange={(value) =>
                  setSettings({ ...settings, refundPercentage: value[0] })
                }
                min={0}
                max={100}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>0% (No refund)</span>
                <span>50% (Half refund)</span>
                <span>100% (Full refund)</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Percentage of payment amount to refund on cancellation
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Payment Settings
        </Button>
      </div>
    </div>
  )
}
