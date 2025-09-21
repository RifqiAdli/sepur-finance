"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Edit, Download, Send, Plus, Mail, FileText, Printer, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { usePDFGenerator, usePDFUpload } from "@/components/pdf/pdf-hooks"
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface InvoiceDetailsProps {
  invoice: any
}

export function InvoiceDetails({ invoice }: InvoiceDetailsProps) {
  const [isSending, setIsSending] = useState(false)
  
  // PDF generation hooks
  const { generatePDF, isGenerating, error } = usePDFGenerator()
  const { uploadPDF, isUploading, uploadError } = usePDFUpload()

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "sent":
        return "bg-blue-100 text-blue-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "fully paid":
      case "paid":
        return "bg-green-100 text-green-800"
      case "partially paid":
      case "partial":
        return "bg-yellow-100 text-yellow-800"
      case "unpaid":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Handle PDF generation and download
  const handleDownloadPDF = async () => {
    try {
      await generatePDF(invoice, 'download')
    } catch (error) {
      console.error('PDF download failed:', error)
      alert('Failed to generate PDF. Please try again.')
    }
  }

  // Handle PDF preview
  const handlePreviewPDF = async () => {
    try {
      await generatePDF(invoice, 'preview')
    } catch (error) {
      console.error('PDF preview failed:', error)
      alert('Failed to preview PDF. Please try again.')
    }
  }

  // Handle PDF upload to Supabase
  const handleUploadPDF = async () => {
    try {
      const result = await uploadPDF(invoice, supabase)
      alert(`PDF uploaded successfully! URL: ${result.url}`)
      return result
    } catch (error) {
      console.error('PDF upload failed:', error)
      alert('Failed to upload PDF to storage.')
      throw error
    }
  }

  // Handle print
  const handlePrintPDF = async () => {
    try {
      // Generate PDF and open in new tab for printing
      await generatePDF(invoice, 'preview')
    } catch (error) {
      console.error('PDF print failed:', error)
      alert('Failed to prepare PDF for printing.')
    }
  }

  // Export as CSV
  const handleExportCSV = () => {
    try {
      const csvData = [
        ['Field', 'Value'],
        ['Invoice Number', invoice.invoice_number || ''],
        ['Title', invoice.title || ''],
        ['Client Name', invoice.client_name || ''],
        ['Client Email', invoice.client_email || ''],
        ['Client Company', invoice.client_company || ''],
        ['Issue Date', invoice.issue_date || ''],
        ['Due Date', invoice.due_date || ''],
        ['Paid Date', invoice.paid_date || ''],
        ['Status', invoice.status || ''],
        ['Payment Status', invoice.payment_status || ''],
        ['Subtotal', invoice.amount || 0],
        ['Tax Amount', invoice.tax_amount || 0],
        ['Tax Rate', `${invoice.tax_rate || 0}%`],
        ['Total Amount', invoice.total_amount || 0],
        ['Paid Amount', invoice.paid_amount || 0],
        ['Remaining Amount', invoice.remaining_amount || 0],
        ['Currency', invoice.currency || 'IDR'],
        ['Description', invoice.description || ''],
        ['Notes', invoice.notes || ''],
        ['Terms', invoice.terms || ''],
      ]

      const csvContent = csvData
        .map(row => `"${row[0]}","${row[1]}"`)
        .join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `invoice_${invoice.invoice_number || 'export'}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('CSV export error:', error)
      alert('Failed to export CSV. Please try again.')
    }
  }

  // Send invoice via email
  const handleSendInvoice = async () => {
    if (!invoice.client_email) {
      alert('No client email address found.')
      return
    }

    setIsSending(true)
    try {
      // TODO: Implement actual email sending via API
      // For now, just show success message
      alert(`Invoice ${invoice.invoice_number} will be sent to ${invoice.client_email}`)
      
      // Here you would typically make an API call:
      // await fetch('/api/invoices/send', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ invoiceId: invoice.id })
      // })
      
    } catch (error) {
      console.error('Send invoice error:', error)
      alert('Failed to send invoice. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{invoice.invoice_number}</h1>
          <p className="text-lg text-gray-600 mt-1">{invoice.title}</p>
          <div className="flex gap-2 mt-3">
            <Badge className={getStatusColor(invoice.status)} variant="secondary">
              {invoice.status || 'Draft'}
            </Badge>
            <Badge className={getPaymentStatusColor(invoice.payment_status)} variant="secondary">
              {invoice.payment_status || 'Unpaid'}
            </Badge>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isGenerating || isUploading}>
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generating...' : isUploading ? 'Uploading...' : 'Export'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownloadPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePreviewPDF}>
                <Eye className="h-4 w-4 mr-2" />
                Preview PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleUploadPDF}>
                <Download className="h-4 w-4 mr-2" />
                Save to Storage
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrintPDF}>
                <Printer className="h-4 w-4 mr-2" />
                Print Invoice
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {(invoice.status === "draft" || invoice.status === "sent") && (
            <Button 
              onClick={handleSendInvoice}
              disabled={isSending}
            >
              <Mail className="h-4 w-4 mr-2" />
              {isSending ? 'Sending...' : 'Send Invoice'}
            </Button>
          )}
          
          {invoice.remaining_amount > 0 && (
            <Button asChild>
              <Link href={`/dashboard/payments/new?invoice=${invoice.id}`}>
                <Plus className="h-4 w-4 mr-2" />
                Record Payment
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Bill To</h3>
                  <div className="space-y-1">
                    <p className="font-medium">{invoice.client_name || 'N/A'}</p>
                    {invoice.client_company && (
                      <p className="text-gray-600">{invoice.client_company}</p>
                    )}
                    <p className="text-gray-600">{invoice.client_email || 'No email'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Invoice Dates</h3>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Issue Date:</span> {formatDate(invoice.issue_date || new Date())}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Due Date:</span> {formatDate(invoice.due_date)}
                    </p>
                    {invoice.paid_date && (
                      <p className="text-sm text-green-600">
                        <span className="font-medium">Paid Date:</span> {formatDate(invoice.paid_date)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {invoice.description && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{invoice.description}</p>
                </div>
              )}

              {invoice.terms && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Payment Terms</h3>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{invoice.terms}</p>
                </div>
              )}

              {invoice.notes && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{invoice.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-mono">{formatCurrency(invoice.amount || 0)}</span>
              </div>
              {invoice.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax ({invoice.tax_rate || 0}%):</span>
                  <span className="font-mono">{formatCurrency(invoice.tax_amount)}</span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span className="font-mono">{formatCurrency(invoice.total_amount || 0)}</span>
                </div>
              </div>
              {invoice.paid_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Paid:</span>
                  <span className="font-mono">{formatCurrency(invoice.paid_amount)}</span>
                </div>
              )}
              {invoice.remaining_amount > 0 && (
                <div className="flex justify-between font-semibold text-red-600">
                  <span>Remaining:</span>
                  <span className="font-mono">{formatCurrency(invoice.remaining_amount)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleDownloadPDF}
                disabled={isGenerating}
              >
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generating PDF...' : 'Download PDF'}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handlePreviewPDF}
                disabled={isGenerating}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview PDF
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleExportCSV}
              >
                <FileText className="h-4 w-4 mr-2" />
                Export to CSV
              </Button>
              
              {invoice.remaining_amount > 0 && (
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href={`/dashboard/payments/new?invoice=${invoice.id}`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Record Payment
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}