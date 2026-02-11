import React, { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
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
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  notes: string;
}

interface InvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
  invoice?: Invoice | null;
}

const InvoiceFormModal: React.FC<InvoiceFormModalProps> = ({ isOpen, onClose, onSave, invoice }) => {
  const [formData, setFormData] = useState<Invoice>({
    clientName: "",
    clientAddress: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    projectName: "",
    items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
    subtotal: 0,
    taxRate: 5,
    taxAmount: 0,
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
        items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
        subtotal: 0,
        taxRate: 5,
        taxAmount: 0,
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
        [name]: name === "taxRate" ? parseFloat(value) || 0 : value,
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
      const updatedData = { ...prev, items: updatedItems };
      return calculateTotals(updatedData);
    });
  };

  const addItem = () => {
    setFormData((prev) => {
      const updatedItems = [...prev.items, { description: "", quantity: 1, unitPrice: 0, total: 0 }];
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
    const subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = subtotal * (data.taxRate / 100);
    const totalAmount = subtotal + taxAmount;
    return { ...data, subtotal, taxAmount, totalAmount };
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
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">
          {invoice ? "Edit Invoice" : "Create Invoice"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
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
            <label className="block text-sm font-medium text-gray-700">Client Address</label>
            <textarea
              name="clientAddress"
              value={formData.clientAddress}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              rows={2}
              required
            />
          </div>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Items</label>
            {formData.items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3 mb-2 space-y-2">
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
                <div className="flex space-x-2">
                  <div className="flex-1">
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
                  <div className="flex-1">
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
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600"><strong>Total:</strong> ${item.total.toFixed(2)}</p>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
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
          <div>
            <label className="block text-sm font-medium text-gray-700">Tax Rate (%)</label>
            <input
              type="number"
              name="taxRate"
              value={formData.taxRate}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              min="0"
              step="0.1"
              required
            />
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600"><strong>Subtotal:</strong> ${formData.subtotal.toFixed(2)}</p>
            <p className="text-sm text-gray-600"><strong>Tax Amount:</strong> ${formData.taxAmount.toFixed(2)}</p>
            <p className="text-sm font-bold text-gray-800"><strong>Total Amount:</strong> ${formData.totalAmount.toFixed(2)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              rows={2}
            />
          </div>
          <div className="flex justify-end space-x-2 sm:space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors h-9 px-3 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors h-9 px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-lg"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceFormModal;