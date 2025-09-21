"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"

interface NotificationSettingsProps {
  preferences: any
}

export function NotificationSettings({ preferences: initialPreferences }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState(
    initialPreferences || {
      overdue_invoices: true,
      payment_reminders: true,
      payment_received: true,
      invoice_created: false,
      system_updates: true,
      email_notifications: true,
      reminder_frequency: "daily",
    },
  )
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleToggle = (key: string, value: boolean) => {
    setPreferences((prev: any) => ({ ...prev, [key]: value }))
  }

  const handleSelectChange = (key: string, value: string) => {
    setPreferences((prev: any) => ({ ...prev, [key]: value }))
  }

  const savePreferences = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("Not authenticated")

      const { error } = await supabase.from("notification_preferences").upsert({
        user_id: user.user.id,
        ...preferences,
      })

      if (error) throw error

      setMessage("Preferences saved successfully!")
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notification Types */}
        <div className="space-y-4">
          <h3 className="font-medium">Notification Types</h3>

          <div className="flex items-center justify-between">
            <Label htmlFor="overdue_invoices" className="text-sm">
              Overdue Invoice Alerts
            </Label>
            <Switch
              id="overdue_invoices"
              checked={preferences.overdue_invoices}
              onCheckedChange={(checked) => handleToggle("overdue_invoices", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="payment_reminders" className="text-sm">
              Payment Reminders
            </Label>
            <Switch
              id="payment_reminders"
              checked={preferences.payment_reminders}
              onCheckedChange={(checked) => handleToggle("payment_reminders", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="payment_received" className="text-sm">
              Payment Received
            </Label>
            <Switch
              id="payment_received"
              checked={preferences.payment_received}
              onCheckedChange={(checked) => handleToggle("payment_received", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="invoice_created" className="text-sm">
              New Invoice Created
            </Label>
            <Switch
              id="invoice_created"
              checked={preferences.invoice_created}
              onCheckedChange={(checked) => handleToggle("invoice_created", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="system_updates" className="text-sm">
              System Updates
            </Label>
            <Switch
              id="system_updates"
              checked={preferences.system_updates}
              onCheckedChange={(checked) => handleToggle("system_updates", checked)}
            />
          </div>
        </div>

        {/* Email Settings */}
        <div className="space-y-4">
          <h3 className="font-medium">Email Notifications</h3>

          <div className="flex items-center justify-between">
            <Label htmlFor="email_notifications" className="text-sm">
              Send Email Notifications
            </Label>
            <Switch
              id="email_notifications"
              checked={preferences.email_notifications}
              onCheckedChange={(checked) => handleToggle("email_notifications", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Reminder Frequency</Label>
            <Select
              value={preferences.reminder_frequency}
              onValueChange={(value) => handleSelectChange("reminder_frequency", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Save Button */}
        <div className="space-y-3">
          {message && (
            <div
              className={`p-3 text-sm rounded-md ${
                message.startsWith("Error")
                  ? "text-red-600 bg-red-50 border border-red-200"
                  : "text-green-600 bg-green-50 border border-green-200"
              }`}
            >
              {message}
            </div>
          )}
          <Button onClick={savePreferences} disabled={isLoading} className="w-full">
            {isLoading ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
