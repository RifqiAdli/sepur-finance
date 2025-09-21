import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { InvoiceList } from "@/components/invoices/invoice-list"
import { InvoiceFilters } from "@/components/invoices/invoice-filters"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

interface SearchParams {
  status?: string
  client?: string
  search?: string
  page?: string
}

export default async function InvoicesPage({
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
  let query = supabase.from("invoice_summary").select("*").order("created_at", { ascending: false })

  // Apply filters
  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status)
  }

  if (params.client) {
    query = query.ilike("client_name", `%${params.client}%`)
  }

  if (params.search) {
    query = query.or(
      `invoice_number.ilike.%${params.search}%,title.ilike.%${params.search}%,client_name.ilike.%${params.search}%`,
    )
  }

  // Pagination
  const page = Number.parseInt(params.page || "1")
  const limit = 20
  const from = (page - 1) * limit
  const to = from + limit - 1

  query = query.range(from, to)

  const { data: invoices, error: invoicesError } = await query

  // Get total count for pagination
  const { count } = await supabase.from("invoice_summary").select("*", { count: "exact", head: true })

  // Get clients for filter dropdown
  const { data: clients } = await supabase.from("clients").select("id, name").eq("status", "active").order("name")

  if (invoicesError) {
    console.error("Error fetching invoices:", invoicesError)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600">Manage and track all your invoices</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/invoices/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <InvoiceFilters clients={clients || []} />

      {/* Invoice List */}
      <InvoiceList invoices={invoices || []} totalCount={count || 0} currentPage={page} limit={limit} />
    </div>
  )
}
