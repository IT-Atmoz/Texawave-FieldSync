import React from "react";
import { Edit, Trash2, AlertTriangle, Clipboard, History } from "lucide-react";
import { Button } from "../salary/Button"; // Assuming this is your Button component path
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
}

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
    <div
      className={cn(
        "bg-white rounded-xl shadow-md p-4 transition-all duration-300 hover:shadow-xl hover:scale-105",
        isLowStock && "border-2 border-red-500"
      )}
    >
      <img
        src={material.imageUrl}
        alt={material.name}
        className="w-full h-auto object-contain rounded-lg mb-4"
      />
      <h3 className="text-xl font-bold text-gray-900 mb-2">{material.name}</h3>
      {isLowStock && (
        <div className="flex items-center gap-1 text-red-600 mb-3 animate-pulse">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-base font-medium">Low Stock!</p>
        </div>
      )}
      <div className="space-y-1 text-sm text-gray-700">
        <p><span className="font-semibold">Category:</span> {material.category}</p>
        <p><span className="font-semibold">Price:</span> ₹{material.price.toLocaleString()}</p>
        <p><span className="font-semibold">Quantity:</span> {material.quantity}</p>
        <p><span className="font-semibold">Size:</span> {material.size || "N/A"}</p>
        <p><span className="font-semibold">Weight:</span> {material.weight} {material.unitType || "N/A"}</p>
        <p><span className="font-semibold">Supplier:</span> {material.supplier}</p>
      </div>
      <p className="text-sm text-gray-600 mt-3 line-clamp-3 italic">{material.description}</p>
      <div className="flex flex-wrap gap-2 mt-4 md:flex-nowrap">
        <Button onClick={onEdit} variant="outline" size="sm" className="flex-1">
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button onClick={onDelete} variant="destructive" size="sm" className="flex-1">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
        <Button onClick={onAudit} variant="outline" size="sm" className="flex-1">
          <Clipboard className="mr-2 h-4 w-4" />
          Audit
        </Button>
        <Button onClick={onViewHistory} variant="outline" size="sm" className="flex-1">
          <History className="mr-2 h-4 w-4" />
          History
        </Button>
      </div>
    </div>
  );
};

export default MaterialCard;
