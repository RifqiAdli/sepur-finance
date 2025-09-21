"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "@/components/dashboard/metric-card"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { TopClientsChart } from "@/components/reports/top-clients-chart"
import { RecentActivity } from "@/components/reports/recent-activity"
import { DollarSign, FileText, AlertCircle, CheckCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface ReportsOverviewProps {
  metrics: any
  monthlyData: any[]
  topClients: any[]
  recentInvoices: any[]
  recentPayments: any[]
}

export function ReportsOverview({
  metrics,
  monthlyData,
  topClients,
  recentInvoices,
  recentPayments,
}: ReportsOverviewProps) {
  // Format chart data
  const chartData = monthlyData.map((item: any) => ({
    month: new Date(item.month_year + "-01").toLocaleDateString("en-US", { month: "short" }),
    revenue: Number(item.revenue) || 0,
    payments: Number(item.payments) || 0,
  }))

  const totalRevenue = metrics?.total_revenue || 0
  const paidRevenue = metrics?.paid_revenue || 0
  const pendingRevenue = metrics?.pending_revenue || 0
  const overdueRevenue = metrics?.overdue_revenue || 0
  const totalInvoices = metrics?.total_invoices || 0
  const paidCount = metrics?.paid_count || 0

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          description="All-time revenue"
        />
        <MetricCard
          title="Collection Rate"
          value={`${totalRevenue > 0 ? Math.round((paidRevenue / totalRevenue) * 100) : 0}%`}
          change={`${formatCurrency(paidRevenue)} collected`}
          changeType="positive"
          icon={CheckCircle}
        />
        <MetricCard
          title="Outstanding"
          value={formatCurrency(totalRevenue - paidRevenue)}
          change={`${totalInvoices - paidCount} invoices pending`}
          changeType="neutral"
          icon={FileText}
        />
        <MetricCard
          title="Overdue Amount"
          value={formatCurrency(overdueRevenue)}
          change={overdueRevenue > 0 ? "Requires attention" : "All current"}
          changeType={overdueRevenue > 0 ? "negative" : "positive"}
          icon={AlertCircle}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart data={chartData} />
        <TopClientsChart clients={topClients} />
      </div>

      {/* Recent Activity */}
      <RecentActivity invoices={recentInvoices} payments={recentPayments} />

      {/* Export Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Financial Summary</h3>
              <p className="text-sm text-gray-600 mb-3">
                Complete overview of revenue, payments, and outstanding amounts
              </p>
              <div className="text-xs text-gray-500">Available: PDF, Excel, CSV</div>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Invoice Report</h3>
              <p className="text-sm text-gray-600 mb-3">Detailed list of all invoices with status and payment info</p>
              <div className="text-xs text-gray-500">Available: PDF, Excel, CSV</div>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Payment Report</h3>
              <p className="text-sm text-gray-600 mb-3">Transaction history and payment method analysis</p>
              <div className="text-xs text-gray-500">Available: PDF, Excel, CSV</div>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Client Report</h3>
              <p className="text-sm text-gray-600 mb-3">Client performance and revenue contribution analysis</p>
              <div className="text-xs text-gray-500">Available: PDF, Excel, CSV</div>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Monthly Analysis</h3>
              <p className="text-sm text-gray-600 mb-3">Month-over-month trends and growth analysis</p>
              <div className="text-xs text-gray-500">Available: PDF, Excel, CSV</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
