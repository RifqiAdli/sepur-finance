import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PaymentForm } from "@/components/payments/payment-form"

export default async function NewPaymentPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get unpaid/partially paid invoices
  const { data: invoices } = await supabase
    .from("invoice_summary")
    .select("*")
    .neq("payment_status", "Fully Paid")
    .order("due_date")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Record New Payment</h1>
        <p className="text-gray-600">Record a payment received for an invoice</p>
      </div>

      <PaymentForm invoices={invoices || []} />
    </div>
  )
}
