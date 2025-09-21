import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { type, reportType, dateRange } = await request.json()

    // Get data based on report type
    let data: any = {}

    switch (reportType) {
      case "financial_summary":
        const { data: metrics } = await supabase.from("financial_metrics").select("*").single()
        const { data: monthlyData } = await supabase.rpc("get_monthly_revenue", { months_back: 12 })
        data = { metrics, monthlyData }
        break

      case "invoice_report":
        const { data: invoices } = await supabase
          .from("invoice_summary")
          .select("*")
          .gte("created_at", dateRange.from)
          .lte("created_at", dateRange.to)
          .order("created_at", { ascending: false })
        data = { invoices }
        break

      case "payment_report":
        const { data: payments } = await supabase
          .from("payments")
          .select(
            `
            *,
            invoices!inner(
              invoice_number,
              clients!inner(name, company)
            )
          `,
          )
          .gte("payment_date", dateRange.from)
          .lte("payment_date", dateRange.to)
          .order("payment_date", { ascending: false })
        data = { payments }
        break

      case "client_report":
        const { data: topClients } = await supabase.rpc("get_top_clients", { limit_count: 50 })
        data = { clients: topClients }
        break

      case "monthly_analysis":
        const { data: analysis } = await supabase.rpc("get_monthly_revenue", { months_back: 12 })
        data = { analysis }
        break

      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }

    // Generate export based on type
    switch (type) {
      case "csv":
        const csv = generateCSV(data, reportType)
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="${reportType}_${new Date().toISOString().split("T")[0]}.csv"`,
          },
        })

      case "excel":
        // For now, return CSV with Excel MIME type
        // In production, you'd use a library like xlsx
        const excelData = generateCSV(data, reportType)
        return new NextResponse(excelData, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="${reportType}_${new Date().toISOString().split("T")[0]}.xlsx"`,
          },
        })

      case "pdf":
        const pdf = generatePDF(data, reportType)
        return new NextResponse(pdf, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${reportType}_${new Date().toISOString().split("T")[0]}.pdf"`,
          },
        })

      default:
        return NextResponse.json({ error: "Invalid export type" }, { status: 400 })
    }
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}

function generateCSV(data: any, reportType: string): string {
  switch (reportType) {
    case "invoice_report":
      const invoiceHeaders = [
        "Invoice Number",
        "Title",
        "Client",
        "Amount",
        "Tax Amount",
        "Total Amount",
        "Paid Amount",
        "Remaining",
        "Status",
        "Payment Status",
        "Issue Date",
        "Due Date",
      ]
      const invoiceRows = data.invoices?.map((inv: any) => [
        inv.invoice_number,
        inv.title,
        inv.client_name,
        inv.amount,
        inv.tax_amount,
        inv.total_amount,
        inv.paid_amount,
        inv.remaining_amount,
        inv.status,
        inv.payment_status,
        inv.issue_date,
        inv.due_date,
      ])
      return [invoiceHeaders, ...(invoiceRows || [])].map((row) => row.join(",")).join("\n")

    case "payment_report":
      const paymentHeaders = [
        "Payment Number",
        "Invoice Number",
        "Client",
        "Amount",
        "Payment Method",
        "Payment Date",
        "Reference Number",
        "Status",
      ]
      const paymentRows = data.payments?.map((pay: any) => [
        pay.payment_number,
        pay.invoices.invoice_number,
        pay.invoices.clients.name,
        pay.amount,
        pay.payment_method,
        pay.payment_date,
        pay.reference_number || "",
        pay.status,
      ])
      return [paymentHeaders, ...(paymentRows || [])].map((row) => row.join(",")).join("\n")

    case "client_report":
      const clientHeaders = ["Client Name", "Company", "Total Revenue", "Invoice Count", "Paid Amount"]
      const clientRows = data.clients?.map((client: any) => [
        client.client_name,
        client.client_company || "",
        client.total_revenue,
        client.invoice_count,
        client.paid_amount,
      ])
      return [clientHeaders, ...(clientRows || [])].map((row) => row.join(",")).join("\n")

    default:
      return "No data available"
  }
}

function generatePDF(data: any, reportType: string): string {
  // Simple PDF generation - in production, use a library like jsPDF or Puppeteer
  const content = `
    Financial Report - ${reportType}
    Generated on: ${new Date().toLocaleDateString()}
    
    ${JSON.stringify(data, null, 2)}
  `
  return content
}
