// components/pdf/invoice-pdf.tsx
import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'

// Helper functions
const formatCurrency = (amount: number, currency = 'IDR') => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

const formatDate = (date: string | Date) => {
  if (!date) return 'N/A'
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Clean and simple styles
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.4,
    color: '#333333',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e5e5',
    borderBottomStyle: 'solid',
  },
  
  headerLeft: {
    flex: 1,
  },
  
  headerRight: {
    alignItems: 'flex-end',
  },
  
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  
  invoiceLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 10,
  },
  
  invoiceNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  
  invoiceTitle: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
  
  // Status
  statusContainer: {
    marginBottom: 10,
  },
  
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 5,
    borderRadius: 4,
  },
  
  statusText: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  
  statusPaid: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  
  statusSent: {
    backgroundColor: '#d1ecf1',
    color: '#0c5460',
  },
  
  statusOverdue: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  
  statusDraft: {
    backgroundColor: '#e2e3e5',
    color: '#383d41',
  },
  
  statusPartial: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  
  // Content
  mainContent: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  
  leftColumn: {
    flex: 1,
    marginRight: 30,
  },
  
  rightColumn: {
    flex: 1,
  },
  
  section: {
    marginBottom: 25,
  },
  
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  
  // Bill To
  billToContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 4,
  },
  
  clientName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  
  clientDetails: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 3,
  },
  
  // Invoice details
  detailsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 4,
  },
  
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  
  detailLabel: {
    fontSize: 10,
    color: '#666666',
    fontWeight: 'bold',
  },
  
  detailValue: {
    fontSize: 10,
    color: '#1a1a1a',
  },
  
  detailValuePaid: {
    color: '#28a745',
    fontWeight: 'bold',
  },
  
  // Description
  descriptionContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 4,
    marginTop: 5,
  },
  
  descriptionText: {
    fontSize: 10,
    color: '#666666',
    lineHeight: 1.5,
  },
  
  // Financial summary
  financialSummary: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderStyle: 'solid',
    borderRadius: 4,
    padding: 20,
    marginTop: 20,
  },
  
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  
  summaryLabel: {
    fontSize: 11,
    color: '#666666',
  },
  
  summaryValue: {
    fontSize: 11,
    color: '#1a1a1a',
    textAlign: 'right',
    minWidth: 80,
  },
  
  // Total row
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#dee2e6',
    borderTopStyle: 'solid',
  },
  
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  
  // Payment info
  paidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    backgroundColor: '#d4edda',
    paddingHorizontal: 10,
    marginTop: 10,
    borderRadius: 3,
  },
  
  paidLabel: {
    fontSize: 10,
    color: '#155724',
    fontWeight: 'bold',
  },
  
  paidValue: {
    fontSize: 10,
    color: '#155724',
    fontWeight: 'bold',
  },
  
  remainingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    backgroundColor: '#f8d7da',
    paddingHorizontal: 10,
    marginTop: 5,
    borderRadius: 3,
  },
  
  remainingLabel: {
    fontSize: 10,
    color: '#721c24',
    fontWeight: 'bold',
  },
  
  remainingValue: {
    fontSize: 10,
    color: '#721c24',
    fontWeight: 'bold',
  },
  
  // Notes
  notesSection: {
    marginTop: 30,
  },
  
  notesContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 4,
    marginTop: 5,
  },
  
  notesText: {
    fontSize: 10,
    color: '#666666',
    lineHeight: 1.5,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    borderTopStyle: 'solid',
  },
  
  footerText: {
    fontSize: 8,
    color: '#999999',
  },
})

interface InvoicePDFProps {
  invoice: {
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
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice }) => {
  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'fully paid':
        return styles.statusPaid
      case 'sent':
        return styles.statusSent
      case 'overdue':
        return styles.statusOverdue
      case 'partial':
      case 'partially paid':
        return styles.statusPartial
      case 'draft':
      default:
        return styles.statusDraft
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>Sepur Engineering Roblox</Text>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            {invoice.title && (
              <Text style={styles.invoiceTitle}>{invoice.title}</Text>
            )}
          </View>
          
          <View style={styles.headerRight}>
            <Text style={styles.invoiceNumber}>
              #{invoice.invoice_number || 'DRAFT'}
            </Text>
            
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, getStatusStyle(invoice.status || 'draft')]}>
                <Text style={styles.statusText}>
                  {invoice.status || 'Draft'}
                </Text>
              </View>
              <View style={[styles.statusBadge, getStatusStyle(invoice.payment_status || 'unpaid')]}>
                <Text style={styles.statusText}>
                  {invoice.payment_status || 'Unpaid'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Left Column */}
          <View style={styles.leftColumn}>
            {/* Bill To */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bill To</Text>
              <View style={styles.billToContainer}>
                <Text style={styles.clientName}>
                  {invoice.client_name || 'Client Name'}
                </Text>
                {invoice.client_company && (
                  <Text style={styles.clientDetails}>
                    {invoice.client_company}
                  </Text>
                )}
                {invoice.client_email && (
                  <Text style={styles.clientDetails}>
                    {invoice.client_email}
                  </Text>
                )}
              </View>
            </View>

            {/* Description */}
            {invoice.description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionText}>
                    {invoice.description}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Right Column */}
          <View style={styles.rightColumn}>
            {/* Invoice Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Invoice Details</Text>
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Issue Date:</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(invoice.issue_date || new Date())}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Due Date:</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(invoice.due_date)}
                  </Text>
                </View>
                {invoice.paid_date && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Paid Date:</Text>
                    <Text style={[styles.detailValue, styles.detailValuePaid]}>
                      {formatDate(invoice.paid_date)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Financial Summary */}
        <View style={styles.financialSummary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(invoice.amount || 0, invoice.currency)}
            </Text>
          </View>
          
          {invoice.tax_amount && invoice.tax_amount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Tax ({invoice.tax_rate || 0}%):
              </Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(invoice.tax_amount, invoice.currency)}
              </Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.total_amount || 0, invoice.currency)}
            </Text>
          </View>

          {invoice.paid_amount && invoice.paid_amount > 0 && (
            <View style={styles.paidRow}>
              <Text style={styles.paidLabel}>Paid:</Text>
              <Text style={styles.paidValue}>
                {formatCurrency(invoice.paid_amount, invoice.currency)}
              </Text>
            </View>
          )}

          {invoice.remaining_amount && invoice.remaining_amount > 0 && (
            <View style={styles.remainingRow}>
              <Text style={styles.remainingLabel}>Balance Due:</Text>
              <Text style={styles.remainingValue}>
                {formatCurrency(invoice.remaining_amount, invoice.currency)}
              </Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {(invoice.terms || invoice.notes) && (
          <View style={styles.notesSection}>
            {invoice.terms && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment Terms</Text>
                <View style={styles.notesContainer}>
                  <Text style={styles.notesText}>{invoice.terms}</Text>
                </View>
              </View>
            )}

            {invoice.notes && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <View style={styles.notesContainer}>
                  <Text style={styles.notesText}>{invoice.notes}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated on {new Date().toLocaleDateString('id-ID')} - Sepur Engineering Roblox
          </Text>
          <Text style={styles.footerText}>
           Sepur Finance - Invoice #{invoice.invoice_number|| 'DRAFT'}
          </Text>
        </View>
      </Page>
    </Document>
  )
}