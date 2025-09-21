// components/pdf/pdf-generator.tsx
import { pdf } from '@react-pdf/renderer'
import { InvoicePDF } from './invoice-pdf'

interface Invoice {
  id?: string
  invoice_number?: string
  title?: string
  client_name?: string
  client_email?: string
  client_company?: string
  issue_date?: string | Date
  due_date?: string | Date
  paid_date?: string | Date
  status?: string
  payment_status?: string
  amount?: number
  tax_amount?: number
  tax_rate?: number
  total_amount?: number
  paid_amount?: number
  remaining_amount?: number
  currency?: string
  description?: string
  notes?: string
  terms?: string
}

// Helper function to generate PDF blob
export async function generateInvoicePDF(invoice: Invoice): Promise<Blob> {
  try {
    // Create PDF document with JSX
    const doc = <InvoicePDF invoice={invoice} />
    const asPdf = pdf(doc)
    const blob = await asPdf.toBlob()
    
    return blob
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error('Failed to generate PDF document')
  }
}