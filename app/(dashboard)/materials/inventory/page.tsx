"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { ref, onValue, remove, set, push } from "firebase/database";
import { database } from "@/lib/firebase";
import { AlertCircle, CheckCircle, Search, Plus, History, Clipboard, Edit, Trash2, AlertTriangle, Image as ImageIcon, FileText, Download, File, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface Material {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  quantity: number;
  category: string;
  supplier: string;
  description: string;
  size: string;
  weight: number;
  unitType: string;
  createdAt: number;
  updatedAt: number;
}

interface AuditLog {
  id: string;
  materialId: string;
  materialName: string;
  actionType: "Added" | "Edited" | "Deleted" | "Audited";
  quantityChange: number;
  recordedQuantity: number;
  actualQuantity: number;
  discrepancy: number;
  auditedAt: number;
  changedBy: string;
  notes: string;
  status: "Passed" | "Failed" | "Needs Review";
  location: string;
  projectId: string;
  attachmentUrl?: string;
}

interface ProjectLog {
  id: string;
  projectId: string;
  materialId: string;
  materialName: string;
  quantityUsed: number;
  usedAt: number;
}

// Button Variants
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md",
        destructive: "bg-red-600 text-white hover:bg-red-700 shadow-md",
        outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm",
        secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200 shadow-sm",
        ghost: "hover:bg-gray-100 hover:text-gray-900",
        link: "text-blue-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? "span" : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

// Toast Component
const Toast: React.FC<{ message: string; type: "success" | "error"; onClose: () => void }> = ({ message, type, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className={cn(
        "fixed top-4 right-4 p-4 rounded-lg shadow-lg flex items-center gap-2 z-50 text-lg font-semibold",
        type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
      )}
    >
      {type === "success" ? <CheckCircle className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-white hover:text-gray-200">
        ✕
      </button>
    </motion.div>
  );
};

// MaterialCard Component
interface MaterialCardProps {
  material: Material;
  onEdit: () => void;
  onDelete: () => void;
  onAudit: () => void;
  onViewHistory: () => void;
}

const MaterialCard: React.FC<MaterialCardProps> = ({ material, onEdit, onDelete, onAudit, onViewHistory }) => {
  const isLowStock = material.quantity < 10;

  return (
    <div className={cn(
      "bg-white rounded-lg shadow-md p-4 transition-all hover:shadow-lg",
      isLowStock && "border-2 border-red-500"
    )}>
      <img
        src={material.imageUrl}
        alt={material.name}
        className="w-full h-40 object-cover rounded-md mb-4"
      />
      <h3 className="text-lg font-semibold text-gray-900">{material.name}</h3>
      {isLowStock && (
        <div className="flex items-center gap-1 text-red-600 mb-2">
          <AlertTriangle className="h-4 w-4" />
          <p className="text-sm font-medium">Low Stock!</p>
        </div>
      )}
      <p className="text-sm text-gray-600">Category: {material.category}</p>
      <p className="text-sm text-gray-600">Price: ₹{material.price.toLocaleString()}</p>
      <p className="text-sm text-gray-600">Quantity: {material.quantity}</p>
      <p className="text-sm text-gray-600">Size: {material.size || "N/A"}</p>
      <p className="text-sm text-gray-600">Weight: {material.weight} {material.unitType || "N/A"}</p>
      <p className="text-sm text-gray-600">Supplier: {material.supplier}</p>
      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{material.description}</p>
      <div className="flex flex-wrap gap-2 mt-4">
        <Button onClick={onEdit} variant="outline" size="sm">
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button onClick={onDelete} variant="destructive" size="sm">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
        <Button onClick={onAudit} variant="outline" size="sm">
          <Clipboard className="mr-2 h-4 w-4" />
          Audit
        </Button>
        <Button onClick={onViewHistory} variant="outline" size="sm">
          <History className="mr-2 h-4 w-4" />
          History
        </Button>
      </div>
    </div>
  );
};

// AddMaterialModal Component
interface AddMaterialModalProps {
  material: Material | null;
  onClose: () => void;
  onNotification: (message: string, type: "success" | "error") => void;
}

const AddMaterialModal: React.FC<AddMaterialModalProps> = ({ material, onClose, onNotification }) => {
  const [formData, setFormData] = useState({
    name: material?.name || "",
    imageUrl: material?.imageUrl || "",
    price: material?.price ,
    quantity: material?.quantity,
    category: material?.category || "",
    supplier: material?.supplier || "",
    description: material?.description || "",
    size: material?.size || "",
    weight: material?.weight || 0,
    unitType: material?.unitType || "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [signature, setSignature] = useState<string>("");

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "unsigned_preset");
    formData.append("cloud_name", "dpgf1rkjl");

    try {
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dpgf1rkjl/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();
      if (data.secure_url) {
        setFormData((prev) => ({ ...prev, imageUrl: data.secure_url }));
      } else {
        throw new Error("Failed to upload image to Cloudinary");
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
      onNotification("Failed to upload image", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.imageUrl || !formData.category) {
      onNotification("Please fill in all required fields (Name, Image, Category)", "error");
      return;
    }

    if (formData.price <= 0) {
      onNotification("Price must be greater than 0", "error");
      return;
    }

    if (formData.quantity < 0) {
      onNotification("Quantity cannot be negative", "error");
      return;
    }

    if (formData.quantity > 100 && !signature) {
      onNotification("Signature required for quantities over 100", "error");
      return;
    }

    try {
      const materialId = material?.id || Date.now().toString();
      const materialRef = ref(database, `materials/${materialId}`);
      const updatedMaterial = {
        ...formData,
        id: materialId,
        createdAt: material?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
      await set(materialRef, updatedMaterial);

      const auditLog: AuditLog = {
        id: Date.now().toString(),
        materialId,
        materialName: formData.name,
        actionType: material ? "Edited" : "Added",
        quantityChange: formData.quantity - (material?.quantity || 0),
        recordedQuantity: material?.quantity || 0,
        actualQuantity: formData.quantity,
        discrepancy: 0,
        auditedAt: Date.now(),
        changedBy: "Admin",
        notes: signature ? `Signed by ${signature}` : "",
        status: "Passed",
        location: "",
        projectId: "",
      };
      await set(ref(database, `stock_audits/${auditLog.id}`), auditLog);

      onNotification(`Material ${material ? "updated" : "added"} successfully`, "success");
      onClose();
    } catch (error) {
      console.error("Failed to save material:", error);
      onNotification("Failed to save material", "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-3xl transform transition-all duration-300 scale-100 hover:scale-[1.02] mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center tracking-tight">
          {material ? "Edit Material" : "Add New Material"}
        </h2>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter material name"
                className="w-full h-10 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image *</label>
              <div className="flex items-center gap-3">
                {formData.imageUrl ? (
                  <img
                    src={formData.imageUrl}
                    alt="Material"
                    className="w-16 h-16 object-cover rounded-md border border-gray-200"
                  />
                ) : (
                  <div className="w-16 h-16 flex items-center justify-center border border-gray-300 rounded-md bg-gray-50">
                    <ImageIcon className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      handleImageUpload(file);
                    }
                  }}
                  disabled={isUploading}
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>
              {isUploading && <p className="text-xs text-gray-500 mt-2">Uploading image...</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => handleChange("price", parseFloat(e.target.value) || 0)}
                placeholder="Enter price"
                className="w-full h-10 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleChange("quantity", parseInt(e.target.value) || 0)}
                placeholder="Enter quantity"
                className="w-full h-10 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                placeholder="Enter category"
                className="w-full h-10 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => handleChange("supplier", e.target.value)}
                placeholder="Enter supplier"
                className="w-full h-10 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => handleChange("size", e.target.value)}
                placeholder="e.g., 10x10 cm"
                className="w-full h-10 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => handleChange("weight", parseFloat(e.target.value) || 0)}
                placeholder="Enter weight"
                className="w-full h-10 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Type</label>
            <select
              value={formData.unitType}
              onChange={(e) => handleChange("unitType", e.target.value)}
              className="w-full h-10 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              <option value="">Select unit type</option>
              <option value="kg">kg</option>
              <option value="gm">gm</option>
              <option value="liters">liters</option>
              <option value="pieces">pieces</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Enter description"
              className="w-full h-24 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors resize-none"
            />
          </div>
          {formData.quantity > 100 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Signature *</label>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Enter your name to sign"
                className="w-full h-10 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="default"
            size="sm"
            disabled={isUploading}
            className="bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

// StockAuditModal Component
interface StockAuditModalProps {
  material: Material;
  auditLogs: AuditLog[];
  projectLogs: ProjectLog[];
  onClose: () => void;
  onAuditComplete: (message: string, type: "success" | "error") => void;
}

const StockAuditModal: React.FC<StockAuditModalProps> = ({ material, auditLogs, projectLogs, onClose, onAuditComplete }) => {
  const [actualQuantity, setActualQuantity] = useState<number>(material.quantity);
  const [auditedBy, setAuditedBy] = useState<string>("Admin");
  const [notes, setNotes] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [status, setStatus] = useState<"Passed" | "Failed" | "Needs Review">("Passed");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [signature, setSignature] = useState<string>("");

  const recentActivities = auditLogs
    .filter((log) => log.materialId === material.id)
    .sort((a, b) => b.auditedAt - a.auditedAt)
    .slice(0, 5);

  const totalStockConsumed = auditLogs
    .filter((log) => log.materialId === material.id && log.quantityChange < 0)
    .reduce((sum, log) => sum + Math.abs(log.quantityChange), 0);

  const totalStockAdded = auditLogs
    .filter((log) => log.materialId === material.id && log.quantityChange > 0)
    .reduce((sum, log) => sum + log.quantityChange, 0);

  const lastModified = recentActivities[0] || null;

  const discrepancyDetected = projectLogs
    .filter((log) => log.materialId === material.id)
    .reduce((sum, log) => sum + log.quantityUsed, 0) !== totalStockConsumed;

  const dynamicAlert = discrepancyDetected
    ? `⚠️ ${totalStockConsumed} units of ${material.name} were removed but not fully recorded in project logs. Please verify.`
    : "";

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "unsigned_preset");
    formData.append("cloud_name", "dpgf1rkjl");

    try {
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dpgf1rkjl/upload",
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();
      if (data.secure_url) {
        setAttachmentUrl(data.secure_url);
      } else {
        throw new Error("Failed to upload file to Cloudinary");
      }
    } catch (error) {
      console.error("Failed to upload file:", error);
      onAuditComplete("Failed to upload file", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (Math.abs(actualQuantity - material.quantity) > 100 && !signature) {
      onAuditComplete("Signature required for quantity changes over 100", "error");
      return;
    }

    try {
      const discrepancy = actualQuantity - material.quantity;
      const auditId = Date.now().toString();
      const auditRef = ref(database, `stock_audits/${auditId}`);
      const auditLog: AuditLog = {
        id: auditId,
        materialId: material.id,
        materialName: material.name,
        actionType: "Audited",
        quantityChange: discrepancy,
        recordedQuantity: material.quantity,
        actualQuantity,
        discrepancy,
        auditedAt: Date.now(),
        changedBy: auditedBy,
        notes: signature ? `${notes} (Signed by ${signature})` : notes,
        status,
        location,
        projectId,
        attachmentUrl,
      };

      await set(auditRef, auditLog);

      const materialRef = ref(database, `materials/${material.id}`);
      await set(materialRef, {
        ...material,
        quantity: actualQuantity,
        updatedAt: Date.now(),
      });

      onAuditComplete(`Audit for ${material.name} completed successfully`, "success");
      onClose();
    } catch (error) {
      console.error("Failed to submit stock audit:", error);
      onAuditComplete("Failed to submit stock audit", "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 text-center">
          Stock Audit for {material.name}
        </h2>
        {dynamicAlert && (
          <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm">{dynamicAlert}</span>
          </div>
        )}
        <div className="space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-lg font-semibold">Audit Overview</h3>
            <p className="text-sm text-gray-600">Material: {material.name}</p>
            <p className="text-sm text-gray-600">
              Last Modified By: {lastModified ? `${lastModified.changedBy} (Admin)` : "N/A"}
            </p>
            <p className="text-sm text-gray-600">
              Last Modified At: {lastModified ? new Date(lastModified.auditedAt).toLocaleString("en-IN") : "N/A"}
            </p>
            <p className="text-sm text-gray-600">Total Stock Consumed: {totalStockConsumed}</p>
            <p className="text-sm text-gray-600">Total Stock Added: {totalStockAdded}</p>
            <p className="text-sm text-gray-600">Discrepancy Detected: {discrepancyDetected ? "Yes" : "No"}</p>
          </div>
          <div>
            <h4 className="text-md font-semibold mb-2">Recent Activities</h4>
            {recentActivities.length > 0 ? (
              <ul className="space-y-2">
                {recentActivities.map((activity) => (
                  <li key={activity.id} className="text-sm text-gray-600">
                    {new Date(activity.auditedAt).toLocaleString("en-IN")}: {activity.actionType} by {activity.changedBy} (
                    Qty Change: {activity.quantityChange})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No recent activities</p>
            )}
          </div>
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
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Warehouse A"
              className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Project ID</label>
            <input
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="e.g., PROJ-123"
              className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "Passed" | "Failed" | "Needs Review")}
              className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Passed">Passed</option>
              <option value="Failed">Failed</option>
              <option value="Needs Review">Needs Review</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Audit Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter audit observations..."
              className="w-full h-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attach File (Invoice/Image/Challan)</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setAttachmentFile(file);
                  handleFileUpload(file);
                }
              }}
              disabled={isUploading}
              className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {isUploading && <p className="text-xs text-gray-500 mt-2">Uploading file...</p>}
            {attachmentUrl && (
              <a href={attachmentUrl} target="_blank" className="text-sm text-indigo-600 hover:underline flex items-center gap-1 mt-2">
                <File className="h-4 w-4" /> View Attachment
              </a>
            )}
          </div>
          {Math.abs(actualQuantity - material.quantity) > 100 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Signature *</label>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Enter your name to sign"
                className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onClose} variant="outline" size="sm">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="default" size="sm" disabled={isUploading}>
            Submit Audit
          </Button>
        </div>
      </div>
    </div>
  );
};

// AuditTab Component
const AuditTab: React.FC<{ auditLogs: AuditLog[]; projectLogs: ProjectLog[]; materials: Material[] }> = ({ auditLogs, projectLogs, materials }) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterMaterial, setFilterMaterial] = useState<string>("All");
  const [filterPerson, setFilterPerson] = useState<string>("All");
  const [filterLocation, setFilterLocation] = useState<string>("All");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showGraph, setShowGraph] = useState<boolean>(false);
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");

  const uniqueMaterials = useMemo(() => ["All", ...new Set(materials.map((m) => m.name))], [materials]);
  const uniquePersons = useMemo(() => ["All", ...new Set(auditLogs.map((log) => log.changedBy))], [auditLogs]);
  const uniqueLocations = useMemo(() => ["All", ...new Set(auditLogs.map((log) => log.location).filter(Boolean))], [auditLogs]);

  const filteredAudits = useMemo(() => {
    return auditLogs.filter((audit) => {
      const matchesSearch = audit.materialName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "All" || audit.status === filterStatus;
      const matchesMaterial = filterMaterial === "All" || audit.materialName === filterMaterial;
      const matchesPerson = filterPerson === "All" || audit.changedBy === filterPerson;
      const matchesLocation = filterLocation === "All" || audit.location === filterLocation;
      const matchesDate =
        (!startDate || new Date(audit.auditedAt) >= new Date(startDate)) &&
        (!endDate || new Date(audit.auditedAt) <= new Date(endDate));
      return matchesSearch && matchesStatus && matchesMaterial && matchesPerson && matchesLocation && matchesDate;
    });
  }, [auditLogs, searchQuery, filterStatus, filterMaterial, filterPerson, filterLocation, startDate, endDate]);

  const suspiciousLogs = filteredAudits.filter((log) => Math.abs(log.quantityChange) > 100 || log.status === "Failed");

  const graphData = useMemo(() => {
    if (!selectedMaterial) return null;
    const materialLogs = auditLogs
      .filter((log) => log.materialName === selectedMaterial)
      .sort((a, b) => a.auditedAt - b.auditedAt);
    return {
      labels: materialLogs.map((log) => new Date(log.auditedAt).toLocaleDateString("en-IN")),
      datasets: [
        {
          label: "Quantity",
          data: materialLogs.map((log) => log.actualQuantity || log.recordedQuantity),
          borderColor: "rgb(75, 192, 192)",
          tension: 0.1,
        },
      ],
    };
  }, [auditLogs, selectedMaterial]);

  const exportToExcel = () => {
    const headers = ["Timestamp", "Action Type", "Material", "Qty Change", "Changed By", "Location", "Remarks", "Status", "Attachment"];
    const rows = filteredAudits.map((audit) => [
      new Date(audit.auditedAt).toLocaleString("en-IN"),
      audit.actionType,
      audit.materialName,
      audit.quantityChange,
      audit.changedBy,
      audit.location || "N/A",
      audit.notes || "None",
      audit.status,
      audit.attachmentUrl || "None",
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs");
    XLSX.write(workbook, "audit_report.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Audit Report", 14, 16);
    doc.autoTable({
      head: [["Timestamp", "Action Type", "Material", "Qty Change", "Changed By", "Location", "Remarks", "Status"]],
      body: filteredAudits.map((audit) => [
        new Date(audit.auditedAt).toLocaleString("en-IN"),
        audit.actionType,
        audit.materialName,
        audit.quantityChange,
        audit.changedBy,
        audit.location || "N/A",
        audit.notes || "None",
        audit.status,
      ]),
      startY: 20,
    });
    doc.save("audit_report.pdf");
  };

  const generateMonthlySummary = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyAudits = auditLogs.filter(
      (log) => log.auditedAt >= startOfMonth.getTime() && log.auditedAt <= endOfMonth.getTime()
    );

    const summary = {
      totalAudits: monthlyAudits.length,
      discrepancies: monthlyAudits.filter((log) => log.discrepancy !== 0).length,
      failedAudits: monthlyAudits.filter((log) => log.status === "Failed").length,
      materialsAudited: [...new Set(monthlyAudits.map((log) => log.materialName))].length,
      suspiciousLogs: monthlyAudits.filter((log) => Math.abs(log.quantityChange) > 100).length,
    };

    const doc = new jsPDF();
    doc.text(`Monthly Audit Summary - ${now.toLocaleString("en-IN", { month: "long", year: "numeric" })}`, 14, 16);
    doc.autoTable({
      head: [["Metric", "Value"]],
      body: [
        ["Total Audits", summary.totalAudits],
        ["Discrepancies Detected", summary.discrepancies],
        ["Failed Audits", summary.failedAudits],
        ["Materials Audited", summary.materialsAudited],
        ["Suspicious Logs", summary.suspiciousLogs],
      ],
      startY: 20,
    });
    doc.save(`monthly_audit_summary_${now.getMonth() + 1}_${now.getFullYear()}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search audits..."
            className="w-full h-10 rounded-lg border border-gray-300 bg-white px-10 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full sm:w-40 h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Statuses</option>
          <option value="Passed">Passed</option>
          <option value="Failed">Failed</option>
          <option value="Needs Review">Needs Review</option>
        </select>
        <select
          value={filterMaterial}
          onChange={(e) => setFilterMaterial(e.target.value)}
          className="w-full sm:w-40 h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {uniqueMaterials.map((material) => (
            <option key={material} value={material}>
              {material}
            </option>
          ))}
        </select>
        <select
          value={filterPerson}
          onChange={(e) => setFilterPerson(e.target.value)}
          className="w-full sm:w-40 h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {uniquePersons.map((person) => (
            <option key={person} value={person}>
              {person}
            </option>
          ))}
        </select>
        <select
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
          className="w-full sm:w-40 h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {uniqueLocations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full sm:w-40 h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full sm:w-40 h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button onClick={exportToExcel} variant="default" size="sm">
          <Download className="mr-2 h-4 w-4" /> Excel
        </Button>
        <Button onClick={exportToPDF} variant="default" size="sm">
          <Download className="mr-2 h-4 w-4" /> PDF
        </Button>
        <Button onClick={generateMonthlySummary} variant="default" size="sm">
          <FileText className="mr-2 h-4 w-4" /> Monthly Summary
        </Button>
        <Button onClick={() => setShowGraph(!showGraph)} variant="outline" size="sm">
          <BarChart2 className="mr-2 h-4 w-4" /> {showGraph ? "Hide Graph" : "Show Graph"}
        </Button>
      </div>
      {showGraph && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <select
            value={selectedMaterial}
            onChange={(e) => setSelectedMaterial(e.target.value)}
            className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm mb-4"
          >
            <option value="">Select Material</option>
            {uniqueMaterials.filter((m) => m !== "All").map((material) => (
              <option key={material} value={material}>
                {material}
              </option>
            ))}
          </select>
          {graphData && (
            <Line
              data={graphData}
              options={{
                responsive: true,
                plugins: { legend: { position: "top" }, title: { display: true, text: "Quantity Trend" } },
              }}
            />
          )}
        </div>
      )}
      {suspiciousLogs.length > 0 && (
        <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span className="text-sm">{suspiciousLogs.length} suspicious logs detected (e.g., bulk changes or failed audits)</span>
        </div>
      )}
      {filteredAudits.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-lg shadow-md">
            <thead>
              <tr className="bg-gray-100 text-left text-sm font-medium text-gray-600">
                <th className="p-3">Timestamp</th>
                <th className="p-3">Action Type</th>
                <th className="p-3">Material</th>
                <th className="p-3">Qty Change</th>
                <th className="p-3">Changed By</th>
                <th className="p-3">Location</th>
                <th className="p-3">Remarks</th>
                <th className="p-3">Status</th>
                <th className="p-3">Attachment</th>
                <th className="p-3">Trail</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredAudits.map((audit) => (
                  <motion.tr
                    key={audit.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      "border-t",
                      audit.status === "Failed" && "bg-red-50",
                      audit.status === "Needs Review" && "bg-yellow-50"
                    )}
                  >
                    <td className="p-3 text-sm">{new Date(audit.auditedAt).toLocaleString("en-IN")}</td>
                    <td className="p-3 text-sm">{audit.actionType}</td>
                    <td className="p-3 text-sm">
                      <button
                        className="text-indigo-600 hover:underline"
                        onClick={() => setSelectedMaterial(audit.materialName)}
                      >
                        {audit.materialName}
                      </button>
                    </td>
                    <td className="p-3 text-sm">{audit.quantityChange}</td>
                    <td className="p-3 text-sm">{audit.changedBy}</td>
                    <td className="p-3 text-sm">{audit.location || "N/A"}</td>
                    <td className="p-3 text-sm">{audit.notes || "None"}</td>
                    <td className="p-3 text-sm">
                      <span
                        className={cn(
                          "px-2 py-1 rounded text-xs",
                          audit.status === "Passed" && "bg-green-100 text-green-800",
                          audit.status === "Failed" && "bg-red-100 text-red-800",
                          audit.status === "Needs Review" && "bg-yellow-100 text-yellow-800"
                        )}
                      >
                        {audit.status}
                      </span>
                    </td>
                    <td className="p-3 text-sm">
                      {audit.attachmentUrl ? (
                        <a href={audit.attachmentUrl} target="_blank" className="text-indigo-600 hover:underline flex items-center gap-1">
                          <File className="h-4 w-4" /> View
                        </a>
                      ) : (
                        "None"
                      )}
                    </td>
                    <td className="p-3 text-sm">
                      <button
                        className="text-indigo-600 hover:underline"
                        onClick={() => alert(`Full audit trail for ${audit.materialName} (Feature coming soon)`)}
                      >
                        View Trail
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center text-sm text-gray-500">No audit logs found.</div>
      )}
    </div>
  );
};

// MaterialsInventory Component
const MaterialsInventory: React.FC<{ setNotification: (notification: { message: string; type: "error" | "success" } | null) => void }> = ({ setNotification }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [projectLogs, setProjectLogs] = useState<ProjectLog[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("All Categories");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [editMaterial, setEditMaterial] = useState<Material | null>(null);
  const [auditMaterial, setAuditMaterial] = useState<Material | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const materialsRef = ref(database, "materials");
    const auditsRef = ref(database, "stock_audits");
    const projectsRef = ref(database, "project_logs");

    const unsubscribeMaterials = onValue(
      materialsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const materialsData = snapshot.val();
          const materialsList = Object.keys(materialsData).map((id) => ({
            id,
            name: materialsData[id].name || "",
            imageUrl: materialsData[id].imageUrl || "",
            price: materialsData[id].price || 0,
            quantity: materialsData[id].quantity || 0,
            category: materialsData[id].category || "",
            supplier: materialsData[id].supplier || "",
            description: materialsData[id].description || "",
            size: materialsData[id].size || "",
            weight: materialsData[id].weight || 0,
            unitType: materialsData[id].unitType || "",
            createdAt: materialsData[id].createdAt || 0,
            updatedAt: materialsData[id].updatedAt || 0,
          }));
          setMaterials(materialsList);
          setFilterCategory("All Categories");
        } else {
          setMaterials([]);
          setFilterCategory("All Categories");
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Failed to fetch materials:", error);
        setIsLoading(false);
      }
    );

    const unsubscribeAudits = onValue(auditsRef, (snapshot) => {
      if (snapshot.exists()) {
        const auditsData = snapshot.val();
        const auditsList = Object.keys(auditsData).map((id) => ({
          id,
          ...auditsData[id],
        }));
        setAuditLogs(auditsList);
      } else {
        setAuditLogs([]);
      }
    });

    const unsubscribeProjects = onValue(projectsRef, (snapshot) => {
      if (snapshot.exists()) {
        const projectsData = snapshot.val();
        const projectsList = Object.keys(projectsData).map((id) => ({
          id,
          ...projectsData[id],
        }));
        setProjectLogs(projectsList);
      } else {
        setProjectLogs([]);
      }
    });

    return () => {
      unsubscribeMaterials();
      unsubscribeAudits();
      unsubscribeProjects();
    };
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>(materials.map((material) => material.category));
    return ["All Categories", ...Array.from(uniqueCategories).filter(category => category)];
  }, [materials]);

  const filteredMaterials = useMemo(() => {
    return materials.filter((material) => {
      const matchesSearch = material.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === "All Categories" || material.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [materials, searchQuery, filterCategory]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterCategory(e.target.value);
  };

  const handleDelete = async (id: string) => {
    try {
      const material = materials.find((m) => m.id === id);
      if (!material) throw new Error("Material not found");

      if (material.quantity > 100) {
        const signature = prompt("Enter your name to sign for deletion of over 100 units");
        if (!signature) {
          setNotification({ message: "Signature required for deletion", type: "error" });
          return;
        }
      }

      const materialRef = ref(database, `materials/${id}`);
      await remove(materialRef);

      const auditLog: AuditLog = {
        id: Date.now().toString(),
        materialId: id,
        materialName: material.name,
        actionType: "Deleted",
        quantityChange: -material.quantity,
        recordedQuantity: material.quantity,
        actualQuantity: 0,
        discrepancy: -material.quantity,
        auditedAt: Date.now(),
        changedBy: "Admin",
        notes: material.quantity > 100 ? `Signed by ${prompt("Enter signature")}` : "",
        status: "Passed",
        location: "",
        projectId: "",
      };
      await set(ref(database, `stock_audits/${auditLog.id}`), auditLog);

      setNotification({ message: "Material deleted successfully", type: "success" });
    } catch (error) {
      console.error("Failed to delete material:", error);
      setNotification({ message: "Failed to delete material", type: "error" });
    }
  };

  const handleAudit = (material: Material) => {
    setAuditMaterial(material);
    setShowAuditModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search materials..."
            className="w-full h-10 rounded-lg border border-gray-300 bg-white px-10 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative flex-1">
          <select
            value={filterCategory}
            onChange={handleCategoryChange}
            className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={() => { setEditMaterial(null); setShowAddModal(true); }} variant="default" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Material
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center text-sm text-gray-500">Loading materials...</div>
      ) : filteredMaterials.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredMaterials.map((material) => (
              <motion.div
                key={material.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <MaterialCard
                  material={material}
                  onEdit={() => { setEditMaterial(material); setShowAddModal(true); }}
                  onDelete={() => handleDelete(material.id)}
                  onAudit={() => handleAudit(material)}
                  onViewHistory={() => alert(`View history for ${material.name} (Feature coming soon)`)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center text-sm text-gray-500">No materials found.</div>
      )}

      {showAddModal && (
        <AddMaterialModal
          material={editMaterial}
          onClose={() => setShowAddModal(false)}
          onNotification={(message, type) => setNotification({ message, type })}
        />
      )}

      {showAuditModal && auditMaterial && (
        <StockAuditModal
          material={auditMaterial}
          auditLogs={auditLogs}
          projectLogs={projectLogs}
          onClose={() => setShowAuditModal(false)}
          onAuditComplete={(message, type) => setNotification({ message, type })}
        />
      )}
    </div>
  );
};

// InventoryPage Component
const InventoryPage = () => {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [notification, setNotification] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [activeTab, setActiveTab] = useState<"inventory" | "audit">("inventory");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [projectLogs, setProjectLogs] = useState<ProjectLog[]>([]);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour12: false,
      };
      const formattedTime = now.toLocaleString("en-IN", options);
      setCurrentTime(formattedTime);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const materialsRef = ref(database, "materials");
    const auditsRef = ref(database, "stock_audits");
    const projectsRef = ref(database, "project_logs");

    const unsubscribeMaterials = onValue(materialsRef, (snapshot) => {
      if (snapshot.exists()) {
        const materialsData = snapshot.val();
        const materialsList = Object.keys(materialsData).map((id) => ({
          id,
          ...materialsData[id],
        }));
        setMaterials(materialsList);
      } else {
        setMaterials([]);
      }
    });

    const unsubscribeAudits = onValue(auditsRef, (snapshot) => {
      if (snapshot.exists()) {
        const auditsData = snapshot.val();
        const auditsList = Object.keys(auditsData).map((id) => ({
          id,
          ...auditsData[id],
        }));
        setAuditLogs(auditsList);
      } else {
        setAuditLogs([]);
      }
    });

    const unsubscribeProjects = onValue(projectsRef, (snapshot) => {
      if (snapshot.exists()) {
        const projectsData = snapshot.val();
        const projectsList = Object.keys(projectsData).map((id) => ({
          id,
          ...projectsData[id],
        }));
        setProjectLogs(projectsList);
      } else {
        setProjectLogs([]);
      }
    });

    return () => {
      unsubscribeMaterials();
      unsubscribeAudits();
      unsubscribeProjects();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 font-roboto">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Materials Inventory
          </h1>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm text-sm sm:text-base font-medium text-gray-800">
            {currentTime} IST
          </div>
        </div>

        <AnimatePresence>
          {notification && (
            <Toast
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification(null)}
            />
          )}
        </AnimatePresence>

        <div className="mb-6">
          <div className="flex space-x-4 border-b border-gray-200">
            <button
              className={cn(
                "px-4 py-2 text-sm font-medium",
                activeTab === "inventory" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-600 hover:text-indigo-600"
              )}
              onClick={() => setActiveTab("inventory")}
            >
              Inventory
            </button>
            <button
              className={cn(
                "px-4 py-2 text-sm font-medium",
                activeTab === "audit" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-600 hover:text-indigo-600"
              )}
              onClick={() => setActiveTab("audit")}
            >
              Audit Logs
            </button>
          </div>
        </div>

        {activeTab === "inventory" ? (
          <MaterialsInventory setNotification={setNotification} />
        ) : (
          <AuditTab auditLogs={auditLogs} projectLogs={projectLogs} materials={materials} />
        )}
      </div>
    </div>
  );
};

export default InventoryPage;
