import React, { useState, useEffect, useMemo } from "react";
import { ref, onValue, remove } from "firebase/database";
import { database } from "@/lib/firebase";
import { Search, Plus, History, Clipboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../salary/Button";
import MaterialCard from "./MaterialCard";
import AddMaterialModal from "./AddMaterialModal";
import StockAuditModal from "./StockAuditModal";
import { motion, AnimatePresence } from "framer-motion";

interface Material {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  quantity: number;
  category: string;
  supplier: string;
  description: string;
  size: string;        // New field
  weight: number;      // New field
  unitType: string;    // New field
  createdAt: number;
  updatedAt: number;
}

const MaterialsInventory: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("All Categories");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [editMaterial, setEditMaterial] = useState<Material | null>(null);
  const [auditMaterial, setAuditMaterial] = useState<Material | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch materials from Firebase
  useEffect(() => {
    const materialsRef = ref(database, "materials");
    const unsubscribe = onValue(
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
            size: materialsData[id].size || "",        // New field
            weight: materialsData[id].weight || 0,     // New field
            unitType: materialsData[id].unitType || "", // New field
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

    return () => unsubscribe();
  }, []);

  // Get unique categories for filtering
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>(materials.map((material) => material.category));
    return ["All Categories", ...Array.from(uniqueCategories).filter(category => category)];
  }, [materials]);

  // Filter materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((material) => {
      const matchesSearch = material.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === "All Categories" || material.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [materials, searchQuery, filterCategory]);

  // Handle category change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterCategory(e.target.value);
  };

  // Handle delete material
  const handleDelete = async (id: string) => {
    try {
      const materialRef = ref(database, `materials/${id}`);
      await remove(materialRef);
    } catch (error) {
      console.error("Failed to delete material:", error);
    }
  };

  // Handle stock audit
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
                  onViewHistory={() => window.alert("Feature coming soon: View request history for " + material.name)}
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
        />
      )}

      {showAuditModal && auditMaterial && (
        <StockAuditModal
          material={auditMaterial}
          onClose={() => setShowAuditModal(false)}
        />
      )}
    </div>
  );
};

export default MaterialsInventory;