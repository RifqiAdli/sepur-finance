"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Edit, Download, Send, Plus, Mail, FileText, Printer } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

interface InvoiceDetailsProps {
  invoice: any
}

export function InvoiceDetails({ invoice }: InvoiceDetailsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isSending, setIsSending] = useState(false)

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

  // Generate PDF content and download
  const handleDownloadPDF = async () => {
    setIsExporting(true)
    try {
      // Create printable HTML content
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice ${invoice.invoice_number}</title>
            <meta charset="utf-8">
            <style>
              * { box-sizing: border-box; }
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                margin: 0; 
                padding: 40px; 
                color: #333; 
                line-height: 1.6;
              }
              .invoice-header { 
                text-align: center; 
                margin-bottom: 40px; 
                border-bottom: 3px solid #3b82f6;
                padding-bottom: 20px;
              }
              .invoice-header h1 { 
                margin: 0; 
                font-size: 36px; 
                color: #1f2937;
                font-weight: 700;
              }
              .invoice-number { 
                font-size: 24px; 
                color: #3b82f6; 
                margin: 10px 0;
                font-weight: 600;
              }
              .invoice-title {
                font-size: 18px;
                color: #6b7280;
                margin: 5px 0;
              }
              .details-grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 40px; 
                margin-bottom: 30px; 
              }
              .detail-section h3 { 
                font-size: 16px; 
                font-weight: 600; 
                color: #1f2937; 
                margin-bottom: 10px;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 5px;
              }
              .detail-section p { 
                margin: 5px 0; 
                font-size: 14px;
              }
              .financial-summary { 
                background: #f9fafb; 
                padding: 20px; 
                border-radius: 8px; 
                margin-top: 30px;
                border-left: 4px solid #3b82f6;
              }
              .financial-row { 
                display: flex; 
                justify-content: space-between; 
                margin: 8px 0; 
                font-size: 14px;
              }
              .financial-row.total { 
                font-weight: bold; 
                font-size: 18px; 
                border-top: 2px solid #d1d5db; 
                padding-top: 10px; 
                margin-top: 15px;
              }
              .financial-row.paid { color: #059669; font-weight: 600; }
              .financial-row.remaining { color: #dc2626; font-weight: 600; }
              .status-badges {
                text-align: center;
                margin: 20px 0;
              }
              .badge {
                display: inline-block;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                margin: 0 5px;
                text-transform: uppercase;
              }
              .badge.paid { background: #dcfce7; color: #166534; }
              .badge.unpaid { background: #fee2e2; color: #991b1b; }
              .badge.partial { background: #fef3c7; color: #92400e; }
              .badge.draft { background: #f3f4f6; color: #374151; }
              .badge.sent { background: #dbeafe; color: #1e40af; }
              .description-section {
                margin: 20px 0;
                padding: 15px;
                background: #f8fafc;
                border-radius: 6px;
              }
              @media print {
                body { margin: 20px; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="invoice-header">
              <h1>INVOICE</h1>
              <div class="invoice-number">${invoice.invoice_number}</div>
              <div class="invoice-title">${invoice.title || ''}</div>
            </div>

            <div class="details-grid">
              <div class="detail-section">
                <h3>Bill To</h3>
                <p><strong>${invoice.client_name || 'N/A'}</strong></p>
                ${invoice.client_company ? `<p>${invoice.client_company}</p>` : ''}
                <p>${invoice.client_email || ''}</p>
              </div>
              <div class="detail-section">
                <h3>Invoice Details</h3>
                <p><strong>Issue Date:</strong> ${formatDate(invoice.issue_date || new Date())}</p>
                <p><strong>Due Date:</strong> ${formatDate(invoice.due_date)}</p>
                ${invoice.paid_date ? `<p><strong>Paid Date:</strong> ${formatDate(invoice.paid_date)}</p>` : ''}
                <p><strong>Currency:</strong> ${invoice.currency || 'IDR'}</p>
              </div>
            </div>

            ${invoice.description ? `
              <div class="description-section">
                <h3>Description</h3>
                <p>${invoice.description}</p>
              </div>
            ` : ''}

            <div class="status-badges">
              <span class="badge ${invoice.status?.toLowerCase() || 'draft'}">${invoice.status || 'Draft'}</span>
              <span class="badge ${(invoice.payment_status || 'unpaid').toLowerCase().replace(' ', '')}">${invoice.payment_status || 'Unpaid'}</span>
            </div>

            <div class="financial-summary">
              <h3>Financial Summary</h3>
              <div class="financial-row">
                <span>Subtotal:</span>
                <span>${formatCurrency(invoice.amount || 0)}</span>
              </div>
              ${invoice.tax_amount ? `
                <div class="financial-row">
                  <span>Tax (${invoice.tax_rate || 0}%):</span>
                  <span>${formatCurrency(invoice.tax_amount)}</span>
                </div>
              ` : ''}
              <div class="financial-row total">
                <span>Total Amount:</span>
                <span>${formatCurrency(invoice.total_amount || 0)}</span>
              </div>
              ${invoice.paid_amount > 0 ? `
                <div class="financial-row paid">
                  <span>Amount Paid:</span>
                  <span>${formatCurrency(invoice.paid_amount)}</span>
                </div>
              ` : ''}
              ${invoice.remaining_amount > 0 ? `
                <div class="financial-row remaining">
                  <span>Amount Due:</span>
                  <span>${formatCurrency(invoice.remaining_amount)}</span>
                </div>
              ` : ''}
            </div>

            ${invoice.notes ? `
              <div class="description-section">
                <h3>Notes</h3>
                <p>${invoice.notes}</p>
              </div>
            ` : ''}

            ${invoice.terms ? `
              <div class="description-section">
                <h3>Payment Terms</h3>
                <p>${invoice.terms}</p>
              </div>
            ` : ''}

            <div style="text-align: center; margin-top: 40px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px;">
              <p>Generated on ${formatDate(new Date())} | Sepur Engineering Roblox</p>
            </div>
          </body>
        </html>
      `

      // Open in new window for printing/saving
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(printContent)
        printWindow.document.close()
        
        // Wait for content to load then show print dialog
        printWindow.addEventListener('load', () => {
          setTimeout(() => {
            printWindow.print()
          }, 250)
        })
      } else {
        throw new Error('Pop-up blocked. Please allow pop-ups for this site.')
      }
    } catch (error) {
      console.error('PDF generation error:', error)
      alert('Failed to generate PDF. Please try again or check if pop-ups are allowed.')
    } finally {
      setIsExporting(false)
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
              <Button variant="outline" disabled={isExporting}>
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Generating...' : 'Export'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownloadPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadPDF}>
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
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Generating PDF...' : 'Download PDF'}
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