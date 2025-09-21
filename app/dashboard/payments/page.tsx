import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PaymentList } from "@/components/payments/payment-list"
import { PaymentFilters } from "@/components/payments/payment-filters"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

interface SearchParams {
  status?: string
  method?: string
  search?: string
  page?: string
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Build query with filters
  let query = supabase
    .from("payments")
    .select(
      `
      *,
      invoices!inner(
        invoice_number,
        title,
        total_amount,
        clients!inner(name, company)
      )
    `,
    )
    .order("created_at", { ascending: false })

  // Apply filters
  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status)
  }

  if (params.method && params.method !== "all") {
    query = query.eq("payment_method", params.method)
  }

  if (params.search) {
    query = query.or(
      `payment_number.ilike.%${params.search}%,reference_number.ilike.%${params.search}%,invoices.invoice_number.ilike.%${params.search}%`,
    )
  }

  // Pagination
  const page = Number.parseInt(params.page || "1")
  const limit = 20
  const from = (page - 1) * limit
  const to = from + limit - 1

  query = query.range(from, to)

  const { data: payments, error: paymentsError } = await query

  // Get total count for pagination
  const { count } = await supabase.from("payments").select("*", { count: "exact", head: true })

  if (paymentsError) {
    console.error("Error fetching payments:", paymentsError)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Track and manage all payment transactions</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/payments/new">
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <PaymentFilters />

      {/* Payment List */}
      <PaymentList payments={payments || []} totalCount={count || 0} currentPage={page} limit={limit} />
    </div>
  )
}
