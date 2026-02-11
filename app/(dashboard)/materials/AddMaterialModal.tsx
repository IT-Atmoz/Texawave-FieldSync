import React, { useState } from "react";
import { ref, set } from "firebase/database";
import { database } from "@/lib/firebase";
import { Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { Button } from "../salary/Button";
import { cn } from "@/lib/utils";

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

interface AddMaterialModalProps {
  material: Material | null;
  onClose: () => void;
}

const AddMaterialModal: React.FC<AddMaterialModalProps> = ({ material, onClose }) => {
  const [formData, setFormData] = useState({
    name: material?.name || "",
    imageUrl: material?.imageUrl || "",
    price: material?.price || 0,
    quantity: material?.quantity || 0,
    category: material?.category || "",
    supplier: material?.supplier || "",
    description: material?.description || "",
    size: material?.size || "",
    weight: material?.weight || 0,
    unitType: material?.unitType || "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

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
      alert("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.imageUrl || !formData.category) {
      alert("Please fill in all required fields (Name, Image, Category)");
      return;
    }

    if (formData.price <= 0) {
      alert("Price must be greater than 0");
      return;
    }

    if (formData.quantity < 0) {
      alert("Quantity cannot be negative");
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
      onClose();
    } catch (error) {
      console.error("Failed to save material:", error);
      alert("Failed to save material");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-3xl transform transition-all duration-300 scale-100 hover:scale-[1.02] mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center tracking-tight">
          {material ? "Edit Material" : "Add New Material"}
        </h2>
        <div className="space-y-6">
          {/* Name and Image Row */}
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

          {/* Price and Quantity Row */}
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

          {/* Category and Supplier Row */}
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

          {/* Size and Weight Row */}
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

          {/* Unit Type */}
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

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Enter description"
              className="w-full h-24 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Buttons */}
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

export default AddMaterialModal;
