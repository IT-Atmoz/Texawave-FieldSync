import React, { useState } from "react";
import { ref, set } from "firebase/database";
import { database } from "@/lib/firebase";
import { Button } from "../salary/Button";

interface Material {
  id: string;
  name: string;
  quantity: number;
}

interface StockAuditModalProps {
  material: Material;
  onClose: () => void;
}

const StockAuditModal: React.FC<StockAuditModalProps> = ({ material, onClose }) => {
  const [actualQuantity, setActualQuantity] = useState<number>(material.quantity);
  const [auditedBy, setAuditedBy] = useState<string>("Admin"); // Replace with actual user

  const handleSubmit = async () => {
    try {
      const auditId = Date.now().toString();
      const auditRef = ref(database, `stock_audits/${auditId}`);
      await set(auditRef, {
        materialId: material.id,
        materialName: material.name,
        recordedQuantity: material.quantity,
        actualQuantity,
        auditedAt: Date.now(),
        auditedBy,
      });

      // Update material quantity
      const materialRef = ref(database, `materials/${material.id}`);
      await set(materialRef, {
        ...material,
        quantity: actualQuantity,
        updatedAt: Date.now(),
      });

      onClose();
    } catch (error) {
      console.error("Failed to submit stock audit:", error);
      alert("Failed to submit stock audit");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 text-center">
          Stock Audit for {material.name}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Recorded Quantity</label>
            <input
              type="number"
              value={material.quantity}
              disabled
              className="w-full h-10 rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Actual Quantity</label>
            <input
              type="number"
              value={actualQuantity}
              onChange={(e) => setActualQuantity(parseInt(e.target.value) || 0)}
              className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Audited By</label>
            <input
              type="text"
              value={auditedBy}
              onChange={(e) => setAuditedBy(e.target.value)}
              placeholder="Enter your name"
              className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onClose} variant="outline" size="sm">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="default" size="sm">
            Submit Audit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StockAuditModal;