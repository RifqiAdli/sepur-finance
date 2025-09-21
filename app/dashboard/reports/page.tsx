import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ReportsOverview } from "@/components/reports/reports-overview"
import { ExportActions } from "@/components/reports/export-actions"

export default async function ReportsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get financial metrics
  const { data: metrics } = await supabase.from("financial_metrics").select("*").single()

  // Get monthly revenue data
  const { data: monthlyData } = await supabase.rpc("get_monthly_revenue", { months_back: 12 })

  // Get top clients
  const { data: topClients } = await supabase.rpc("get_top_clients", { limit_count: 10 })

  // Get recent invoices and payments for summary
  const { data: recentInvoices } = await supabase
    .from("invoice_summary")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10)

  const { data: recentPayments } = await supabase
    .from("payments")
    .select(
      `
      *,
      invoices!inner(
        invoice_number,
        clients!inner(name)
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Generate comprehensive financial reports and export data</p>
        </div>
        <ExportActions />
      </div>

      {/* Reports Overview */}
      <ReportsOverview
        metrics={metrics}
        monthlyData={monthlyData || []}
        topClients={topClients || []}
        recentInvoices={recentInvoices || []}
        recentPayments={recentPayments || []}
      />
    </div>
  )
}
