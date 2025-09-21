"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"

interface Client {
  id: string
  name: string
  email: string
  company: string
}

interface InvoiceFormProps {
  clients: Client[]
  invoice?: any
}

export function InvoiceForm({ clients, invoice }: InvoiceFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    client_id: invoice?.client_id || "",
    title: invoice?.title || "",
    description: invoice?.description || "",
    amount: invoice?.amount || "",
    tax_rate: invoice?.tax_rate || "0",
    due_date: invoice?.due_date || "",
    notes: invoice?.notes || "",
    terms: invoice?.terms || "Payment is due within 30 days of invoice date.",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (error) setError(null)
  }

  const calculateTotals = () => {
    const amount = Number.parseFloat(formData.amount) || 0
    const taxRate = Number.parseFloat(formData.tax_rate) || 0
    const taxAmount = (amount * taxRate) / 100
    const totalAmount = amount + taxAmount

    return { amount, taxAmount, totalAmount }
  }

  const { amount, taxAmount, totalAmount } = calculateTotals()

  // Generate fallback invoice number client-side
  const generateFallbackInvoiceNumber = () => {
    const year = new Date().getFullYear()
    const timestamp = Date.now().toString().slice(-6)
    return `${year}-${timestamp}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        throw new Error("Authentication required. Please login again.")
      }

      // Validate required fields
      if (!formData.client_id) throw new Error("Please select a client")
      if (!formData.title.trim()) throw new Error("Invoice title is required")
      if (!formData.amount || Number.parseFloat(formData.amount) <= 0) {
        throw new Error("Amount must be greater than 0")
      }
      if (!formData.due_date) throw new Error("Due date is required")

      // Prepare invoice data
      const invoiceData = {
        client_id: formData.client_id,
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        amount: Number.parseFloat(formData.amount),
        tax_rate: Number.parseFloat(formData.tax_rate) || 0,
        tax_amount: Number(taxAmount.toFixed(2)),
        total_amount: Number(totalAmount.toFixed(2)),
        due_date: formData.due_date,
        notes: formData.notes?.trim() || null,
        terms: formData.terms?.trim() || null,
        created_by: userData.user.id,
        currency: 'IDR',
        status: 'draft',
        issue_date: new Date().toISOString().split('T')[0],
      }

      let result
      
      if (invoice?.id) {
        // UPDATE existing invoice
        console.log("Updating invoice:", invoice.id)
        result = await supabase
          .from("invoices")
          .update({
            ...invoiceData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", invoice.id)
          .select("*")
          .single()
      } else {
        // CREATE new invoice
        console.log("Creating new invoice with data:", invoiceData)
        
        // Method 1: Try without invoice_number (let trigger handle it)
        result = await supabase
          .from("invoices")
          .insert([invoiceData])
          .select("*")
          .single()
        
        // Method 2: If that fails, try with explicit invoice_number
        if (result.error && result.error.message?.includes('invoice_number')) {
          console.log("Trigger failed, trying with explicit invoice_number")
          const fallbackData = {
            ...invoiceData,
            invoice_number: generateFallbackInvoiceNumber()
          }
          
          result = await supabase
            .from("invoices")
            .insert([fallbackData])
            .select("*")
            .single()
        }
      }

      // Handle result
      if (result.error) {
        console.error("Database error:", result.error)
        throw new Error(`Database error: ${result.error.message}`)
      }

      if (!result.data) {
        throw new Error("No data returned from database")
      }

      console.log("Invoice saved successfully:", result.data)
      
      // Success - redirect to invoice detail
      router.push(`/dashboard/invoices/${result.data.id}`)
      
    } catch (error: any) {
      console.error("Form submission error:", error)
      
      // Provide user-friendly error messages
      if (error.message?.includes('foreign key')) {
        setError("Selected client is invalid. Please refresh and try again.")
      } else if (error.message?.includes('authentication')) {
        setError("Session expired. Please login again.")
      } else if (error.message?.includes('permission')) {
        setError("You don't have permission to perform this action.")
      } else {
        setError(error.message || "An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Form validation
  const isFormValid = () => {
    return (
      formData.client_id &&
      formData.title.trim() &&
      formData.amount &&
      Number.parseFloat(formData.amount) > 0 &&
      formData.due_date
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mb-6 bg-blue-50">
          <CardContent className="p-4">
            <h3 className="font-medium text-blue-900 mb-2">Debug Info</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>Mode: {invoice ? 'Edit' : 'Create'}</p>
              <p>Invoice ID: {invoice?.id || 'New'}</p>
              <p>Form Valid: {isFormValid() ? 'Yes' : 'No'}</p>
              <p>Total Amount: {formatCurrency(totalAmount)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {invoice ? 'Edit Invoice' : 'Create New Invoice'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="client_id">
                    Client <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.client_id} 
                    onValueChange={(value) => handleInputChange("client_id", value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className={!formData.client_id ? "border-red-300" : ""}>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.length > 0 ? (
                        clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name} {client.company && `(${client.company})`}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          No clients available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {!formData.client_id && (
                    <p className="text-sm text-red-500 mt-1">Please select a client</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="title">
                    Invoice Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="e.g., Website Development Services"
                    disabled={isLoading}
                    className={!formData.title.trim() ? "border-red-300" : ""}
                  />
                  {!formData.title.trim() && (
                    <p className="text-sm text-red-500 mt-1">Invoice title is required</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Detailed description of services or products"
                    rows={3}
                    disabled={isLoading}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="amount">
                      Amount (IDR) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => handleInputChange("amount", e.target.value)}
                      placeholder="0.00"
                      disabled={isLoading}
                      className={
                        !formData.amount || Number.parseFloat(formData.amount) <= 0 
                          ? "border-red-300" 
                          : ""
                      }
                    />
                    {(!formData.amount || Number.parseFloat(formData.amount) <= 0) && (
                      <p className="text-sm text-red-500 mt-1">Amount must be greater than 0</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                    <Input
                      id="tax_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.tax_rate}
                      onChange={(e) => handleInputChange("tax_rate", e.target.value)}
                      placeholder="0.00"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="due_date">
                    Due Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => handleInputChange("due_date", e.target.value)}
                    disabled={isLoading}
                    className={!formData.due_date ? "border-red-300" : ""}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {!formData.due_date && (
                    <p className="text-sm text-red-500 mt-1">Due date is required</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="terms">Payment Terms</Label>
                  <Textarea
                    id="terms"
                    value={formData.terms}
                    onChange={(e) => handleInputChange("terms", e.target.value)}
                    placeholder="Payment terms and conditions"
                    rows={2}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Additional notes for the client"
                    rows={2}
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatCurrency(amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({formData.tax_rate}%):</span>
                  <span className="font-mono">{formatCurrency(taxAmount)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span className="font-mono">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <Card className="border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs">!</span>
                    </div>
                    <div>
                      <p className="font-medium text-red-900">Error</p>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !isFormValid()}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {invoice ? 'Updating...' : 'Creating...'}
                  </span>
                ) : (
                  invoice ? "Update Invoice" : "Create Invoice"
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}