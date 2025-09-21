"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Download, FileText, FileSpreadsheet } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function ExportActions() {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportType, setExportType] = useState("pdf")
  const [reportType, setReportType] = useState("financial_summary")
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0], // Start of year
    to: new Date().toISOString().split("T")[0], // Today
  })

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const supabase = createClient()

      // Call the appropriate export API endpoint
      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: exportType,
          reportType,
          dateRange,
        }),
      })

      if (!response.ok) {
        throw new Error("Export failed")
      }

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url

      // Set filename based on export type
      const timestamp = new Date().toISOString().split("T")[0]
      const extension = exportType === "pdf" ? "pdf" : exportType === "excel" ? "xlsx" : "csv"
      a.download = `${reportType}_${timestamp}.${extension}`

      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setIsOpen(false)
    } catch (error) {
      console.error("Export error:", error)
      alert("Export failed. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const getExportIcon = () => {
    switch (exportType) {
      case "pdf":
        return <FileText className="h-4 w-4" />
      case "excel":
        return <FileSpreadsheet className="h-4 w-4" />
      case "csv":
        return <FileSpreadsheet className="h-4 w-4" />
      default:
        return <Download className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export Reports
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Financial Reports</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="reportType">Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="financial_summary">Financial Summary</SelectItem>
                <SelectItem value="invoice_report">Invoice Report</SelectItem>
                <SelectItem value="payment_report">Payment Report</SelectItem>
                <SelectItem value="client_report">Client Report</SelectItem>
                <SelectItem value="monthly_analysis">Monthly Analysis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="exportType">Export Format</Label>
            <Select value={exportType} onValueChange={setExportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Document</SelectItem>
                <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                <SelectItem value="csv">CSV File</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
              />
            </div>
          </div>

          <Button onClick={handleExport} disabled={isExporting} className="w-full">
            {getExportIcon()}
            <span className="ml-2">{isExporting ? "Exporting..." : `Export as ${exportType.toUpperCase()}`}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
