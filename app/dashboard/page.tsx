import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { MetricCard } from "@/components/dashboard/metric-card"
import { RecentInvoices } from "@/components/dashboard/recent-invoices"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { DollarSign, FileText, Users, TrendingUp, AlertCircle, CheckCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get financial metrics
  const { data: metrics } = await supabase.from("financial_metrics").select("*").single()

  // Get recent invoices
  const { data: recentInvoices } = await supabase
    .from("invoice_summary")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  // Get monthly revenue data
  const { data: monthlyData } = await supabase.rpc("get_monthly_revenue", { months_back: 6 })

  // Format chart data
  const chartData =
    monthlyData?.map((item: any) => ({
      month: new Date(item.month_year + "-01").toLocaleDateString("en-US", { month: "short" }),
      revenue: Number(item.revenue) || 0,
      payments: Number(item.payments) || 0,
    })) || []

  const totalRevenue = metrics?.total_revenue || 0
  const paidRevenue = metrics?.paid_revenue || 0
  const pendingRevenue = metrics?.pending_revenue || 0
  const overdueRevenue = metrics?.overdue_revenue || 0
  const totalInvoices = metrics?.total_invoices || 0
  const paidCount = metrics?.paid_count || 0

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
        <p className="text-gray-600">Here's what's happening with your finances today.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          description="All-time revenue"
        />
        <MetricCard
          title="Paid Revenue"
          value={formatCurrency(paidRevenue)}
          change={`${totalRevenue > 0 ? Math.round((paidRevenue / totalRevenue) * 100) : 0}% of total`}
          changeType="positive"
          icon={CheckCircle}
        />
        <MetricCard
          title="Pending Revenue"
          value={formatCurrency(pendingRevenue)}
          change={`${totalInvoices > 0 ? Math.round((pendingRevenue / totalRevenue) * 100) : 0}% of total`}
          changeType="neutral"
          icon={FileText}
        />
        <MetricCard
          title="Overdue Revenue"
          value={formatCurrency(overdueRevenue)}
          change={overdueRevenue > 0 ? "Needs attention" : "All good"}
          changeType={overdueRevenue > 0 ? "negative" : "positive"}
          icon={AlertCircle}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Total Invoices"
          value={totalInvoices.toString()}
          description="All invoices created"
          icon={FileText}
        />
        <MetricCard
          title="Paid Invoices"
          value={paidCount.toString()}
          change={`${totalInvoices > 0 ? Math.round((paidCount / totalInvoices) * 100) : 0}% completion rate`}
          changeType="positive"
          icon={CheckCircle}
        />
        <MetricCard
          title="Outstanding Amount"
          value={formatCurrency(totalRevenue - paidRevenue)}
          description="Amount yet to be collected"
          icon={TrendingUp}
        />
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart data={chartData} />
        <RecentInvoices invoices={recentInvoices || []} />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <a
            href="/dashboard/invoices/new"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium">Create Invoice</p>
            </div>
          </a>
          <a
            href="/dashboard/clients/new"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium">Add Client</p>
            </div>
          </a>
          <a
            href="/dashboard/payments/new"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-center">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium">Record Payment</p>
            </div>
          </a>
          <a
            href="/dashboard/reports"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium">View Reports</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
