import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Plus } from "lucide-react"
import Link from "next/link"

interface Payment {
  id: string
  payment_number: string
  amount: number
  payment_method: string
  payment_date: string
  reference_number: string
  status: string
  notes: string
}

interface PaymentHistoryProps {
  payments: Payment[]
  invoiceId: string
}

export function PaymentHistory({ payments, invoiceId }: PaymentHistoryProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatMethod = (method: string) => {
    return method
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Payment History</CardTitle>
        <Button asChild size="sm">
          <Link href={`/dashboard/payments/new?invoice=${invoiceId}`}>
            <Plus className="h-4 w-4 mr-2" />
            Add Payment
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No payments recorded yet</p>
            <Button asChild>
              <Link href={`/dashboard/payments/new?invoice=${invoiceId}`}>Record First Payment</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="font-medium">{payment.payment_number}</p>
                    <Badge className={getStatusColor(payment.status)} variant="secondary">
                      {payment.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {formatMethod(payment.payment_method)} • {formatDate(payment.payment_date)}
                  </p>
                  {payment.reference_number && <p className="text-xs text-gray-500">Ref: {payment.reference_number}</p>}
                  {payment.notes && <p className="text-xs text-gray-500 mt-1">{payment.notes}</p>}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">{formatCurrency(payment.amount)}</p>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/dashboard/payments/${payment.id}`}>View Details</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
