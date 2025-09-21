import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { InvoiceDetails } from "@/components/invoices/invoice-details"
import { PaymentHistory } from "@/components/payments/payment-history"

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id } = await params

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get invoice details
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoice_summary")
    .select("*")
    .eq("id", id)
    .single()

  if (invoiceError || !invoice) {
    notFound()
  }

  // Get payment history for this invoice
  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("invoice_id", id)
    .order("payment_date", { ascending: false })

  return (
    <div className="space-y-6">
      <InvoiceDetails invoice={invoice} />
      <PaymentHistory payments={payments || []} invoiceId={id} />
    </div>
  )
}
