"use client"
import React, { useState, useEffect, useRef } from "react"
import { ref, onValue, set, remove, push } from "firebase/database"
import { database } from "@/lib/firebase"
import { cn } from "@/lib/utils"
import {
  Plus,
  Download,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Edit,
  Trash2,
  Send,
  IndianRupee,
  Copy,
  X,
  ArrowLeft,
  Minus,
  CheckCircle,
  Calendar,
  AlertCircle,
  History,
  PenTool,
  Search,
  
  Package,
} from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { v4 as uuidv4 } from "uuid"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import * as XLSX from "xlsx"

// Predefined construction products/services
const CONSTRUCTION_PRODUCTS = [
  { name: "Cement", uom: "Bags", defaultPrice: 350 },
  { name: "Steel Rods", uom: "MT", defaultPrice: 50000 },
  { name: "Sand", uom: "Cubic Meter", defaultPrice: 1500 },
  { name: "Bricks", uom: "Units", defaultPrice: 8 },
  { name: "Concrete Mix", uom: "Cubic Meter", defaultPrice: 4500 },
  { name: "Labor Charges", uom: "Hours", defaultPrice: 500 },
  { name: "Painting Service", uom: "Square Meter", defaultPrice: 100 },
]

// Payment terms options
const PAYMENT_TERMS = ["Due on Receipt", "Net 15", "Net 30", "Net 60"]

// Currency options
const CURRENCIES = ["INR", "USD", "EUR", "GBP"]

// Tax zones
const TAX_ZONES = [
  { name: "Intra-State (CGST+SGST)", cgst: 2.5, sgst: 2.5, igst: 0 },
  { name: "Inter-State (IGST)", cgst: 0, sgst: 0, igst: 5 },
]

// Invoice templates
const INVOICE_TEMPLATES = ["Modern", "Classic", "Minimal"]

// Recurrence options
const RECURRENCE_OPTIONS = ["Weekly", "Monthly", "Quarterly"]

interface InvoiceItem {
  productName: string
  description?: string
  uom: string
  quantity: number
  unitPrice: number
  total: number
  cgst?: number
  sgst?: number
  igst?: number
}

interface Payment {
  paymentId: string
  amount: number
  date: string
  method: string
  timestamp: number
}

interface Invoice {
  invoiceId: string
  clientId?: string
  clientName: string
  clientAddress: string
  clientGSTIN?: string
  clientEmail?: string
  clientPhone?: string
  invoiceDate: string
  dueDate: string
  projectName: string
  workOrderNumber: string
  siteLocation: string
  paymentTerms: string
  currency: string
  taxZone: string
  items: InvoiceItem[]
  subtotal: number
  cgstRate: number
  sgstRate: number
  igstRate: number
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  totalTax: number
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled" | "partially_paid"
  notes: string
  signature?: string
  template: string
  isRecurring: boolean
  recurrenceInterval?: string
  recurrenceEndDate?: string
  payments: Payment[]
  timestamp: number
  lastModifiedBy?: string
  enableStockManagement?: boolean
}

interface AuditLog {
  id: string
  invoiceId: string
  action: string
  user: string
  timestamp: number
  details: string
  taxDetails?: {
    cgstRate?: number
    sgstRate?: number
    igstRate?: number
    cgstAmount?: number
    sgstAmount?: number
    igstAmount?: number
    taxZone?: string
    complianceStatus?: string
  }
  stockChanges?: {
    productName: string
    quantityChange: number
    newQuantity: number
  }[]
  snapshot?: Partial<Invoice>
}

interface Stock {
  productName: string
  uom: string
  quantity: number
}

interface Client {
  clientId: string
  name: string
  address: string
  gstin?: string
  email: string
  phone?: string
}

interface RecurringInvoice {
  recurringId: string
  invoiceTemplate: Invoice
  interval: string
  startDate: string
  endDate?: string
  lastGenerated?: string
  nextDue: string
}

// Notification Component
const Notification: React.FC<{ message: string; type: "success" | "error" | "warning"; onClose: () => void }> = ({
  message,
  type,
  onClose,
}) => {
  return (
    <div
      className={`fixed top-8 right-8 z-50 flex items-center gap-4 p-6 rounded-xl shadow-2xl transition-all duration-300 ${
        type === "error"
          ? "bg-red-100 text-red-900 border-l-4 border-red-700"
          : type === "warning"
            ? "bg-yellow-100 text-yellow-900 border-l-4 border-yellow-700"
            : "bg-green-100 text-green-900 border-l-4 border-green-700"
      } animate-slide-in`}
    >
      {type === "error" ? (
        <AlertCircle className="h-6 w-6" />
      ) : type === "warning" ? (
        <AlertCircle className="h-6 w-6" />
      ) : (
        <CheckCircle className="h-6 w-6" />
      )}
      <span className="text-base font-semibold">{message}</span>
      <button onClick={onClose} className="ml-auto">
        <X className="h-5 w-5" />
      </button>
    </div>
  )
}

// Signature Canvas Component
const SignatureCanvas = React.forwardRef<
  any,
  {
    canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement>
    onSignatureChange?: (signature: string) => void
    initialSignature?: string
  }
>(({ canvasProps, onSignatureChange, initialSignature }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    if (initialSignature) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      img.src = initialSignature
    }
  }, [initialSignature])

  const getEventPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      }
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    setIsDrawing(true)
    const pos = getEventPos(e)
    setLastPoint(pos)

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing || !lastPoint) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const pos = getEventPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setLastPoint(pos)
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    setLastPoint(null)

    if (onSignatureChange && canvasRef.current) {
      const signatureData = canvasRef.current.toDataURL("image/png")
      onSignatureChange(signatureData)
    }
  }

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (onSignatureChange) {
      onSignatureChange("")
    }
  }

  const getTrimmedCanvas = () => {
    return {
      toDataURL: () => canvasRef.current?.toDataURL("image/png") || "",
    }
  }

  React.useImperativeHandle(ref, () => ({
    clear,
    getTrimmedCanvas,
  }))

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        className="border-2 border-gray-300 rounded-lg cursor-crosshair bg-white shadow-sm hover:border-indigo-400 transition-colors"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        {...canvasProps}
      />
      <div className="absolute top-2 right-2 flex gap-2">
        <button
          type="button"
          onClick={clear}
          className="px-3 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  )
})

SignatureCanvas.displayName = "SignatureCanvas"

// Stock Warning Component
const StockWarning: React.FC<{
  items: InvoiceItem[]
  stocks: Stock[]
  onProceed: () => void
  onCancel: () => void
}> = ({ items, stocks, onProceed, onCancel }) => {
  const stockIssues = items
    .map((item) => {
      const stock = stocks.find((s) => s.productName === item.productName)
      const availableStock = stock ? stock.quantity : 0
      const isInsufficient = availableStock < item.quantity

      return {
        productName: item.productName,
        required: item.quantity,
        available: availableStock,
        isInsufficient,
      }
    })
    .filter((issue) => issue.isInsufficient)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Package className="h-8 w-8 text-yellow-600" />
          <h3 className="text-2xl font-bold text-gray-900">Stock Warning</h3>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            The following items have insufficient stock. You can still proceed with the invoice:
          </p>

          <div className="space-y-3">
            {stockIssues.map((issue, index) => (
              <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{issue.productName}</span>
                  <span className="text-sm text-gray-600">
                    Required: {issue.required} | Available: {issue.available}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onProceed}
            className="px-6 py-3 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 font-medium transition-colors"
          >
            Proceed Anyway
          </button>
        </div>
      </div>
    </div>
  )
}

// Invoice Preview Component
const InvoicePreview: React.FC<{ invoice: Invoice; template: string }> = ({ invoice, template }) => {
  const formatDate = (date: string) =>
    date ? new Date(date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "N/A"
  const currencySymbol =
    invoice.currency === "USD" ? "$" : invoice.currency === "EUR" ? "€" : invoice.currency === "GBP" ? "£" : "₹"

  return (
    <div
      className={`border border-gray-200 rounded-2xl p-8 bg-white shadow-lg ${
        template === "Minimal" ? "bg-gray-50" : template === "Classic" ? "bg-blue-50" : ""
      }`}
    >
      <div className={`text-center mb-8 ${template === "Modern" ? "border-b-2 border-indigo-600 pb-4" : ""}`}>
        <h3 className="text-2xl font-bold text-gray-900">Invoice Preview</h3>
        <p className="text-sm text-gray-600">Construction Co. Ltd.</p>
        <p className="text-sm text-gray-600">GSTIN: 12ABCDE1234F1Z5</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <p className="text-sm text-gray-600">
            <strong>Bill To:</strong> {invoice.clientName || "N/A"}
          </p>
          <p className="text-sm text-gray-600">{invoice.clientAddress || "N/A"}</p>
          <p className="text-sm text-gray-600">
            <strong>GSTIN:</strong> {invoice.clientGSTIN || "N/A"}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Email:</strong> {invoice.clientEmail || "N/A"}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Phone:</strong> {invoice.clientPhone || "N/A"}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Project:</strong> {invoice.projectName || "N/A"}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Work Order #:</strong> {invoice.workOrderNumber || "N/A"}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Site Location:</strong> {invoice.siteLocation || "N/A"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">
            <strong>Invoice #:</strong> {invoice.invoiceId}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Invoice Date:</strong> {formatDate(invoice.invoiceDate)}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Due Date:</strong> {formatDate(invoice.dueDate)}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Payment Terms:</strong> {invoice.paymentTerms || "N/A"}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Currency:</strong> {invoice.currency}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Tax Zone:</strong> {invoice.taxZone}
          </p>
        </div>
      </div>
      <div className="mb-8 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className={template === "Modern" ? "bg-indigo-50" : "bg-gray-100"}>
              <th className="border border-gray-200 p-4 text-sm font-semibold text-gray-800 text-left">Product</th>
              <th className="border border-gray-200 p-4 text-sm font-semibold text-gray-800 text-left">Description</th>
              <th className="border border-gray-200 p-4 text-sm font-semibold text-gray-800 text-center">UoM</th>
              <th className="border border-gray-200 p-4 text-sm font-semibold text-gray-800 text-center">Qty</th>
              <th className="border border-gray-200 p-4 text-sm font-semibold text-gray-800 text-right">
                Price ({currencySymbol})
              </th>
              <th className="border border-gray-200 p-4 text-sm font-semibold text-gray-800 text-right">
                Total ({currencySymbol})
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border border-gray-200 p-4 text-sm text-gray-600">{item.productName || "N/A"}</td>
                <td className="border border-gray-200 p-4 text-sm text-gray-600">{item.description || "N/A"}</td>
                <td className="border border-gray-200 p-4 text-sm text-gray-600 text-center">{item.uom || "N/A"}</td>
                <td className="border border-gray-200 p-4 text-sm text-gray-600 text-center">{item.quantity}</td>
                <td className="border border-gray-200 p-4 text-sm text-gray-600 text-right">
                  {currencySymbol}
                  {item.unitPrice.toFixed(2)}
                </td>
                <td className="border border-gray-200 p-4 text-sm text-gray-600 text-right">
                  {currencySymbol}
                  {item.total.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 text-right">
        <p className="text-sm text-gray-600">
          <strong>Subtotal:</strong> {currencySymbol}
          {invoice.subtotal.toFixed(2)}
        </p>
        <p className="text-sm text-gray-600">
          <strong>CGST ({invoice.cgstRate}%):</strong> {currencySymbol}
          {invoice.cgstAmount.toFixed(2)}
        </p>
        <p className="text-sm text-gray-600">
          <strong>SGST ({invoice.sgstRate}%):</strong> {currencySymbol}
          {invoice.sgstAmount.toFixed(2)}
        </p>
        <p className="text-sm text-gray-600">
          <strong>IGST ({invoice.igstRate}%):</strong> {currencySymbol}
          {invoice.igstAmount.toFixed(2)}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Total Tax:</strong> {currencySymbol}
          {invoice.totalTax.toFixed(2)}
        </p>
        <p className="text-lg font-bold text-gray-900">
          <strong>Total Amount:</strong> {currencySymbol}
          {invoice.totalAmount.toFixed(2)}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Paid Amount:</strong> {currencySymbol}
          {invoice.paidAmount.toFixed(2)}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Balance Due:</strong> {currencySymbol}
          {invoice.balanceAmount.toFixed(2)}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Notes:</strong> {invoice.notes || "N/A"}
        </p>
      </div>
      {invoice.signature && (
        <div className="mt-8 border-t pt-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Authorized Signature</h4>
          <div className="flex justify-end">
            <img
              src={invoice.signature || "/placeholder.svg"}
              alt="Signature"
              className="h-20 w-auto border border-gray-200 rounded-lg bg-white p-2"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Payment Form Component
const PaymentForm: React.FC<{ invoice: Invoice; onSave: (payment: Payment) => void; onCancel: () => void }> = ({
  invoice,
  onSave,
  onCancel,
}) => {
  const [paymentData, setPaymentData] = useState<Payment>({
    paymentId: uuidv4(),
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    method: "Bank Transfer",
    timestamp: Date.now(),
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setPaymentData((prev) => ({ ...prev, [name]: name === "amount" ? Number.parseFloat(value) || 0 : value }))
  }

  const handleDateChange = (date: Date | null) => {
    if (date) setPaymentData((prev) => ({ ...prev, date: date.toISOString().split("T")[0] }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (paymentData.amount <= 0 || paymentData.amount > invoice.balanceAmount) {
      alert("Invalid payment amount")
      return
    }
    onSave({ ...paymentData, timestamp: Date.now() })
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border-t-4 border-green-500">
      <h3 className="text-2xl font-semibold mb-6 text-gray-900">Record Payment</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
          <input
            type="number"
            name="amount"
            value={paymentData.amount}
            onChange={handleChange}
            className="w-full h-12 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg px-4"
            min="0"
            step="0.01"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
          <DatePicker
            selected={paymentData.date ? new Date(paymentData.date) : null}
            onChange={handleDateChange}
            className="w-full h-12 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg px-4"
            dateFormat="dd/MM/yyyy"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Method</label>
          <select
            name="method"
            value={paymentData.method}
            onChange={handleChange}
            className="w-full h-12 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg px-4"
          >
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cash">Cash</option>
            <option value="Credit Card">Credit Card</option>
            <option value="UPI">UPI</option>
          </select>
        </div>
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition-colors"
          >
            Save Payment
          </button>
        </div>
      </form>
    </div>
  )
}

// Invoice Form Component
const InvoiceForm: React.FC<{
  invoice?: Invoice | null
  onSave: (invoice: Invoice) => void
  onCancel: () => void
  clients: Client[]
  stocks: Stock[]
}> = ({ invoice, onSave, onCancel, clients, stocks }) => {
  const [formData, setFormData] = useState<Invoice>({
    invoiceId: "",
    clientName: "",
    clientAddress: "",
    clientGSTIN: "",
    clientEmail: "",
    clientPhone: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    projectName: "",
    workOrderNumber: "",
    siteLocation: "",
    paymentTerms: PAYMENT_TERMS[0],
    currency: "INR",
    taxZone: TAX_ZONES[0].name,
    items: [
      { productName: "", description: "", uom: "", quantity: 1, unitPrice: 0, total: 0, cgst: 0, sgst: 0, igst: 0 },
    ],
    subtotal: 0,
    cgstRate: TAX_ZONES[0].cgst,
    sgstRate: TAX_ZONES[0].sgst,
    igstRate: TAX_ZONES[0].igst,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 0,
    totalTax: 0,
    totalAmount: 0,
    paidAmount: 0,
    balanceAmount: 0,
    status: "draft",
    notes: "",
    template: "Modern",
    isRecurring: false,
    recurrenceInterval: "",
    recurrenceEndDate: "",
    payments: [],
    timestamp: 0,
    lastModifiedBy: "System",
    enableStockManagement: false,
  })
  const signatureRef = useRef<any>(null)
  const [showRecurring, setShowRecurring] = useState(formData.isRecurring)
  const [signature, setSignature] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showStockWarning, setShowStockWarning] = useState(false)

  useEffect(() => {
    if (invoice) {
      setFormData(invoice)
      setSignature(invoice.signature || "")
      setShowRecurring(invoice.isRecurring)
    }
  }, [invoice])

  const validateGSTIN = (gstin: string) => {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    return gstin ? gstinRegex.test(gstin) : true
  }

  const validateTaxZone = (taxZone: string, cgstRate: number, sgstRate: number, igstRate: number) => {
    const zone = TAX_ZONES.find((z) => z.name === taxZone)
    if (!zone) return false
    return (
      cgstRate === zone.cgst &&
      sgstRate === zone.sgst &&
      igstRate === zone.igst
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => {
      const updatedData = {
        ...prev,
        [name]:
          name === "cgstRate" ||
          name === "sgstRate" ||
          name === "igstRate" ||
          name === "paidAmount" ||
          name === "balanceAmount"
            ? Number.parseFloat(value) || 0
            : type === "checkbox"
              ? (e.target as HTMLInputElement).checked
              : value,
      }
      if (name === "taxZone") {
        const zone = TAX_ZONES.find((z) => z.name === value)
        if (zone) {
          updatedData.cgstRate = zone.cgst
          updatedData.sgstRate = zone.sgst
          updatedData.igstRate = zone.igst
        }
      }
      return calculateTotals(updatedData)
    })
  }

  const handleDateChange = (date: Date | null, field: "invoiceDate" | "dueDate" | "recurrenceEndDate") => {
    if (date) setFormData((prev) => ({ ...prev, [field]: date.toISOString().split("T")[0] }))
  }

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setFormData((prev) => {
      const updatedItems = [...prev.items]
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: field === "quantity" || field === "unitPrice" ? Number.parseFloat(value as string) || 0 : value,
      }
      if (field === "productName") {
        const product = CONSTRUCTION_PRODUCTS.find((p) => p.name === value)
        if (product) {
          updatedItems[index].uom = product.uom
          updatedItems[index].unitPrice = product.defaultPrice
        }
      }
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unitPrice
      const cgst = (updatedItems[index].total * prev.cgstRate) / 100
      const sgst = (updatedItems[index].total * prev.sgstRate) / 100
      const igst = (updatedItems[index].total * prev.igstRate) / 100
      updatedItems[index].cgst = cgst
      updatedItems[index].sgst = sgst
      updatedItems[index].igst = igst
      updatedItems[index].total += cgst + sgst + igst
      const updatedData = { ...prev, items: updatedItems }
      return calculateTotals(updatedData)
    })
  }

  const addItem = () => {
    setFormData((prev) => {
      const updatedItems = [
        ...prev.items,
        { productName: "", description: "", uom: "", quantity: 1, unitPrice: 0, total: 0, cgst: 0, sgst: 0, igst: 0 },
      ]
      return calculateTotals({ ...prev, items: updatedItems })
    })
  }

  const removeItem = (index: number) => {
    setFormData((prev) => {
      const updatedItems = prev.items.filter((_, i) => i !== index)
      return calculateTotals({ ...prev, items: updatedItems })
    })
  }

  const calculateTotals = (data: Invoice): Invoice => {
    const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const cgstAmount = subtotal * (data.cgstRate / 100)
    const sgstAmount = subtotal * (data.sgstRate / 100)
    const igstAmount = subtotal * (data.igstRate / 100)
    const totalTax = cgstAmount + sgstAmount + igstAmount
    const totalAmount = subtotal + totalTax
    const balanceAmount = totalAmount - data.paidAmount
    const status = data.paidAmount >= totalAmount ? "paid" : data.paidAmount > 0 ? "partially_paid" : data.status
    return { ...data, subtotal, cgstAmount, sgstAmount, igstAmount, totalTax, totalAmount, balanceAmount, status }
  }

  const checkStockAvailability = () => {
    if (!formData.enableStockManagement) return true

    const stockIssues = formData.items.some((item) => {
      const stock = stocks.find((s) => s.productName === item.productName)
      const availableStock = stock ? stock.quantity : 0
      return availableStock < item.quantity
    })

    return !stockIssues
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !formData.clientName ||
      !formData.clientAddress ||
      !formData.invoiceDate ||
      !formData.dueDate ||
      !formData.projectName ||
      !formData.workOrderNumber ||
      !formData.siteLocation ||
      !formData.paymentTerms ||
      formData.items.length === 0 ||
      formData.items.some((item) => !item.productName || !item.description || item.quantity <= 0 || item.unitPrice <= 0)
    ) {
      alert("Please fill all required fields and ensure item quantities and prices are greater than 0")
      return
    }

    if (!validateGSTIN(formData.clientGSTIN || "")) {
      alert("Invalid GSTIN format")
      return
    }

    if (!validateTaxZone(formData.taxZone, formData.cgstRate, formData.sgstRate, formData.igstRate)) {
      alert("Tax rates do not match the selected tax zone")
      return
    }

    if (formData.enableStockManagement && !checkStockAvailability()) {
      setShowStockWarning(true)
      return
    }

    await saveInvoice()
  }

  const saveInvoice = async () => {
    setIsSubmitting(true)
    try {
      const invoiceToSave = {
        ...formData,
        signature: signature,
        balanceAmount: formData.totalAmount - formData.paidAmount,
      }
      await onSave(invoiceToSave)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStockWarningProceed = () => {
    setShowStockWarning(false)
    saveInvoice()
  }

  const getStockInfo = (productName: string) => {
    const stock = stocks.find((s) => s.productName === productName)
    return stock ? stock.quantity : 0
  }

  return (
    <>
      {showStockWarning && (
        <StockWarning
          items={formData.items}
          stocks={stocks}
          onProceed={handleStockWarningProceed}
          onCancel={() => setShowStockWarning(false)}
        />
      )}

      <div className="bg-white rounded-3xl shadow-2xl p-10 mb-10 max-w-6xl mx-auto border-t-4 border-indigo-600 animate-fade-in">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-4xl font-extrabold text-gray-900">{invoice ? "Edit Invoice" : "Create New Invoice"}</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Stock Management Toggle */}
          <div className="border-b border-gray-100 pb-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Settings</h3>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableStockManagement"
                name="enableStockManagement"
                checked={formData.enableStockManagement}
                onChange={handleChange}
                className="mr-3 h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="enableStockManagement" className="text-lg font-medium text-gray-700">
                Enable Stock Management (Optional)
              </label>
              <div className="ml-2 text-sm text-gray-500">- When enabled, system will check stock availability</div>
            </div>
          </div>

          {/* Client Details */}
          <div className="border-b border-gray-100 pb-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Client Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client Name *</label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleChange}
                  className="w-full h-14 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg px-4"
                  required
                  placeholder="Enter client name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client GSTIN</label>
                <input
                  type="text"
                  name="clientGSTIN"
                  value={formData.clientGSTIN}
                  onChange={handleChange}
                  className="w-full h-14 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg px-4"
                  placeholder="Enter GSTIN"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client Email</label>
                <input
                  type="email"
                  name="clientEmail"
                  value={formData.clientEmail}
                  onChange={handleChange}
                  className="w-full h-14 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg px-4"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client Phone</label>
                <input
                  type="tel"
                  name="clientPhone"
                  value={formData.clientPhone}
                  onChange={handleChange}
                  className="w-full h-14 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg px-4"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Name *</label>
                <input
                  type="text"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleChange}
                  className="w-full h-14 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg px-4"
                  required
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Work Order Number *</label>
                <input
                  type="text"
                  name="workOrderNumber"
                  value={formData.workOrderNumber}
                  onChange={handleChange}
                  className="w-full h-14 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg px-4"
                  required
                  placeholder="Enter work order number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Location *</label>
                <input
                  type="text"
                  name="siteLocation"
                  value={formData.siteLocation}
                  onChange={handleChange}
                  className="w-full h-14 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg px-4"
                  required
                  placeholder="Enter site location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms *</label>
                <select
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={handleChange}
                  className="w-full h-14 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg px-4"
                  required
                >
                  {PAYMENT_TERMS.map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Client Address *</label>
              <textarea
                name="clientAddress"
                value={formData.clientAddress}
                onChange={handleChange}
                className="w-full h-24 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg px-4 py-3"
                rows={4}
                required
                placeholder="Enter complete client address"
              />
            </div>
          </div>

          {/* Invoice Details */}
          <div className="border-b border-gray-100 pb-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Invoice Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Date *</label>
                <div className="relative">
                  <DatePicker
                    selected={formData.invoiceDate ? new Date(formData.invoiceDate) : null}
                    onChange={(date) => handleDateChange(date, "invoiceDate")}
                    className="w-full h-14 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg px-12"
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Select invoice date"
                    required
                  />
                  <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
                <div className="relative">
                  <DatePicker
                    selected={formData.dueDate ? new Date(formData.dueDate) : null}
                    onChange={(date) => handleDateChange(date, "dueDate")}
                    className="w-full h-14 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg px-12"
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Select due date"
                    required
                  />
                  <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full h-14 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg px-4"
                  required
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tax Zone</label>
                <select
                  name="taxZone"
                  value={formData.taxZone}
                  onChange={handleChange}
                  className="w-full h-14 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg px-4"
                  required
                >
                  {TAX_ZONES.map((zone) => (
                    <option key={zone.name} value={zone.name}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                <select
                  name="template"
                  value={formData.template}
                  onChange={handleChange}
                  className="w-full h-14 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg px-4"
                  required
                >
                  {INVOICE_TEMPLATES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center h-14">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={showRecurring}
                  onChange={() => {
                    setShowRecurring(!showRecurring)
                    setFormData((prev) => ({ ...prev, isRecurring: !showRecurring }))
                  }}
                  className="mr-3 h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isRecurring" className="text-lg font-medium text-gray-700">
                  Set as Recurring
                </label>
              </div>
            </div>
            {showRecurring && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recurrence Interval</label>
                  <select
                    name="recurrenceInterval"
                    value={formData.recurrenceInterval}
                    onChange={handleChange}
                    className="w-full h-14 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg px-4"
                    required={formData.isRecurring}
                  >
                    <option value="">Select Interval</option>
                    {RECURRENCE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recurrence End Date</label>
                  <DatePicker
                    selected={formData.recurrenceEndDate ? new Date(formData.recurrenceEndDate) : null}
                    onChange={(date) => handleDateChange(date, "recurrenceEndDate")}
                    className="w-full h-14 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg px-12"
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Select end date"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Items Section */}
          <div className="border-b border-gray-100 pb-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Items</h3>
            {formData.items.map((item, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm hover:shadow-md transition-shadow bg-gray-50"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Product Item *</label>
                    <select
                      value={item.productName}
                      onChange={(e) => handleItemChange(index, "productName", e.target.value)}
                      className="w-full h-12 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base px-4"
                      required
                    >
                      <option value="">Select Product</option>
                      {CONSTRUCTION_PRODUCTS.map((product) => (
                        <option key={product.name} value={product.name}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                    {formData.enableStockManagement && item.productName && (
                      <div className="mt-2 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            getStockInfo(item.productName) >= item.quantity
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          Stock: {getStockInfo(item.productName)} available
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Description *</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, "description", e.target.value)}
                      className="w-full h-12 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base px-4"
                      required
                      placeholder="Enter item description"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">UoM</label>
                    <input
                      type="text"
                      value={item.uom}
                      disabled
                      className="w-full h-12 rounded-xl border-gray-300 bg-gray-100 text-gray-600 text-base px-4"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Quantity *</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                      className="w-full h-12 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base px-4"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Unit Price ({formData.currency}) *
                    </label>
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                      className="w-full h-12 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base px-4"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Total ({formData.currency})</label>
                    <input
                      type="text"
                      value={item.total.toFixed(2)}
                      disabled
                      className="w-full h-12 rounded-xl border-gray-300 bg-gray-100 text-gray-600 text-base px-4"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="w-12 h-12 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addItem}
              className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl text-lg font-medium h-12 px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-5 w-5" /> Add Item
            </button>
          </div>

          {/* Tax Section */}
          <div className="border-b border-gray-100 pb-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Tax Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CGST Rate (%)</label>
                <input
                  type="number"
                  name="cgstRate"
                  value={formData.cgstRate}
                  onChange={handleChange}
                  className="w-full h-14 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg px-4"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SGST Rate (%)</label>
                <input
                  type="number"
                  name="sgstRate"
                  value={formData.sgstRate}
                  onChange={handleChange}
                  className="w-full h-14 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg px-4"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">IGST Rate (%)</label>
                <input
                  type="number"
                  name="igstRate"
                  value={formData.igstRate}
                  onChange={handleChange}
                  className="w-full h-14 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg px-4"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div className="border-b border-gray-100 pb-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <PenTool className="h-6 w-6" />
              Digital Signature
            </h3>
            <div className="bg-gray-50 p-6 rounded-2xl">
              <p className="text-sm text-gray-600 mb-4">Draw your signature below:</p>
              <SignatureCanvas ref={signatureRef} onSignatureChange={setSignature} initialSignature={signature} />
              {signature && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm text-green-700 font-medium">✓ Signature captured successfully</p>
                </div>
              )}
            </div>
          </div>

          {/* Summary Section */}
          <div className="border-b border-gray-100 pb-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Summary</h3>
            <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-6 rounded-2xl">
              <div className="space-y-3 text-right max-w-md ml-auto">
                <p className="text-lg text-gray-700">
                  <strong>Subtotal:</strong>{" "}
                  {formData.currency === "USD"
                    ? "$"
                    : formData.currency === "EUR"
                      ? "€"
                      : formData.currency === "GBP"
                        ? "£"
                        : "₹"}
                  {formData.subtotal.toFixed(2)}
                </p>
                <p className="text-base text-gray-600">
                  <strong>CGST ({formData.cgstRate}%):</strong>{" "}
                  {formData.currency === "USD"
                    ? "$"
                    : formData.currency === "EUR"
                      ? "€"
                      : formData.currency === "GBP"
                        ? "£"
                        : "₹"}
                  {formData.cgstAmount.toFixed(2)}
                </p>
                <p className="text-base text-gray-600">
                  <strong>SGST ({formData.sgstRate}%):</strong>{" "}
                  {formData.currency === "USD"
                    ? "$"
                    : formData.currency === "EUR"
                      ? "€"
                      : formData.currency === "GBP"
                        ? "£"
                        : "₹"}
                  {formData.sgstAmount.toFixed(2)}
                </p>
                <p className="text-base text-gray-600">
                  <strong>IGST ({formData.igstRate}%):</strong>{" "}
                  {formData.currency === "USD"
                    ? "$"
                    : formData.currency === "EUR"
                      ? "€"
                      : formData.currency === "GBP"
                        ? "£"
                        : "₹"}
                  {formData.igstAmount.toFixed(2)}
                </p>
                <p className="text-lg text-gray-700">
                  <strong>Total Tax:</strong>{" "}
                  {formData.currency === "USD"
                    ? "$"
                    : formData.currency === "EUR"
                      ? "€"
                      : formData.currency === "GBP"
                        ? "£"
                        : "₹"}
                  {formData.totalTax.toFixed(2)}
                </p>
                <div className="border-t-2 border-indigo-200 pt-3">
                  <p className="text-2xl font-bold text-indigo-700">
                    <strong>Total Amount:</strong>{" "}
                    {formData.currency === "USD"
                      ? "$"
                      : formData.currency === "EUR"
                        ? "€"
                        : formData.currency === "GBP"
                          ? "£"
                          : "₹"}
                    {formData.totalAmount.toFixed(2)}
                  </p>
                </div>
                <p className="text-base text-gray-600">
                  <strong>Paid Amount:</strong>{" "}
                  {formData.currency === "USD"
                    ? "$"
                    : formData.currency === "EUR"
                      ? "€"
                      : formData.currency === "GBP"
                        ? "£"
                        : "₹"}
                  {formData.paidAmount.toFixed(2)}
                </p>
                <p className="text-lg font-semibold text-red-600">
                  <strong>Balance Due:</strong>{" "}
                  {formData.currency === "USD"
                    ? "$"
                    : formData.currency === "EUR"
                      ? "€"
                      : formData.currency === "GBP"
                        ? "£"
                        : "₹"}
                  {formData.balanceAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="border-b border-gray-100 pb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full h-24 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg px-4 py-3"
              rows={4}
              placeholder="Add any additional notes or terms..."
            />
          </div>

          {/* Preview Section */}
          <div className="border-t border-gray-100 pt-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Invoice Preview</h3>
            <InvoicePreview invoice={formData} template={formData.template} />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 mt-10">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-2 rounded-xl text-lg font-medium h-14 px-8 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center gap-2 rounded-xl text-lg font-semibold h-14 px-8 py-2 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isSubmitting ? "Processing..." : invoice ? "Update Invoice" : "Create Invoice"}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

const InvoiceCard: React.FC<{
  invoice: Invoice
  onViewDetails: (invoice: Invoice) => void
  onEdit: (invoice: Invoice) => void
  onDelete: (invoiceId: string) => void
  onSend: (invoiceId: string) => void
  onMarkAsPaid: (invoiceId: string) => void
  onDuplicate: (invoice: Invoice) => void
  onCancelInvoice: (invoiceId: string) => void
  onRecordPayment: (invoice: Invoice) => void
}> = ({
  invoice,
  onViewDetails,
  onEdit,
  onDelete,
  onSend,
  onMarkAsPaid,
  onDuplicate,
  onCancelInvoice,
  onRecordPayment,
}) => {
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
  const currencySymbol =
    invoice.currency === "USD" ? "$" : invoice.currency === "EUR" ? "€" : invoice.currency === "GBP" ? "£" : "₹"

  const exportToPDF = () => {
    const doc = new jsPDF()
    const template = invoice.template
    const bgColor = template === "Modern" ? [59, 130, 246] : template === "Classic" ? [0, 102, 204] : [100, 100, 100]

    doc.setFontSize(22)
    doc.setTextColor(bgColor[0], bgColor[1], bgColor[2])
    doc.text("ConstructionCo. Ltd.", 20, 20)
    doc.setFontSize(12)
    doc.setTextColor(100)
    doc.text("123 Construction Lane, City, Country", 20, 28)
    doc.text("Phone: +91-98765-43210 | Email: invoices@example.com", 20, 34)
    doc.text("GSTIN: 12ABCDE1234F1Z5", 20, 40)

    doc.setFontSize(18)
    doc.setTextColor(0)
    doc.text("TAX INVOICE", 180, 20, { align: "right" })
    doc.setFontSize(12)
    doc.text(`Invoice: ${invoice.invoiceId}`, 180, 30, { align: "right" })
    doc.text(`Date: ${formatDate(invoice.invoiceDate)}`, 180, 38, { align: "right" })
    doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 180, 46, { align: "right" })
    doc.text(`Payment Terms: ${invoice.paymentTerms}`, 180, 54, { align: "right" })
    doc.text(`Currency: ${invoice.currency}`, 180, 62, { align: "right" })

    doc.setFontSize(12)
    doc.text("Bill To:", 20, 60)
    doc.setFontSize(10)
    doc.text(invoice.clientName, 20, 68)
    doc.text(invoice.clientAddress, 20, 76)
    doc.text(`GSTIN: ${invoice.clientGSTIN || "N/A"}`, 20, 84)
    doc.text(`Email: ${invoice.clientEmail || "N/A"}`, 20, 92)
    doc.text(`Phone: ${invoice.clientPhone || "N/A"}`, 20, 100)
    doc.text(`Project: ${invoice.projectName || "N/A"}`, 20, 108)
    doc.text(`Work Order #: ${invoice.workOrderNumber || "N/A"}`, 20, 116)
    doc.text(`Site Location: ${invoice.siteLocation || "N/A"}`, 20, 124)

    autoTable(doc, {
      startY: 134,
      head: [
        [
          "Product",
          "Description",
          "UoM",
          "Qty",
          `Unit Price (${currencySymbol})`,
          "CGST",
          "SGST",
          "IGST",
          `Total (${currencySymbol})`,
        ],
      ],
      body: invoice.items.map((item) => [
        item.productName || "-",
        item.description || "-",
        item.uom || "-",
        item.quantity,
        `${currencySymbol}${item.unitPrice.toFixed(2)}`,
        item.cgst ? `${currencySymbol}${item.cgst.toFixed(2)}` : "-",
        item.sgst ? `${currencySymbol}${item.sgst.toFixed(2)}` : "-",
        item.igst ? `${currencySymbol}${item.igst.toFixed(2)}` : "-",
        `${currencySymbol}${item.total.toFixed(2)}`,
      ]),
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: bgColor, textColor: 255 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 50 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 25 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 },
        7: { cellWidth: 20 },
        8: { cellWidth: 25 },
      },
    })

    const finalY = (doc as any).lastAutoTable.finalY || 134
    doc.setFontSize(10)
    doc.text(`Subtotal: ${currencySymbol}${invoice.subtotal.toFixed(2)}`, 150, finalY + 10, { align: "right" })
    doc.text(`CGST (${invoice.cgstRate}%): ${currencySymbol}${invoice.cgstAmount.toFixed(2)}`, 150, finalY + 18, {
      align: "right",
    })
    doc.text(`SGST (${invoice.sgstRate}%): ${currencySymbol}${invoice.sgstAmount.toFixed(2)}`, 150, finalY + 26, {
      align: "right",
    })
    doc.text(`IGST (${invoice.igstRate}%): ${currencySymbol}${invoice.igstAmount.toFixed(2)}`, 150, finalY + 34, {
      align: "right",
    })
    doc.text(`Total Tax: ${currencySymbol}${invoice.totalTax.toFixed(2)}`, 150, finalY + 42, { align: "right" })
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(`Total Amount: ${currencySymbol}${invoice.totalAmount.toFixed(2)}`, 150, finalY + 50, { align: "right" })
    doc.text(`Paid Amount: ${currencySymbol}${invoice.paidAmount.toFixed(2)}`, 150, finalY + 58, { align: "right" })
    doc.text(`Balance Due: ${currencySymbol}${invoice.balanceAmount.toFixed(2)}`, 150, finalY + 66, { align: "right" })
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(`Notes: ${invoice.notes || "N/A"}`, 20, finalY + 76)

    if (invoice.signature) {
      try {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          doc.addImage(img, "PNG", 20, finalY + 86, 60, 25)
          doc.text("Authorized Signature", 20, finalY + 116)
          doc.setFontSize(8)
          doc.setTextColor(150)
          doc.text("Generated by Construction Co. Ltd. | GST Compliant Invoice", 20, 280)
          doc.save(`invoice_${invoice.invoiceId}.pdf`)
        }
        img.onerror = () => {
          doc.setFontSize(8)
          doc.setTextColor(150)
          doc.text("Generated by Construction Co. Ltd. | GST Compliant Invoice", 20, 280)
          doc.save(`invoice_${invoice.invoiceId}.pdf`)
        }
        img.src = invoice.signature
      } catch (error) {
        console.error("Error adding signature to PDF:", error)
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text("Generated by Construction Co. Ltd. | GST Compliant Invoice", 20, 280)
        doc.save(`invoice_${invoice.invoiceId}.pdf`)
      }
    } else {
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text("Generated by Construction Co. Ltd. | GST Compliant Invoice", 20, 280)
      doc.save(`invoice_${invoice.invoiceId}.pdf`)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 hover:shadow-xl transition-all border-l-4 border-indigo-600 animate-slide-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Invoice #{invoice.invoiceId}</h3>
          <p className="text-sm text-gray-600">
            {invoice.clientName} - {invoice.projectName}
          </p>
        </div>
        <div
          className={`text-sm font-semibold px-4 py-2 rounded-full ${
            invoice.status === "paid"
              ? "bg-green-100 text-green-800"
              : invoice.status === "partially_paid"
                ? "bg-yellow-100 text-yellow-800"
                : invoice.status === "overdue"
                  ? "bg-red-100 text-red-800"
                  : invoice.status === "sent"
                    ? "bg-blue-100 text-blue-800"
                    : invoice.status === "cancelled"
                      ? "bg-gray-100 text-gray-800"
                      : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1).replace("_", " ")}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <p className="text-sm text-gray-600">
          <strong>Total:</strong> {currencySymbol}
          {invoice.totalAmount.toFixed(2)}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Balance:</strong> {currencySymbol}
          {invoice.balanceAmount.toFixed(2)}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Due Date:</strong> {formatDate(invoice.dueDate)}
        </p>
        {invoice.isRecurring && (
          <p className="text-sm text-gray-600">
            <strong>Recurring:</strong> {invoice.recurrenceInterval}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onViewDetails(invoice)}
          className="inline-flex items-center gap-2 rounded-lg text-sm font-medium h-10 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700"
        >
          <FileText className="h-4 w-4" /> View Details
        </button>
        {["draft", "sent"].includes(invoice.status) && (
          <button
            onClick={() => onEdit(invoice)}
            className="inline-flex items-center gap-2 rounded-lg text-sm font-medium h-10 px-4 py-2 bg-yellow-600 text-white hover:bg-yellow-700"
          >
            <Edit className="h-4 w-4" /> Edit
          </button>
        )}
        {invoice.status === "draft" && (
          <button
            onClick={() => onSend(invoice.invoiceId)}
            className="inline-flex items-center gap-2 rounded-lg text-sm font-medium h-10 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            <Send className="h-4 w-4" /> Send
          </button>
        )}
        {(invoice.status === "sent" || invoice.status === "partially_paid") && invoice.balanceAmount > 0 && (
          <button
            onClick={() => onRecordPayment(invoice)}
            className="inline-flex items-center gap-2 rounded-lg text-sm font-medium h-10 px-4 py-2 bg-green-600 text-white hover:bg-green-700"
          >
            <IndianRupee className="h-4 w-4" /> Record Payment
          </button>
        )}
        {invoice.status === "sent" && invoice.balanceAmount === 0 && (
          <button
            onClick={() => onMarkAsPaid(invoice.invoiceId)}
            className="inline-flex items-center gap-2 rounded-lg text-sm font-medium h-10 px-4 py-2 bg-green-600 text-white hover:bg-green-700"
          >
            <IndianRupee className="h-4 w-4" /> Mark as Paid
          </button>
        )}
        {invoice.status !== "cancelled" && (
          <button
            onClick={() => onCancelInvoice(invoice.invoiceId)}
            className="inline-flex items-center gap-2 rounded-lg text-sm font-medium h-10 px-4 py-2 bg-gray-600 text-white hover:bg-gray-700"
          >
            <X className="h-4 w-4" /> Cancel
          </button>
        )}
        <button
          onClick={() => onDuplicate(invoice)}
          className="inline-flex items-center gap-2 rounded-lg text-sm font-medium h-10 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700"
        >
          <Copy className="h-4 w-4" /> Duplicate
        </button>
        <button
          onClick={() => onDelete(invoice.invoiceId)}
          className="inline-flex items-center gap-2 rounded-lg text-sm font-medium h-10 px-4 py-2 bg-red-600 text-white hover:bg-red-700"
        >
          <Trash2 className="h-4 w-4" /> Delete
        </button>
        <button
          onClick={exportToPDF}
          className="inline-flex items-center gap-2 rounded-lg text-sm font-medium h-10 px-4 py-2 bg-teal-600 text-white hover:bg-teal-700"
        >
          <Download className="h-4 w-4" /> Export PDF
        </button>
      </div>
    </div>
  )
}

// Enhanced Audit Log Viewer Component
const AuditLogViewer: React.FC<{ logs: AuditLog[]; invoices: Invoice[] }> = ({ logs, invoices }) => {
  const [sortField, setSortField] = useState<keyof AuditLog>("timestamp")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filterAction, setFilterAction] = useState<string>("All")
  const [filterUser, setFilterUser] = useState<string>("All")
  const [filterTaxZone, setFilterTaxZone] = useState<string>("All")
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const logsPerPage = 10
  const [searchQuery, setSearchQuery] = useState<string>("")

  const uniqueUsers = ["All", ...new Set(logs.map((log) => log.user))]
  const uniqueTaxZones = ["All", ...new Set(logs.map((log) => log.taxDetails?.taxZone || ""))].filter(Boolean)

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  const handleSort = (field: keyof AuditLog) => {
    if (sortField === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    else {
      setSortField(field)
      setSortOrder("desc")
    }
  }

  const filteredLogs = logs.filter((log) => {
    const matchesAction = filterAction === "All" || log.action === filterAction
    const matchesUser = filterUser === "All" || log.user === filterUser
    const matchesTaxZone = filterTaxZone === "All" || log.taxDetails?.taxZone === filterTaxZone
    const logDate = new Date(log.timestamp)
    const matchesDate =
      (!startDate || logDate >= startDate) && (!endDate || logDate <= new Date(endDate.setHours(23, 59, 59, 999)))
    const matchesSearch = log.invoiceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.details.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesAction && matchesUser && matchesTaxZone && matchesDate && matchesSearch
  })

  const suspiciousLogs = filteredLogs.filter(
    (log) =>
      log.taxDetails?.complianceStatus === "Non-Compliant" ||
      (log.action === "Update" && log.details.includes("tax")) ||
      (log.action === "Record Payment" && Number(log.details.match(/Amount: (\d+)/)?.[1]) > 100000 && !log.snapshot?.signature)
  )

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    if (sortField === "timestamp") return sortOrder === "asc" ? aValue - bValue : bValue - aValue
    return sortOrder === "asc"
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue))
  })

  const totalPages = Math.ceil(sortedLogs.length / logsPerPage)
  const paginatedLogs = sortedLogs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage)

  const exportToExcel = () => {
    const headers = [
      "Invoice #",
      "Action",
      "User",
      "Date",
      "Details",
      "Tax Zone",
      "CGST Rate",
      "SGST Rate",
      "IGST Rate",
      "CGST Amount",
      "SGST Amount",
      "IGST Amount",
      "Compliance Status",
      "Stock Changes",
    ]
    const rows = sortedLogs.map((log) => [
      log.invoiceId,
      log.action,
      log.user,
      formatDate(log.timestamp),
      log.details,
      log.taxDetails?.taxZone || "N/A",
      log.taxDetails?.cgstRate || "N/A",
      log.taxDetails?.sgstRate || "N/A",
      log.taxDetails?.igstRate || "N/A",
      log.taxDetails?.cgstAmount ? `₹${log.taxDetails.cgstAmount.toFixed(2)}` : "N/A",
      log.taxDetails?.sgstAmount ? `₹${log.taxDetails.sgstAmount.toFixed(2)}` : "N/A",
      log.taxDetails?.igstAmount ? `₹${log.taxDetails.igstAmount.toFixed(2)}` : "N/A",
      log.taxDetails?.complianceStatus || "N/A",
      log.stockChanges
        ? log.stockChanges.map((sc) => `${sc.productName}: ${sc.quantityChange} -> ${sc.newQuantity}`).join("; ")
        : "N/A",
    ])

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs")
    XLSX.write(workbook, "audit_logs.xlsx")
  }

  const exportTaxSummaryToPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text("GST Tax Summary Report", 20, 20)
    doc.setFontSize(12)
    doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, 20, 30)

    const taxSummary = filteredLogs.reduce(
      (acc, log) => {
        if (log.taxDetails) {
          acc.totalCGST += log.taxDetails.cgstAmount || 0
          acc.totalSGST += log.taxDetails.sgstAmount || 0
          acc.totalIGST += log.taxDetails.igstAmount || 0
          acc.count += 1
          if (log.taxDetails.complianceStatus === "Non-Compliant") acc.nonCompliant += 1
        }
        return acc
      },
      { totalCGST: 0, totalSGST: 0, totalIGST: 0, count: 0, nonCompliant: 0 }
    )

    autoTable(doc, {
      startY: 40,
      head: [["Metric", "Value"]],
      body: [
        ["Total Invoices Audited", taxSummary.count],
        ["Total CGST Collected", `₹${taxSummary.totalCGST.toFixed(2)}`],
        ["Total SGST Collected", `₹${taxSummary.totalSGST.toFixed(2)}`],
        ["Total IGST Collected", `₹${taxSummary.totalIGST.toFixed(2)}`],
        ["Non-Compliant Invoices", taxSummary.nonCompliant],
      ],
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    })

    doc.save("gst_tax_summary.pdf")
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-10 border-t-4 border-indigo-600 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-semibold text-gray-900">Audit Logs</h3>
        <div className="flex gap-4">
          <button
            onClick={exportToExcel}
            className="inline-flex items-center gap-2 rounded-lg text-sm font-medium h-10 px-4 py-2 bg-teal-600 text-white hover:bg-teal-700"
          >
            <Download className="h-4 w-4" /> Export Excel
          </button>
          <button
            onClick={exportTaxSummaryToPDF}
            className="inline-flex items-center gap-2 rounded-lg text-sm font-medium h-10 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            <FileText className="h-4 w-4" /> Tax Summary PDF
          </button>
        </div>
      </div>
      {suspiciousLogs.length > 0 && (
        <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span className="text-sm">{suspiciousLogs.length} suspicious activities detected (e.g., non-compliant taxes or large unsigned payments)</span>
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-48">
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-full h-12">
              <SelectValue placeholder="Filter by Action" />
            </SelectTrigger>
            <SelectContent>
              {[
                "All",
                "Create",
                "Update",
                "Delete",
                "Send",
                "Mark as Paid",
                "Record Payment",
                "Duplicate",
                "Cancel",
              ].map((action) => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-48">
          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="w-full h-12">
              <SelectValue placeholder="Filter by User" />
            </SelectTrigger>
            <SelectContent>
              {uniqueUsers.map((user) => (
                <SelectItem key={user} value={user}>
                  {user}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-48">
          <Select value={filterTaxZone} onValueChange={setFilterTaxZone}>
            <SelectTrigger className="w-full h-12">
              <SelectValue placeholder="Filter by Tax Zone" />
            </SelectTrigger>
            <SelectContent>
              {uniqueTaxZones.map((zone) => (
                <SelectItem key={zone} value={zone}>
                  {zone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative w-full md:w-48">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs..."
            className="w-full h-12 rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            className="w-full h-12 rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            dateFormat="dd/MM/yyyy"
            placeholderText="Start Date"
          />
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        <div className="w-full md:w-48">
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            className="w-full h-12 rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            dateFormat="dd/MM/yyyy"
            placeholderText="End Date"
          />
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-indigo-50">
              <th
                className="border border-gray-200 p-4 text-sm font-semibold text-gray-800 text-left cursor-pointer"
                onClick={() => handleSort("invoiceId")}
              >
                Invoice #{" "}
                {sortField === "invoiceId" &&
                  (sortOrder === "asc" ? (
                    <ChevronUp className="inline h-4 w-4" />
                  ) : (
                    <ChevronDown className="inline h-4 w-4" />
                  ))}
              </th>
              <th
                className="border border-gray-200 p-4 text-sm font-semibold text-gray-800 text-left cursor-pointer"
                onClick={() => handleSort("action")}
              >
                Action{" "}
                {sortField === "action" &&
                  (sortOrder === "asc" ? (
                    <ChevronUp className="inline h-4 w-4" />
                  ) : (
                    <ChevronDown className="inline h-4 w-4" />
                  ))}
              </th>
              <th
                className="border border-gray-200 p-4 text-sm font-semibold text-gray-800 text-left cursor-pointer"
                onClick={() => handleSort("user")}
              >
                User{" "}
                {sortField === "user" &&
                  (sortOrder === "asc" ? (
                    <ChevronUp className="inline h-4 w-4" />
                  ) : (
                    <ChevronDown className="inline h-4 w-4" />
                  ))}
              </th>
              <th
                className="border border-gray-200 p-4 text-sm font-semibold text-gray-800 text-left cursor-pointer"
                onClick={() => handleSort("timestamp")}
              >
                Date{" "}
                {sortField === "timestamp" &&
                  (sortOrder === "asc" ? (
                    <ChevronUp className="inline h-4 w-4" />
                  ) : (
                    <ChevronDown className="inline h-4 w-4" />
                  ))}
              </th>
              <th className="border border-gray-200 p-4 text-sm font-semibold text-gray-800 text-left">Details</th>
              <th className="border border-gray-200 p-4 text-sm font-semibold text-gray-800 text-left">Tax Zone</th>
              <th className="border border-gray-200 p-4 text-sm font-semibold text-gray-800 text-left">Compliance</th>
              <th className="border border-gray-200 p-4 text-sm font-semibold text-gray-800 text-left">Stock Changes</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <tr
                  key={log.id}
                  className={cn(
                    "hover:bg-gray-50 transition-colors",
                    log.taxDetails?.complianceStatus === "Non-Compliant" && "bg-red-50"
                  )}
                >
                  <td className="border border-gray-200 p-4 text-sm text-gray-600">{log.invoiceId}</td>
                  <td className="border border-gray-200 p-4 text-sm text-gray-600">{log.action}</td>
                  <td className="border border-gray-200 p-4 text-sm text-gray-600">{log.user}</td>
                  <td className="border border-gray-200 p-4 text-sm text-gray-600">{formatDate(log.timestamp)}</td>
                  <td className="border border-gray-200 p-4 text-sm text-gray-600">{log.details}</td>
                  <td className="border border-gray-200 p-4 text-sm text-gray-600">{log.taxDetails?.taxZone || "N/A"}</td>
                  <td className="border border-gray-200 p-4 text-sm text-gray-600">
                    <span
                      className={cn(
                        "px-2 py-1 rounded text-xs",
                        log.taxDetails?.complianceStatus === "Compliant"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      )}
                    >
                      {log.taxDetails?.complianceStatus || "N/A"}
                    </span>
                  </td>
                  <td className="border border-gray-200 p-4 text-sm text-gray-600">
                    {log.stockChanges
                      ? log.stockChanges.map((sc) => `${sc.productName}: ${sc.quantityChange} -> ${sc.newQuantity}`).join("; ")
                      : "N/A"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="border border-gray-200 p-4 text-sm text-gray-600 text-center">
                  No audit logs found for the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-2 rounded-lg text-sm font-medium h-10 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center gap-2 rounded-lg text-sm font-medium h-10 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

// Client Portal Component
const ClientPortal: React.FC<{
  invoices: Invoice[]
  onViewDetails: (invoice: Invoice) => void
  onPay: (invoice: Invoice) => void
}> = ({ invoices, onViewDetails, onPay }) => {
  const currencySymbol = (currency: string) =>
    currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₹"
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-10">
      <h3 className="text-2xl font-semibold text-gray-900 mb-6">Your Invoices</h3>
      <div className="space-y-4">
        {invoices.length > 0 ? (
          invoices.map((invoice) => (
            <div
              key={invoice.invoiceId}
              className="border border-gray-200 rounded-lg p-6 flex justify-between items-center"
            >
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Invoice #{invoice.invoiceId}</h4>
                <p className="text-sm text-gray-600">Project: {invoice.projectName}</p>
                <p className="text-sm text-gray-600">
                  Total: {currencySymbol(invoice.currency)}
                  {invoice.totalAmount.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  Balance: {currencySymbol(invoice.currency)}
                  {invoice.balanceAmount.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">Due Date: {formatDate(invoice.dueDate)}</p>
                <p className="text-sm text-gray-600">Status: {invoice.status.replace("_", " ")}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => onViewDetails(invoice)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  View Details
                </button>
                {invoice.balanceAmount > 0 && (
                  <button
                    onClick={() => onPay(invoice)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Pay Now
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-600 text-center">No invoices found.</p>
        )}
      </div>
    </div>
  )
}

// Main Invoices Page Component
const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [stocks, setStocks] = useState<Stock[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([])
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [recordingPayment, setRecordingPayment] = useState<Invoice | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [showAuditLogs, setShowAuditLogs] = useState(false)
  const [showClientPortal, setShowClientPortal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("All")
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(true)
  const [totalInvoiced, setTotalInvoiced] = useState(0)
  const [totalPaid, setTotalPaid] = useState(0)
  const [totalOverdue, setTotalOverdue] = useState(0)
  const [pendingInvoices, setPendingInvoices] = useState(0)

  // Firebase data loading
  useEffect(() => {
    setIsLoading(true)
    const invoicesRef = ref(database, "invoices")
    const auditLogsRef = ref(database, "auditLogs")
    const stocksRef = ref(database, "stocks")
    const clientsRef = ref(database, "clients")
    const recurringInvoicesRef = ref(database, "recurringInvoices")

    const unsubscribeInvoices = onValue(invoicesRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const invoicesData = snapshot.val()
          const invoicesList = Object.entries(invoicesData).map(([id, invoice]: [string, any]) => ({
            invoiceId: id,
            ...invoice,
            payments: invoice.payments || [],
            paidAmount: invoice.paidAmount || 0,
            balanceAmount: invoice.balanceAmount || invoice.totalAmount,
          }))
          setInvoices(invoicesList)
          applyFilters(invoicesList, statusFilter, startDate, endDate)

          const totalInvoicedAmount = invoicesList.reduce((sum: number, inv: Invoice) => sum + inv.totalAmount, 0)
          const totalPaidAmount = invoicesList
            .filter((inv: Invoice) => inv.status === "paid" || inv.status === "partially_paid")
            .reduce((sum: number, inv: Invoice) => sum + inv.paidAmount, 0)
          const totalOverdueAmount = invoicesList
            .filter((inv: Invoice) => inv.status === "overdue")
            .reduce((sum: number, inv: Invoice) => sum + inv.balanceAmount, 0)
          const pendingCount = invoicesList.filter(
            (inv: Invoice) => inv.status === "sent" || inv.status === "partially_paid",
          ).length

          setTotalInvoiced(totalInvoicedAmount)
          setTotalPaid(totalPaidAmount)
          setTotalOverdue(totalOverdueAmount)
          setPendingInvoices(pendingCount)
        } else {
          setInvoices([])
          setFilteredInvoices([])
          setTotalInvoiced(0)
          setTotalPaid(0)
          setTotalOverdue(0)
          setPendingInvoices(0)
        }
        setIsLoading(false)
      } catch (err) {
        console.error("Error fetching invoices:", err)
        setNotification({ message: "Failed to load invoices", type: "error" })
        setIsLoading(false)
      }
    })

    const unsubscribeAuditLogs = onValue(auditLogsRef, (snapshot) => {
      if (snapshot.exists()) {
        const logsData = snapshot.val()
        const logsList = Object.entries(logsData).map(([id, log]: [string, any]) => ({ id, ...log }))
        setAuditLogs(logsList)
      } else {
        setAuditLogs([])
      }
    })

    const unsubscribeStocks = onValue(stocksRef, (snapshot) => {
      if (snapshot.exists()) {
        const stocksData = snapshot.val()
        const stocksList = Object.values(stocksData).map((stock: any) => ({
          productName: stock.productName,
          uom: stock.uom,
          quantity: stock.quantity,
        }))
        setStocks(stocksList)
      } else {
        setStocks([])
      }
    })

    const unsubscribeClients = onValue(clientsRef, (snapshot) => {
      if (snapshot.exists()) {
        const clientsData = snapshot.val()
        const clientsList = Object.entries(clientsData).map(([id, client]: [string, any]) => ({
          clientId: id,
          ...client,
        }))
        setClients(clientsList)
      } else {
        setClients([])
      }
    })

    const unsubscribeRecurringInvoices = onValue(recurringInvoicesRef, (snapshot) => {
      if (snapshot.exists()) {
        const recurringData = snapshot.val()
        const recurringList = Object.entries(recurringData).map(([id, recurring]: [string, any]) => ({
          recurringId: id,
          ...recurring,
        }))
        setRecurringInvoices(recurringList)
      } else {
        setRecurringInvoices([])
      }
    })

    return () => {
      unsubscribeInvoices()
      unsubscribeAuditLogs()
      unsubscribeStocks()
      unsubscribeClients()
      unsubscribeRecurringInvoices()
    }
  }, [])

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const applyFilters = (invoicesList: Invoice[], status: string, start: Date | null, end: Date | null) => {
    let filtered = [...invoicesList]
    if (status !== "All") {
      filtered = filtered.filter((invoice) => invoice.status === status.toLowerCase())
    }
    if (start && end) {
      const startDateObj = new Date(start)
      const endDateObj = new Date(end)
      filtered = filtered.filter((invoice) => {
        const invoiceDate = new Date(invoice.invoiceDate)
        return invoiceDate >= startDateObj && invoiceDate <= endDateObj
      })
    }
    setFilteredInvoices(filtered)
  }

  useEffect(() => {
    applyFilters(invoices, statusFilter, startDate, endDate)
  }, [statusFilter, startDate, endDate, invoices])

  const validateGSTIN = (gstin: string) => {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    return gstin ? gstinRegex.test(gstin) : true
  }

  const validateTaxZone = (taxZone: string, cgstRate: number, sgstRate: number, igstRate: number) => {
    const zone = TAX_ZONES.find((z) => z.name === taxZone)
    if (!zone) return false
    return cgstRate === zone.cgst && sgstRate === zone.sgst && igstRate === zone.igst
  }

  const updateStock = async (items: InvoiceItem[], isDelete = false, enableStockManagement = false) => {
    if (!enableStockManagement) return []

    try {
      const currentStocks = [...stocks]
      const stockChanges: AuditLog["stockChanges"] = []
      for (const item of items) {
        const stockIndex = currentStocks.findIndex((s) => s.productName === item.productName)
        if (stockIndex >= 0) {
          const oldQuantity = currentStocks[stockIndex].quantity
          const quantityChange = isDelete ? item.quantity : -item.quantity
          const newQuantity = oldQuantity + quantityChange
          currentStocks[stockIndex].quantity = newQuantity
          stockChanges.push({
            productName: item.productName,
            quantityChange,
            newQuantity,
          })
          await set(ref(database, `stocks/${item.productName}`), currentStocks[stockIndex])
        } else if (!isDelete) {
          const newQuantity = -item.quantity
          await set(ref(database, `stocks/${item.productName}`), {
            productName: item.productName,
            uom: item.uom,
            quantity: newQuantity,
          })
          stockChanges.push({
            productName: item.productName,
            quantityChange: -item.quantity,
            newQuantity,
          })
        }
      }
      setStocks(currentStocks)
      return stockChanges
    } catch (err) {
      console.error("Error updating stock:", err)
      setNotification({
        message: `Stock update warning: ${(err as Error).message}`,
        type: "warning",
      })
      return []
    }
  }

  const logAuditAction = async (invoice: Invoice, action: string, details?: string, changes?: any, stockChanges?: AuditLog["stockChanges"]) => {
    try {
      const auditLogsRef = ref(database, "auditLogs")
      const newLogRef = push(auditLogsRef)
      const complianceStatus = validateGSTIN(invoice.clientGSTIN || "") && validateTaxZone(invoice.taxZone, invoice.cgstRate, invoice.sgstRate, invoice.igstRate)
        ? "Compliant"
        : "Non-Compliant"
      const log: AuditLog = {
        id: newLogRef.key!,
        invoiceId: invoice.invoiceId,
        action,
        user: "admin@example.com",
        timestamp: Date.now(),
        details: details || `Client: ${invoice.clientName}, Project: ${invoice.projectName}, Amount: ${invoice.currency}${invoice.totalAmount.toFixed(2)}`,
        taxDetails: {
          cgstRate: invoice.cgstRate,
          sgstRate: invoice.sgstRate,
          igstRate: invoice.igstRate,
          cgstAmount: invoice.cgstAmount,
          sgstAmount: invoice.sgstAmount,
          igstAmount: invoice.igstAmount,
          taxZone: invoice.taxZone,
          complianceStatus,
        },
        stockChanges: stockChanges || [],
        snapshot: {
          clientName: invoice.clientName,
          projectName: invoice.projectName,
          totalAmount: invoice.totalAmount,
          taxZone: invoice.taxZone,
          cgstRate: invoice.cgstRate,
          sgstRate: invoice.sgstRate,
          igstRate: invoice.igstRate,
          signature: invoice.signature,
          items: invoice.items,
          status: invoice.status,
        },
      }
      await set(newLogRef, log)
    } catch (err) {
      console.error("Error logging audit action:", err)
    }
  }

  const handleCreateInvoice = () => {
    setEditingInvoice(null)
    setIsFormOpen(true)
  }

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setIsFormOpen(true)
  }

  const handleCancelForm = () => {
    setIsFormOpen(false)
    setEditingInvoice(null)
  }

  const handleViewDetails = (invoice: Invoice) => {
    setViewingInvoice(invoice)
    logAuditAction(invoice, "View Details")
  }

  const handleCloseDetails = () => {
    setViewingInvoice(null)
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      const invoice = invoices.find((inv) => inv.invoiceId === invoiceId)
      if (invoice) {
        const stockChanges = invoice.enableStockManagement ? await updateStock(invoice.items, true, invoice.enableStockManagement) : []
        const invoiceRef = ref(database, `invoices/${invoiceId}`)
        await remove(invoiceRef)
        setNotification({ message: "Invoice deleted successfully", type: "success" })
        logAuditAction(invoice, "Delete", undefined, undefined, stockChanges)
      }
    } catch (err) {
      console.error("Error deleting invoice:", err)
      setNotification({ message: `Failed to delete invoice: ${(err as Error).message}`, type: "error" })
    }
  }

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      const invoice = invoices.find((inv) => inv.invoiceId === invoiceId)
      if (invoice?.clientEmail) {
        const invoiceRef = ref(database, `invoices/${invoiceId}`)
        await set(invoiceRef, { ...invoice, status: "sent", lastModifiedBy: "admin@example.com" })
        setNotification({ message: "Invoice sent successfully", type: "success" })
        logAuditAction(invoice, "Send")
      } else {
        setNotification({ message: "Client email not provided", type: "error" })
      }
    } catch (err) {
      console.error("Error sending invoice:", err)
      setNotification({ message: "Failed to send invoice", type: "error" })
    }
  }

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      const invoice = invoices.find((inv) => inv.invoiceId === invoiceId)
      if (invoice) {
        const invoiceRef = ref(database, `invoices/${invoiceId}`)
        await set(invoiceRef, {
          ...invoice,
          status: "paid",
          paidAmount: invoice.totalAmount,
          balanceAmount: 0,
          lastModifiedBy: "admin@example.com",
        })
        setNotification({ message: "Invoice marked as paid", type: "success" })
        logAuditAction(invoice, "Mark as Paid")
      }
    } catch (err) {
      console.error("Error marking invoice as paid:", err)
      setNotification({ message: "Failed to mark invoice as paid", type: "error" })
    }
  }

  const handleCancelInvoice = async (invoiceId: string) => {
    try {
      const invoice = invoices.find((inv) => inv.invoiceId === invoiceId)
      if (invoice) {
        const stockChanges = invoice.enableStockManagement ? await updateStock(invoice.items, true, invoice.enableStockManagement) : []
        const invoiceRef = ref(database, `invoices/${invoiceId}`)
        await set(invoiceRef, { ...invoice, status: "cancelled", lastModifiedBy: "admin@example.com" })
        setNotification({ message: "Invoice cancelled successfully", type: "success" })
        logAuditAction(invoice, "Cancel", undefined, undefined, stockChanges)
      }
    } catch (err) {
      console.error("Error cancelling invoice:", err)
      setNotification({ message: `Failed to cancel invoice: ${(err as Error).message}`, type: "error" })
    }
  }

  const handleDuplicateInvoice = async (invoice: Invoice) => {
    try {
      const stockChanges = invoice.enableStockManagement ? await updateStock(invoice.items, false, invoice.enableStockManagement) : []
      const invoicesRef = ref(database, "invoices")
      const newInvoiceRef = push(invoicesRef)
      const duplicatedInvoice = {
        ...invoice,
        invoiceId: newInvoiceRef.key,
        status: "draft",
        timestamp: Date.now(),
        lastModifiedBy: "admin@example.com",
        payments: [],
        paidAmount: 0,
        balanceAmount: invoice.totalAmount,
      }
      await set(newInvoiceRef, duplicatedInvoice)
      setNotification({ message: "Invoice duplicated successfully", type: "success" })
      logAuditAction(duplicatedInvoice, "Duplicate", `Original Invoice: ${invoice.invoiceId}`, undefined, stockChanges)
    } catch (err) {
      console.error("Error duplicating invoice:", err)
      setNotification({ message: `Failed to duplicate invoice: ${(err as Error).message}`, type: "error" })
    }
  }

  const calculateNextDue = (currentDate: string, interval: string) => {
    const date = new Date(currentDate)
    if (interval === "Weekly") date.setDate(date.getDate() + 7)
    else if (interval === "Monthly") date.setMonth(date.getMonth() + 1)
    else if (interval === "Quarterly") date.setMonth(date.getMonth() + 3)
    return date.toISOString().split("T")[0]
  }

  const handleSaveInvoice = async (invoice: Invoice) => {
    try {
      let stockChanges: AuditLog["stockChanges"] = []
      if (invoice.invoiceId) {
        const oldInvoice = invoices.find((inv) => inv.invoiceId === invoice.invoiceId)
        if (oldInvoice && oldInvoice.enableStockManagement) {
          stockChanges = stockChanges.concat(await updateStock(oldInvoice.items, true, oldInvoice.enableStockManagement))
        }
        if (invoice.enableStockManagement) {
          stockChanges = stockChanges.concat(await updateStock(invoice.items, false, invoice.enableStockManagement))
        }
        const invoiceRef = ref(database, `invoices/${invoice.invoiceId}`)
        await set(invoiceRef, {
          ...invoice,
          timestamp: invoice.timestamp || Date.now(),
          lastModifiedBy: "admin@example.com",
        })
        setNotification({ message: "Invoice updated successfully", type: "success" })
        logAuditAction(invoice, "Update", undefined, undefined, stockChanges)
      } else {
        stockChanges = invoice.enableStockManagement ? await updateStock(invoice.items, false, invoice.enableStockManagement) : []
        const invoicesRef = ref(database, "invoices")
        const newInvoiceRef = push(invoicesRef)
        const newInvoice = {
          ...invoice,
          invoiceId: newInvoiceRef.key,
          status: "draft",
          timestamp: Date.now(),
          lastModifiedBy: "admin@example.com",
        }
        await set(newInvoiceRef, newInvoice)
        setNotification({ message: "Invoice created successfully", type: "success" })
        logAuditAction(newInvoice, "Create", undefined, undefined, stockChanges)
        setIsFormOpen(false)
        setEditingInvoice(null)
        if (invoice.isRecurring && invoice.recurrenceInterval) {
          const recurringRef = push(ref(database, "recurringInvoices"))
          await set(recurringRef, {
            recurringId: recurringRef.key,
            invoiceTemplate: { ...invoice, invoiceId: null },
            interval: invoice.recurrenceInterval,
            startDate: invoice.invoiceDate,
            endDate: invoice.recurrenceEndDate,
            nextDue: calculateNextDue(invoice.invoiceDate, invoice.recurrenceInterval),
          })
        }
      }
    } catch (err) {
      console.error("Error saving invoice:", err)
      setNotification({ message: `Failed to save invoice: ${(err as Error).message}`, type: "error" })
    }
  }

  const handleRecordPayment = (invoice: Invoice) => {
    setRecordingPayment(invoice)
  }

  const handleSavePayment = async (payment: Payment) => {
    if (!recordingPayment) return
    try {
      const updatedPayments = [...recordingPayment.payments, payment]
      const newPaidAmount = recordingPayment.paidAmount + payment.amount
      const newBalanceAmount = recordingPayment.totalAmount - newPaidAmount
      const newStatus = newBalanceAmount === 0 ? "paid" : "partially_paid"
      const invoiceRef = ref(database, `invoices/${recordingPayment.invoiceId}`)
      const updatedInvoice = {
        ...recordingPayment,
        payments: updatedPayments,
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
        status: newStatus,
        lastModifiedBy: "admin@example.com",
      }
      await set(invoiceRef, updatedInvoice)
      setNotification({ message: "Payment recorded successfully", type: "success" })
      logAuditAction(updatedInvoice, "Record Payment", `Amount: ${payment.amount}`)
      setRecordingPayment(null)
    } catch (err) {
      console.error("Error recording payment:", err)
      setNotification({ message: `Failed to record payment: ${(err as Error).message}`, type: "error" })
    }
  }

  const handlePayInvoice = (invoice: Invoice) => {
    setNotification({ message: "Payment processing not implemented yet", type: "warning" })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 mt-12">
      <style jsx global>{`
        @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .animate-slide-up { animation: slide-up 0.4s ease-out; }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
      `}</style>

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-800 to-purple-800 p-10 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <h1 className="text-5xl font-extrabold text-white tracking-tight animate-fade-in">
              GST Invoice Management
            </h1>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleCreateInvoice}
                className="inline-flex items-center gap-2 rounded-lg text-sm font-medium h-12 px-6 py-2 bg-white text-indigo-800 hover:bg-gray-100 shadow-lg transition-all"
              >
                <Plus className="h-5 w-5" /> Create Invoice
              </button>
              <button
                onClick={() => setShowAuditLogs(!showAuditLogs)}
                className="inline-flex items-center gap-2 rounded-lg text-sm font-medium h-12 px-6 py-2 bg-white text-indigo-800 hover:bg-gray-100 shadow-lg transition-all"
              >
                <History className="h-5 w-5" /> {showAuditLogs ? "Hide Audit Logs" : "Show Audit Logs"}
              </button>
              <button
                onClick={() => setShowClientPortal(!showClientPortal)}
                className="inline-flex items-center gap-2 rounded-lg text-sm font-medium h-12 px-6 py-2 bg-white text-indigo-800 hover:bg-gray-100 shadow-lg transition-all"
              >
                <FileText className="h-5 w-5" /> {showClientPortal ? "Hide Client Portal" : "Show Client Portal"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center transform hover:scale-105 transition-transform animate-slide-up">
            <h3 className="text-lg font-semibold text-gray-800">Total Invoiced</h3>
            <p className="text-3xl font-bold text-indigo-600 mt-2">₹{totalInvoiced.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center transform hover:scale-105 transition-transform animate-slide-up">
            <h3 className="text-lg font-semibold text-gray-800">Total Paid</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">₹{totalPaid.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center transform hover:scale-105 transition-transform animate-slide-up">
            <h3 className="text-lg font-semibold text-gray-800">Total Overdue</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">₹{totalOverdue.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center transform hover:scale-105 transition-transform animate-slide-up">
            <h3 className="text-lg font-semibold text-gray-800">Pending Invoices</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{pendingInvoices}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        {notification && (
          <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
        )}

        {/* Filters Section */}
        <div className="mb-12 bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full h-12">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {["All", "Draft", "Sent", "Paid", "Overdue", "Cancelled", "Partially Paid"].map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <div className="w-full md:w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <div className="relative">
                    <DatePicker
                      selected={startDate}
                      onChange={(date) => setStartDate(date)}
                      className="w-full h-12 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-600 text-base px-12"
                      dateFormat="dd/MM/yyyy"
                      placeholderText="Select start date"
                    />
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <div className="relative">
                    <DatePicker
                      selected={endDate}
                      onChange={(date) => setEndDate(date)}
                      className="w-full h-12 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-600 text-base px-12"
                      dateFormat="dd/MM/yyyy"
                      placeholderText="Select end date"
                    />
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setStartDate(null)
                setEndDate(null)
                setStatusFilter("All")
                setNotification({ message: "Filters reset", type: "success" })
              }}
              className="inline-flex items-center gap-2 rounded-xl text-sm font-medium h-12 px-6 py-2 bg-gray-100 text-gray-800 hover:bg-gray-200 shadow-sm transition-all"
            >
              <RefreshCw className="h-5 w-5" /> Reset Filters
            </button>
          </div>
        </div>

        {/* Invoice Form Section */}
        {isFormOpen && (
          <InvoiceForm
            invoice={editingInvoice}
            onSave={handleSaveInvoice}
            onCancel={handleCancelForm}
            clients={clients}
            stocks={stocks}
          />
        )}

        {/* Payment Form Section */}
        {recordingPayment && (
          <PaymentForm
            invoice={recordingPayment}
            onSave={handleSavePayment}
            onCancel={() => setRecordingPayment(null)}
          />
        )}

        {/* Audit Logs Section */}
        {showAuditLogs && <AuditLogViewer logs={auditLogs} invoices={invoices} />}

        {/* Client Portal Section */}
        {showClientPortal && (
          <ClientPortal invoices={filteredInvoices} onViewDetails={handleViewDetails} onPay={handlePayInvoice} />
        )}

        {/* Invoices List */}
        {!showClientPortal && (
          <div className="space-y-6">
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice) => (
                <InvoiceCard
                  key={invoice.invoiceId}
                  invoice={invoice}
                  onViewDetails={handleViewDetails}
                  onEdit={handleEditInvoice}
                  onDelete={handleDeleteInvoice}
                  onSend={handleSendInvoice}
                  onMarkAsPaid={handleMarkAsPaid}
                  onDuplicate={handleDuplicateInvoice}
                  onCancelInvoice={handleCancelInvoice}
                  onRecordPayment={handleRecordPayment}
                />
              ))
            ) : (
              <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed bg-white shadow-sm animate-fade-in">
                <FileText className="h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-xl font-medium text-gray-800">No invoices found</h3>
                <p className="text-sm text-gray-500 text-center max-w-md">
                  Create a new invoice or adjust the filters to view your invoices.
                </p>
              </div>
            )}
          </div>
        )}

        {/* View Details Modal */}
        {viewingInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl p-10 max-h-[90vh] overflow-y-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Invoice #{viewingInvoice.invoiceId}</h2>
              <InvoicePreview invoice={viewingInvoice} template={viewingInvoice.template} />
              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleCloseDetails}
                  className="inline-flex items-center gap-2 rounded-xl text-lg font-medium h-12 px-6 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 shadow-sm transition-all"
                >
                  <ArrowLeft className="h-5 w-5" /> Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default InvoicesPage
