// app/test-invoice/page.tsx
"use client"

import { InvoiceDetails } from '@/components/invoices/invoice-details'

const mockInvoice = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  invoice_number: 'INV-2024-001',
  title: 'Website Development Project',
  client_name: 'PT Contoh Indonesia',
  client_company: 'Tech Solutions Ltd.',
  client_email: 'client@example.com',
  issue_date: '2024-01-15',
  due_date: '2024-02-15',
  paid_date: null,
  status: 'sent',
  payment_status: 'unpaid',
  amount: 15000000,
  tax_amount: 1500000,
  tax_rate: 10,
  total_amount: 16500000,
  paid_amount: 0,
  remaining_amount: 16500000,
  currency: 'IDR',
  description: 'Development of responsive website with modern design, including homepage, about page, services page, and contact form. Includes mobile optimization and SEO setup.',
  notes: 'Payment terms: Net 30 days. Late payment may incur additional fees.',
  terms: 'Please pay within 30 days of invoice date. Bank transfer to BCA 1234567890 a/n Sepur Engineering.',
}

export default function TestInvoicePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Test Invoice PDF Generation</h1>
        <p className="text-gray-600">
          This is a test page for the React-PDF invoice generation. 
          Click the export buttons to test PDF functionality.
        </p>
      </div>
      
      <InvoiceDetails invoice={mockInvoice} />
    </div>
  )
}