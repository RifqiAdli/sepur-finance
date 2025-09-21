export function formatCurrencyForExport(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDateForExport(date: string | Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date))
}

export function escapeCSV(value: any): string {
  if (value === null || value === undefined) return ""
  const str = String(value)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function generateInvoicePDF(invoice: any): string {
  // This would integrate with a PDF library like jsPDF or Puppeteer
  // For now, return a simple text representation
  return `
    INVOICE ${invoice.invoice_number}
    
    Bill To:
    ${invoice.client_name}
    ${invoice.client_email}
    
    Invoice Details:
    Title: ${invoice.title}
    Description: ${invoice.description || "N/A"}
    
    Amount: ${formatCurrencyForExport(invoice.amount)}
    Tax: ${formatCurrencyForExport(invoice.tax_amount)}
    Total: ${formatCurrencyForExport(invoice.total_amount)}
    
    Issue Date: ${formatDateForExport(invoice.issue_date)}
    Due Date: ${formatDateForExport(invoice.due_date)}
    
    Status: ${invoice.status}
    Payment Status: ${invoice.payment_status}
  `
}
