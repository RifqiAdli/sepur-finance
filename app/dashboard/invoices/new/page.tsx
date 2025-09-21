import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { InvoiceForm } from "@/components/invoices/invoice-form"

export default async function NewInvoicePage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get clients for dropdown
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, email, company")
    .eq("status", "active")
    .order("name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Invoice</h1>
        <p className="text-gray-600">Fill in the details to create a new invoice</p>
      </div>

      <InvoiceForm clients={clients || []} />
    </div>
  )
}
