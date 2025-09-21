"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { Bell, AlertTriangle, DollarSign, FileText, CheckCircle, X, Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  created_at: string
  data?: any
}

interface NotificationsListProps {
  notifications: Notification[]
}

export function NotificationsList({ notifications: initialNotifications }: NotificationsListProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [isLoading, setIsLoading] = useState(false)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "overdue_invoice":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case "payment_received":
        return <DollarSign className="h-5 w-5 text-green-500" />
      case "invoice_created":
        return <FileText className="h-5 w-5 text-blue-500" />
      case "payment_reminder":
        return <Bell className="h-5 w-5 text-yellow-500" />
      case "system":
        return <CheckCircle className="h-5 w-5 text-gray-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "overdue_invoice":
        return "bg-red-100 text-red-800"
      case "payment_received":
        return "bg-green-100 text-green-800"
      case "invoice_created":
        return "bg-blue-100 text-blue-800"
      case "payment_reminder":
        return "bg-yellow-100 text-yellow-800"
      case "system":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const markAsRead = async (notificationId: string) => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notificationId)

      if (!error) {
        setNotifications((prev) =>
          prev.map((notif) => (notif.id === notificationId ? { ...notif, read: true } : notif)),
        )
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsUnread = async (notificationId: string) => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("notifications").update({ read: false }).eq("id", notificationId)

      if (!error) {
        setNotifications((prev) =>
          prev.map((notif) => (notif.id === notificationId ? { ...notif, read: false } : notif)),
        )
      }
    } catch (error) {
      console.error("Error marking notification as unread:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

      if (!error) {
        setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId))
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAllAsRead = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.user.id)
        .eq("read", false)

      if (!error) {
        setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
      }
    } catch (error) {
      console.error("Error marking all as read:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Notifications</CardTitle>
          {unreadCount > 0 && <p className="text-sm text-gray-600">{unreadCount} unread notifications</p>}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={isLoading}>
            Mark All Read
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
            <p className="text-gray-600">You'll see important updates and alerts here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border rounded-lg ${!notification.read ? "bg-blue-50 border-blue-200" : "bg-white"}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900">{notification.title}</h4>
                      <Badge className={getNotificationColor(notification.type)} variant="secondary">
                        {notification.type.replace("_", " ")}
                      </Badge>
                      {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <p className="text-xs text-gray-500">{formatDate(notification.created_at)}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {notification.read ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsUnread(notification.id)}
                        disabled={isLoading}
                      >
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        disabled={isLoading}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
