"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"

interface Invoice {
  id: string
  invoice_number: string
  title: string
  client_name: string
  total_amount: number
  paid_amount: number
  remaining_amount: number
  payment_status: string
}

interface PaymentFormProps {
  invoices: Invoice[]
  payment?: any
}

export function PaymentForm({ invoices, payment }: PaymentFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  const [formData, setFormData] = useState({
    invoice_id: payment?.invoice_id || "",
    amount: payment?.amount || "",
    payment_method: payment?.payment_method || "bank_transfer",
    payment_date: payment?.payment_date || new Date().toISOString().split("T")[0],
    reference_number: payment?.reference_number || "",
    notes: payment?.notes || "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (error) setError(null)
  }

  // Update selected invoice when invoice_id changes
  useEffect(() => {
    if (formData.invoice_id) {
      const invoice = invoices.find((inv) => inv.id === formData.invoice_id)
      setSelectedInvoice(invoice || null)

      // Auto-fill amount with remaining amount if not editing
      if (!payment && invoice) {
        setFormData((prev) => ({ ...prev, amount: invoice.remaining_amount.toString() }))
      }
    } else {
      setSelectedInvoice(null)
    }
  }, [formData.invoice_id, invoices, payment])

  // Generate fallback payment number client-side
  const generateFallbackPaymentNumber = () => {
    const year = new Date().getFullYear()
    const timestamp = Date.now().toString().slice(-6)
    return `PAY-${year}-${timestamp}`
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
      if (!formData.invoice_id) throw new Error("Please select an invoice")
      if (!formData.amount || Number.parseFloat(formData.amount) <= 0) {
        throw new Error("Payment amount must be greater than 0")
      }
      if (!formData.payment_date) throw new Error("Payment date is required")

      const amount = Number.parseFloat(formData.amount)

      // Validate amount against remaining invoice amount
      if (selectedInvoice && amount > selectedInvoice.remaining_amount) {
        throw new Error(`Payment amount cannot exceed remaining invoice amount of ${formatCurrency(selectedInvoice.remaining_amount)}`)
      }

      // Prepare payment data - DON'T include payment_number for new payments
      const paymentData = {
        invoice_id: formData.invoice_id,
        amount: Number(amount.toFixed(2)),
        payment_method: formData.payment_method,
        payment_date: formData.payment_date,
        reference_number: formData.reference_number?.trim() || null,
        notes: formData.notes?.trim() || null,
        created_by: userData.user.id,
        status: 'completed', // You might want to add approval workflow later
      }

      let result
      
      if (payment?.id) {
        // UPDATE existing payment - don't change payment_number
        console.log("Updating payment:", payment.id)
        result = await supabase
          .from("payments")
          .update({
            ...paymentData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.id)
          .select("*")
          .single()
      } else {
        // CREATE new payment - let trigger handle payment_number
        console.log("Creating new payment with data:", paymentData)
        
        // Method 1: Try without payment_number (let trigger handle it)
        result = await supabase
          .from("payments")
          .insert([paymentData])
          .select("*")
          .single()
        
        // Method 2: If that fails, try with explicit payment_number
        if (result.error && result.error.message?.includes('payment_number')) {
          console.log("Trigger failed, trying with explicit payment_number")
          const fallbackData = {
            ...paymentData,
            payment_number: generateFallbackPaymentNumber()
          }
          
          result = await supabase
            .from("payments")
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

      console.log("Payment saved successfully:", result.data)
      
      // Success - redirect to payment detail or payments list
      router.push(`/dashboard/payments/${result.data.id}`)
      
    } catch (error: any) {
      console.error("Payment form submission error:", error)
      
      // Provide user-friendly error messages
      if (error.message?.includes('foreign key')) {
        setError("Selected invoice is invalid. Please refresh and try again.")
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
      formData.invoice_id &&
      formData.amount &&
      Number.parseFloat(formData.amount) > 0 &&
      formData.payment_date &&
      formData.payment_method
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mb-6 bg-green-50">
          <CardContent className="p-4">
            <h3 className="font-medium text-green-900 mb-2">Payment Debug Info</h3>
            <div className="text-sm text-green-800 space-y-1">
              <p>Mode: {payment ? 'Edit' : 'Create'}</p>
              <p>Payment ID: {payment?.id || 'New'}</p>
              <p>Selected Invoice: {selectedInvoice?.invoice_number || 'None'}</p>
              <p>Form Valid: {isFormValid() ? 'Yes' : 'No'}</p>
              <p>Amount: {formData.amount ? formatCurrency(Number.parseFloat(formData.amount)) : 'Not set'}</p>
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
                  {payment ? 'Edit Payment' : 'Record New Payment'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="invoice_id">
                    Invoice <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.invoice_id} 
                    onValueChange={(value) => handleInputChange("invoice_id", value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className={!formData.invoice_id ? "border-red-300" : ""}>
                      <SelectValue placeholder="Select an invoice to pay" />
                    </SelectTrigger>
                    <SelectContent>
                      {invoices.length > 0 ? (
                        invoices
                          .filter(invoice => invoice.remaining_amount > 0) // Only show invoices with remaining balance
                          .map((invoice) => (
                            <SelectItem key={invoice.id} value={invoice.id}>
                              <div className="flex justify-between items-center w-full">
                                <span>
                                  {invoice.invoice_number} - {invoice.client_name}
                                </span>
                                <span className="text-sm text-gray-500 ml-2">
                                  {formatCurrency(invoice.remaining_amount)} remaining
                                </span>
                              </div>
                            </SelectItem>
                          ))
                      ) : (
                        <SelectItem value="" disabled>
                          No unpaid invoices available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {!formData.invoice_id && (
                    <p className="text-sm text-red-500 mt-1">Please select an invoice</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="amount">
                      Payment Amount (IDR) <span className="text-red-500">*</span>
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
                    {selectedInvoice && (
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum: {formatCurrency(selectedInvoice.remaining_amount)}
                      </p>
                    )}
                    {(!formData.amount || Number.parseFloat(formData.amount) <= 0) && (
                      <p className="text-sm text-red-500 mt-1">Payment amount must be greater than 0</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="payment_method">
                      Payment Method <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.payment_method}
                      onValueChange={(value) => handleInputChange("payment_method", value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="debit_card">Debit Card</SelectItem>
                        <SelectItem value="e_wallet">E-Wallet (OVO, GoPay, Dana)</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="payment_date">
                      Payment Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="payment_date"
                      type="date"
                      value={formData.payment_date}
                      onChange={(e) => handleInputChange("payment_date", e.target.value)}
                      disabled={isLoading}
                      className={!formData.payment_date ? "border-red-300" : ""}
                      max={new Date().toISOString().split('T')[0]} // Prevent future dates
                    />
                    {!formData.payment_date && (
                      <p className="text-sm text-red-500 mt-1">Payment date is required</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="reference_number">Reference Number</Label>
                    <Input
                      id="reference_number"
                      value={formData.reference_number}
                      onChange={(e) => handleInputChange("reference_number", e.target.value)}
                      placeholder="Transaction ID, Check number, etc."
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Additional notes about this payment"
                    rows={3}
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            {selectedInvoice && (
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium">{selectedInvoice.invoice_number}</p>
                    <p className="text-sm text-gray-600">{selectedInvoice.title}</p>
                    <p className="text-sm text-gray-600">{selectedInvoice.client_name}</p>
                  </div>
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between">
                      <span>Total Amount:</span>
                      <span className="font-mono">{formatCurrency(selectedInvoice.total_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Paid Amount:</span>
                      <span className="font-mono">{formatCurrency(selectedInvoice.paid_amount)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Remaining:</span>
                      <span className="font-mono">{formatCurrency(selectedInvoice.remaining_amount)}</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="flex justify-between text-sm">
                      <span>Payment Status:</span>
                      <span className={`font-medium px-2 py-1 rounded text-xs ${
                        selectedInvoice.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                        selectedInvoice.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedInvoice.payment_status}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
                    {payment ? 'Updating...' : 'Recording...'}
                  </span>
                ) : (
                  payment ? "Update Payment" : "Record Payment"
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