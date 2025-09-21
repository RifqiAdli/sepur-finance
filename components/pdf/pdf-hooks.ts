// components/pdf/pdf-hooks.ts
import { useState } from 'react'
import { generateInvoicePDF } from './pdf-generator'

// Types
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

interface UsePDFGeneratorReturn {
  generatePDF: (invoice: Invoice, action?: 'download' | 'preview' | 'blob') => Promise<void | Blob>
  isGenerating: boolean
  error: string | null
}

interface UsePDFUploadReturn {
  uploadPDF: (invoice: Invoice, supabaseClient: any) => Promise<{
    success: boolean
    url: string
    fileName: string
    filePath: string
  }>
  isUploading: boolean
  uploadError: string | null
}

// PDF Generator Hook
export function usePDFGenerator(): UsePDFGeneratorReturn {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generatePDF = async (
    invoice: Invoice, 
    action: 'download' | 'preview' | 'blob' = 'download'
  ): Promise<void | Blob> => {
    setIsGenerating(true)
    setError(null)

    try {
      console.log('Generating PDF for invoice:', invoice.invoice_number)
      
      // Use the separate generator function
      const blob = await generateInvoicePDF(invoice)

      console.log('PDF generated successfully, size:', blob.size)

      switch (action) {
        case 'download':
          // Auto download
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `invoice-${invoice.invoice_number || 'draft'}.pdf`
          link.target = '_blank'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          break

        case 'preview':
          // Open in new tab for preview
          const previewUrl = URL.createObjectURL(blob)
          window.open(previewUrl, '_blank')
          // Don't revoke URL immediately for preview
          setTimeout(() => URL.revokeObjectURL(previewUrl), 1000)
          break

        case 'blob':
          // Return blob for further processing
          return blob
      }

    } catch (err) {
      console.error('PDF generation error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    generatePDF,
    isGenerating,
    error
  }
}

// PDF Upload Hook
export function usePDFUpload(): UsePDFUploadReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const uploadPDF = async (
    invoice: Invoice,
    supabaseClient: any
  ) => {
    setIsUploading(true)
    setUploadError(null)

    try {
      console.log('Starting PDF upload for invoice:', invoice.invoice_number)

      // Generate PDF blob using the separate generator
      const blob = await generateInvoicePDF(invoice)

      console.log('PDF blob generated, size:', blob.size)

      // Generate file info
      const timestamp = Date.now()
      const fileName = `invoice-${invoice.invoice_number || 'draft'}-${timestamp}.pdf`
      const filePath = `invoices/${invoice.id || 'unknown'}/${fileName}`

      console.log('Uploading to path:', filePath)

      // Upload to Supabase Storage
      const { data, error } = await supabaseClient.storage
        .from('documents') // Make sure this bucket exists
        .upload(filePath, blob, {
          contentType: 'application/pdf',
          upsert: true
        })

      if (error) {
        console.error('Supabase upload error:', error)
        throw new Error(`Upload failed: ${error.message}`)
      }

      console.log('Upload successful:', data)

      // Get public URL
      const { data: urlData } = supabaseClient.storage
        .from('documents')
        .getPublicUrl(filePath)

      console.log('Public URL generated:', urlData.publicUrl)

      // Optional: Save to database
      try {
        const { error: dbError } = await supabaseClient
          .from('invoice_files')
          .insert({
            invoice_id: invoice.id,
            file_name: fileName,
            file_path: filePath,
            file_url: urlData.publicUrl,
            file_type: 'pdf',
            file_size: blob.size,
            created_at: new Date().toISOString(),
          })

        if (dbError) {
          console.warn('Database insert failed (non-critical):', dbError)
        } else {
          console.log('File record saved to database')
        }
      } catch (dbErr) {
        console.warn('Database operation failed (non-critical):', dbErr)
      }

      return {
        success: true,
        url: urlData.publicUrl,
        fileName,
        filePath
      }

    } catch (err) {
      console.error('PDF upload error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload PDF'
      setUploadError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  return {
    uploadPDF,
    isUploading,
    uploadError
  }
}