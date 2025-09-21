import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { NotificationsList } from "@/components/notifications/notifications-list"
import { NotificationSettings } from "@/components/notifications/notification-settings"
import { NotificationStats } from "@/components/notifications/notification-stats"

export default async function NotificationsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get notifications for the user
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  // Get notification stats
  const { data: stats } = await supabase
    .from("notifications")
    .select("type, read, created_at")
    .eq("user_id", data.user.id)

  // Get user notification preferences
  const { data: preferences } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", data.user.id)
    .single()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-600">Stay updated with important financial alerts and reminders</p>
      </div>

      {/* Stats */}
      <NotificationStats notifications={stats || []} />

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NotificationsList notifications={notifications || []} />
        </div>
        <div>
          <NotificationSettings preferences={preferences} />
        </div>
      </div>
    </div>
  )
}
