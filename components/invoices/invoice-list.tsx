"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatCurrency, formatShortDate } from "@/lib/utils"
import { Eye, MoreHorizontal, Edit, Trash2, Send, Download, FileText, Mail } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"

// Simple pagination component since the imported one might have issues
function SimplePagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void 
}) {
  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
      >
        Previous
      </Button>
      
      <div className="flex items-center space-x-1">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum: number
          if (totalPages <= 5) {
            pageNum = i + 1
          } else if (currentPage <= 3) {
            pageNum = i + 1
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i
          } else {
            pageNum = currentPage - 2 + i
          }
          
          return (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              className="w-8 h-8 p-0"
            >
              {pageNum}
            </Button>
          )
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
      >
        Next
      </Button>
    </div>
  )
}

interface Invoice {
  id: string
  invoice_number: string
  title: string
  client_name: string
  client_email: string
  total_amount: number
  paid_amount: number
  remaining_amount: number
  status: string
  payment_status: string
  due_date: string
  issue_date: string
  created_at: string
}

interface InvoiceListProps {
  invoices: Invoice[]
  totalCount: number
  currentPage: number
  limit: number
}

export function InvoiceList({ invoices, totalCount, currentPage, limit }: InvoiceListProps) {
  const router = useRouter()
  const [isExporting, setIsExporting] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  
  const totalPages = Math.ceil(totalCount / limit)

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "sent":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200"
      case "overdue":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      case "draft":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "fully paid":
      case "paid":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "partially paid":
      case "partial":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      case "unpaid":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  const handleExportInvoice = async (invoice: Invoice, format: "pdf" | "csv") => {
    setIsExporting(invoice.id)
    try {
      if (format === "pdf") {
        // For now, let's use a simple PDF generation
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Invoice ${invoice.invoice_number}</title>
                <style>
                  body { font-family: Arial, sans-serif; margin: 40px; }
                  .header { text-align: center; margin-bottom: 30px; }
                  .invoice-details { margin-bottom: 20px; }
                  .amount { font-size: 18px; font-weight: bold; color: #059669; }
                </style>
              </head>
              <body>
                <div class="header">
                  <h1>INVOICE</h1>
                  <h2>${invoice.invoice_number}</h2>
                </div>
                <div class="invoice-details">
                  <p><strong>Title:</strong> ${invoice.title}</p>
                  <p><strong>Client:</strong> ${invoice.client_name}</p>
                  <p><strong>Email:</strong> ${invoice.client_email}</p>
                  <p><strong>Issue Date:</strong> ${formatShortDate(invoice.issue_date)}</p>
                  <p><strong>Due Date:</strong> ${formatShortDate(invoice.due_date)}</p>
                  <p><strong>Status:</strong> ${invoice.status}</p>
                  <p class="amount"><strong>Total Amount:</strong> ${formatCurrency(invoice.total_amount)}</p>
                  ${invoice.paid_amount > 0 ? `<p><strong>Paid Amount:</strong> ${formatCurrency(invoice.paid_amount)}</p>` : ''}
                  ${invoice.remaining_amount > 0 ? `<p><strong>Remaining:</strong> ${formatCurrency(invoice.remaining_amount)}</p>` : ''}
                </div>
              </body>
            </html>
          `)
          printWindow.document.close()
          printWindow.print()
        }
      } else if (format === "csv") {
        const csvContent = [
          ["Field", "Value"],
          ["Invoice Number", invoice.invoice_number],
          ["Title", invoice.title],
          ["Client", invoice.client_name],
          ["Client Email", invoice.client_email],
          ["Total Amount", invoice.total_amount.toString()],
          ["Paid Amount", invoice.paid_amount.toString()],
          ["Remaining Amount", invoice.remaining_amount.toString()],
          ["Status", invoice.status],
          ["Payment Status", invoice.payment_status],
          ["Issue Date", invoice.issue_date],
          ["Due Date", invoice.due_date],
        ]
          .map((row) => `"${row[0]}","${row[1]}"`)
          .join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `invoice_${invoice.invoice_number}.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Export error:", error)
      alert("Export failed. Please try again.")
    } finally {
      setIsExporting(null)
    }
  }

  const handleSendInvoice = async (invoice: Invoice) => {
    try {
      // TODO: Implement email sending logic
      alert(`Sending invoice ${invoice.invoice_number} to ${invoice.client_email}`)
    } catch (error) {
      console.error("Send error:", error)
      alert("Failed to send invoice. Please try again.")
    }
  }

  const handleDeleteInvoice = async (invoice: Invoice) => {
    if (!confirm(`Are you sure you want to delete invoice ${invoice.invoice_number}?`)) {
      return
    }

    setIsDeleting(invoice.id)
    try {
      // TODO: Implement delete logic
      alert(`Invoice ${invoice.invoice_number} deleted`)
      router.refresh()
    } catch (error) {
      console.error("Delete error:", error)
      alert("Failed to delete invoice. Please try again.")
    } finally {
      setIsDeleting(null)
    }
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(window.location.search)
    params.set("page", page.toString())
    router.push(`/dashboard/invoices?${params.toString()}`)
  }

  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No invoices found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first invoice</p>
            <Button asChild>
              <Link href="/dashboard/invoices/new">
                Create Invoice
              </Link>
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
                  <TableHead>Invoice</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow 
                    key={invoice.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div>
                        <Link 
                          href={`/dashboard/invoices/${invoice.id}`}
                          className="font-medium hover:text-blue-600 hover:underline"
                        >
                          {invoice.invoice_number}
                        </Link>
                        <p className="text-sm text-gray-600 truncate max-w-[200px]">
                          {invoice.title}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div>
                        <p className="font-medium">{invoice.client_name}</p>
                        <p className="text-sm text-gray-600">{invoice.client_email}</p>
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div>
                        <p className="font-medium">{formatCurrency(invoice.total_amount)}</p>
                        {invoice.paid_amount > 0 && (
                          <p className="text-sm text-green-600">
                            Paid: {formatCurrency(invoice.paid_amount)}
                          </p>
                        )}
                        {invoice.remaining_amount > 0 && (
                          <p className="text-sm text-gray-600">
                            Remaining: {formatCurrency(invoice.remaining_amount)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Badge 
                        className={`${getStatusColor(invoice.status)} cursor-pointer`} 
                        variant="secondary"
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Badge 
                        className={`${getPaymentStatusColor(invoice.payment_status)} cursor-pointer`} 
                        variant="secondary"
                      >
                        {invoice.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div>
                        <p className="text-sm font-medium">{formatShortDate(invoice.due_date)}</p>
                        {new Date(invoice.due_date) < new Date() && invoice.status !== "paid" && (
                          <Badge variant="destructive" className="text-xs px-1 py-0">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/dashboard/invoices/${invoice.id}`)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/dashboard/invoices/${invoice.id}/edit`)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Invoice
                          </DropdownMenuItem>
                          
                          {(invoice.status === "draft" || invoice.status === "sent") && (
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSendInvoice(invoice)
                              }}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Send to Client
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleExportInvoice(invoice, "pdf")
                            }}
                            disabled={isExporting === invoice.id}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {isExporting === invoice.id ? "Generating..." : "Download PDF"}
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleExportInvoice(invoice, "csv")
                            }}
                            disabled={isExporting === invoice.id}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteInvoice(invoice)
                            }}
                            disabled={isDeleting === invoice.id}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {isDeleting === invoice.id ? "Deleting..." : "Delete"}
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
            invoices
          </p>
          <SimplePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Debug info for development */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="bg-blue-50">
          <CardContent className="p-4">
            <h4 className="font-medium text-blue-900 mb-2">Debug Info</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>Total Invoices: {totalCount}</p>
              <p>Current Page: {currentPage}</p>
              <p>Total Pages: {totalPages}</p>
              <p>Invoices on this page: {invoices.length}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}