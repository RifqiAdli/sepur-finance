import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatShortDate } from "@/lib/utils"
import { FileText, CreditCard } from "lucide-react"

interface RecentActivityProps {
  invoices: any[]
  payments: any[]
}

export function RecentActivity({ invoices, payments }: RecentActivityProps) {
  // Combine and sort activities
  const activities = [
    ...invoices.slice(0, 5).map((invoice) => ({
      id: invoice.id,
      type: "invoice",
      title: `Invoice ${invoice.invoice_number}`,
      subtitle: invoice.client_name,
      amount: invoice.total_amount,
      status: invoice.status,
      date: invoice.created_at,
    })),
    ...payments.slice(0, 5).map((payment) => ({
      id: payment.id,
      type: "payment",
      title: `Payment ${payment.payment_number}`,
      subtitle: payment.invoices.clients.name,
      amount: payment.amount,
      status: payment.status,
      date: payment.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)

  const getStatusColor = (status: string, type: string) => {
    if (type === "invoice") {
      switch (status) {
        case "paid":
          return "bg-green-100 text-green-800"
        case "sent":
          return "bg-blue-100 text-blue-800"
        case "overdue":
          return "bg-red-100 text-red-800"
        case "draft":
          return "bg-gray-100 text-gray-800"
        default:
          return "bg-gray-100 text-gray-800"
      }
    } else {
      switch (status) {
        case "completed":
          return "bg-green-100 text-green-800"
        case "pending":
          return "bg-yellow-100 text-yellow-800"
        case "failed":
          return "bg-red-100 text-red-800"
        default:
          return "bg-gray-100 text-gray-800"
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={`${activity.type}-${activity.id}`} className="flex items-center space-x-4 p-3 border rounded-lg">
              <div className="flex-shrink-0">
                {activity.type === "invoice" ? (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-green-600" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="font-medium truncate">{activity.title}</p>
                  <Badge className={getStatusColor(activity.status, activity.type)} variant="secondary">
                    {activity.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 truncate">{activity.subtitle}</p>
                <p className="text-xs text-gray-500">{formatShortDate(activity.date)}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(activity.amount)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
