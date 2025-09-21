"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatCurrency, formatShortDate } from "@/lib/utils"
import { Eye, MoreHorizontal, Edit, Trash2, Download } from "lucide-react"
import Link from "next/link"
import { Pagination } from "@/components/ui/pagination"

interface Payment {
  id: string
  payment_number: string
  amount: number
  payment_method: string
  payment_date: string
  reference_number: string
  status: string
  notes: string
  invoices: {
    invoice_number: string
    title: string
    total_amount: number
    clients: {
      name: string
      company: string
    }
  }
}

interface PaymentListProps {
  payments: Payment[]
  totalCount: number
  currentPage: number
  limit: number
}

export function PaymentList({ payments, totalCount, currentPage, limit }: PaymentListProps) {
  const totalPages = Math.ceil(totalCount / limit)

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

  const getMethodColor = (method: string) => {
    switch (method) {
      case "bank_transfer":
        return "bg-blue-100 text-blue-800"
      case "cash":
        return "bg-green-100 text-green-800"
      case "credit_card":
        return "bg-purple-100 text-purple-800"
      case "check":
        return "bg-orange-100 text-orange-800"
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

  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">No payments found</h3>
            <p className="text-gray-600 mb-4">Start by recording your first payment</p>
            <Button asChild>
              <Link href="/dashboard/payments/new">Record Payment</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payment.payment_number}</p>
                        {payment.reference_number && (
                          <p className="text-sm text-gray-600">Ref: {payment.reference_number}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payment.invoices.invoice_number}</p>
                        <p className="text-sm text-gray-600 truncate max-w-[150px]">{payment.invoices.title}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payment.invoices.clients.name}</p>
                        {payment.invoices.clients.company && (
                          <p className="text-sm text-gray-600">{payment.invoices.clients.company}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={getMethodColor(payment.payment_method)} variant="secondary">
                        {formatMethod(payment.payment_method)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(payment.status)} variant="secondary">
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{formatShortDate(payment.payment_date)}</p>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/payments/${payment.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/payments/${payment.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download Receipt
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalCount)} of {totalCount}{" "}
            payments
          </p>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              const params = new URLSearchParams(window.location.search)
              params.set("page", page.toString())
              window.location.href = `/dashboard/payments?${params.toString()}`
            }}
          />
        </div>
      )}
    </div>
  )
}
