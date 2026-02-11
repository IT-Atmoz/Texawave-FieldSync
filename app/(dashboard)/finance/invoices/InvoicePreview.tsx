import React from "react";

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
  notes: string;
}

interface InvoicePreviewProps {
  invoice: Invoice;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice }) => {
  const formatDate = (date: string) => {
    return date ? new Date(date).toLocaleDateString() : "N/A";
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">Invoice Preview</h3>
        <p className="text-sm text-gray-500">Construction Co. Ltd.</p>
      </div>
      <div className="mb-4">
        <p className="text-sm text-gray-600"><strong>Bill To:</strong> {invoice.clientName || "N/A"}</p>
        <p className="text-sm text-gray-600">{invoice.clientAddress || "N/A"}</p>
        <p className="text-sm text-gray-600"><strong>Project:</strong> {invoice.projectName || "N/A"}</p>
      </div>
      <div className="mb-4">
        <p className="text-sm text-gray-600"><strong>Invoice Date:</strong> {formatDate(invoice.invoiceDate)}</p>
        <p className="text-sm text-gray-600"><strong>Due Date:</strong> {formatDate(invoice.dueDate)}</p>
      </div>
      <div className="mb-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-sm text-gray-700 text-left">Description</th>
              <th className="border border-gray-300 p-2 text-sm text-gray-700 text-center">Qty</th>
              <th className="border border-gray-300 p-2 text-sm text-gray-700 text-right">Price</th>
              <th className="border border-gray-300 p-2 text-sm text-gray-700 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-2 text-sm text-gray-600">{item.description || "N/A"}</td>
                <td className="border border-gray-300 p-2 text-sm text-gray-600 text-center">{item.quantity}</td>
                <td className="border border-gray-300 p-2 text-sm text-gray-600 text-right">${item.unitPrice.toFixed(2)}</td>
                <td className="border border-gray-300 p-2 text-sm text-gray-600 text-right">${item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-1">
        <p className="text-sm text-gray-600"><strong>Subtotal:</strong> ${invoice.subtotal.toFixed(2)}</p>
        <p className="text-sm text-gray-600"><strong>CGST (${invoice.cgstRate}%):</strong> ${invoice.cgstAmount.toFixed(2)}</p>
        <p className="text-sm text-gray-600"><strong>SGST (${invoice.sgstRate}%):</strong> ${invoice.sgstAmount.toFixed(2)}</p>
        <p className="text-sm text-gray-600"><strong>IGST (${invoice.igstRate}%):</strong> ${invoice.igstAmount.toFixed(2)}</p>
        <p className="text-sm text-gray-600"><strong>Total Tax:</strong> ${invoice.totalTax.toFixed(2)}</p>
        <p className="text-sm font-bold text-gray-800"><strong>Total Amount:</strong> ${invoice.totalAmount.toFixed(2)}</p>
        <p className="text-sm text-gray-600"><strong>Notes:</strong> {invoice.notes || "N/A"}</p>
      </div>
    </div>
  );
};

export default InvoicePreview;