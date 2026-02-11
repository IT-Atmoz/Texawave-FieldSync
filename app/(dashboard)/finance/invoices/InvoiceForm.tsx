import React, { useState, useEffect } from "react";
import { Plus, Minus, ArrowLeft } from "lucide-react";
import InvoicePreview from "./InvoicePreview";
import Link from "next/link";

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
}

interface Invoice {
  invoiceId?: string;
  clientName: string;
  clientAddress: string;
  invoiceDate: string;
  dueDate: string;
  projectName: string;
  items: InvoiceItem[];
  subtotal: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  totalAmount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  notes: string;
}

interface InvoiceFormProps {
  invoice?: Invoice | null;
  onSave: (invoice: Invoice) => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, onSave }) => {
  const [formData, setFormData] = useState<Invoice>({
    clientName: "",
    clientAddress: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    projectName: "",
    items: [{ description: "", quantity: 1, unitPrice: 0, total: 0, cgst: 0, sgst: 0, igst: 0 }],
    subtotal: 0,
    cgstRate: 2.5,
    sgstRate: 2.5,
    igstRate: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 0,
    totalTax: 0,
    totalAmount: 0,
    status: "draft",
    notes: "",
  });

  useEffect(() => {
    if (invoice) {
      setFormData(invoice);
    } else {
      setFormData({
        clientName: "",
        clientAddress: "",
        invoiceDate: new Date().toISOString().split("T")[0],
        dueDate: "",
        projectName: "",
        items: [{ description: "", quantity: 1, unitPrice: 0, total: 0, cgst: 0, sgst: 0, igst: 0 }],
        subtotal: 0,
        cgstRate: 2.5,
        sgstRate: 2.5,
        igstRate: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalTax: 0,
        totalAmount: 0,
        status: "draft",
        notes: "",
      });
    }
  }, [invoice]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updatedData = {
        ...prev,
        [name]: name === "cgstRate" || name === "sgstRate" || name === "igstRate" ? parseFloat(value) || 0 : value,
      };
      return calculateTotals(updatedData);
    });
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setFormData((prev) => {
      const updatedItems = [...prev.items];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: field === "quantity" || field === "unitPrice" ? parseFloat(value as string) || 0 : value,
      };
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unitPrice;

      // Calculate taxes for the item
      const cgst = (updatedItems[index].total * prev.cgstRate) / 100;
      const sgst = (updatedItems[index].total * prev.sgstRate) / 100;
      const igst = (updatedItems[index].total * prev.igstRate) / 100;
      updatedItems[index].cgst = cgst;
      updatedItems[index].sgst = sgst;
      updatedItems[index].igst = igst;
      updatedItems[index].total += cgst + sgst + igst;

      const updatedData = { ...prev, items: updatedItems };
      return calculateTotals(updatedData);
    });
  };

  const addItem = () => {
    setFormData((prev) => {
      const updatedItems = [...prev.items, { description: "", quantity: 1, unitPrice: 0, total: 0, cgst: 0, sgst: 0, igst: 0 }];
      const updatedData = { ...prev, items: updatedItems };
      return calculateTotals(updatedData);
    });
  };

  const removeItem = (index: number) => {
    setFormData((prev) => {
      const updatedItems = prev.items.filter((_, i) => i !== index);
      const updatedData = { ...prev, items: updatedItems };
      return calculateTotals(updatedData);
    });
  };

  const calculateTotals = (data: Invoice): Invoice => {
    const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const cgstAmount = subtotal * (data.cgstRate / 100);
    const sgstAmount = subtotal * (data.sgstRate / 100);
    const igstAmount = subtotal * (data.igstRate / 100);
    const totalTax = cgstAmount + sgstAmount + igstAmount;
    const totalAmount = subtotal + totalTax;

    return { ...data, subtotal, cgstAmount, sgstAmount, igstAmount, totalTax, totalAmount };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.clientName ||
      !formData.clientAddress ||
      !formData.invoiceDate ||
      !formData.dueDate ||
      !formData.projectName ||
      formData.items.length === 0 ||
      formData.items.some(item => !item.description || item.quantity <= 0 || item.unitPrice <= 0)
    ) {
      alert("Please fill all required fields and ensure item quantities and prices are greater than 0");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 sm:py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-6">
          <Link href="/(dashboard)/invoices">
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors h-10 px-4 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 shadow-sm mr-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Invoices
            </button>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800">
            {invoice ? "Edit Invoice" : "Create New Invoice"}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Client Details */}
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Client Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Client Name</label>
                    <input
                      type="text"
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Project Name</label>
                    <input
                      type="text"
                      name="projectName"
                      value={formData.projectName}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Client Address</label>
                  <textarea
                    name="clientAddress"
                    value={formData.clientAddress}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    rows={3}
                    required
                  />
                </div>
              </div>

              {/* Invoice Details */}
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Invoice Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Invoice Date</label>
                    <input
                      type="date"
                      name="invoiceDate"
                      value={formData.invoiceDate}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Due Date</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Items</h2>
                {formData.items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 mb-2 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600">Description</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, "description", e.target.value)}
                          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600">Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          min="1"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600">Unit Price ($)</label>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600">Total ($)</label>
                        <input
                          type="text"
                          value={item.total.toFixed(2)}
                          disabled
                          className="mt-1 block w-full rounded-lg border-gray-300 bg-gray-100 text-gray-600 sm:text-sm"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
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
                  className="mt-2 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors h-9 px-3 py-2 bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </button>
              </div>

              {/* Tax Section */}
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Tax Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CGST Rate (%)</label>
                    <input
                      type="number"
                      name="cgstRate"
                      value={formData.cgstRate}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      min="0"
                      step="0.1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">SGST Rate (%)</label>
                    <input
                      type="number"
                      name="sgstRate"
                      value={formData.sgstRate}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      min="0"
                      step="0.1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">IGST Rate (%)</label>
                    <input
                      type="number"
                      name="igstRate"
                      value={formData.igstRate}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      min="0"
                      step="0.1"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Summary Section */}
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Summary</h2>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600"><strong>Subtotal:</strong> ${formData.subtotal.toFixed(2)}</p>
                  <p className="text-sm text-gray-600"><strong>CGST (${formData.cgstRate}%):</strong> ${formData.cgstAmount.toFixed(2)}</p>
                  <p className="text-sm text-gray-600"><strong>SGST (${formData.sgstRate}%):</strong> ${formData.sgstAmount.toFixed(2)}</p>
                  <p className="text-sm text-gray-600"><strong>IGST (${formData.igstRate}%):</strong> ${formData.igstAmount.toFixed(2)}</p>
                  <p className="text-sm text-gray-600"><strong>Total Tax:</strong> ${formData.totalTax.toFixed(2)}</p>
                  <p className="text-sm font-bold text-gray-800"><strong>Total Amount:</strong> ${formData.totalAmount.toFixed(2)}</p>
                </div>
              </div>

              {/* Notes Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <Link href="/(dashboard)/invoices">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors h-10 px-4 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 shadow-sm"
                  >
                    Cancel
                  </button>
                </Link>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors h-10 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-lg"
                >
                  {invoice ? "Update Invoice" : "Create Invoice"}
                </button>
              </div>
            </form>
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-white rounded-xl shadow-lg p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Invoice Preview</h2>
              <InvoicePreview invoice={formData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceForm;