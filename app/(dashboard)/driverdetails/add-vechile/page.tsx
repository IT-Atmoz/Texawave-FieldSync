"use client";
import React, { useState, useEffect } from "react";
import { ref, onValue, set, remove } from "firebase/database";
import { database } from "@/lib/firebase";
import { Car, Save, X, Loader2, Edit2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { generate } from "short-uuid";

interface Vehicle {
  vehicleId: string;
  vehicleNumber: string;
  type: string;
  photoUrl?: string;
}

const CLOUDINARY_CLOUD_NAME = "dpgf1rkjl";
const CLOUDINARY_UPLOAD_PRESET = "unsigned_preset";
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const ManageVehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleFormData, setVehicleFormData] = useState<Vehicle | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const vehiclesRef = ref(database, "vehicles");
    const unsubscribe = onValue(
      vehiclesRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const vehiclesData = snapshot.val();
            const vehiclesList = Object.keys(vehiclesData).map((vehicleId) => ({
              vehicleId,
              vehicleNumber: vehiclesData[vehicleId].vehicleNumber || "",
              type: vehiclesData[vehicleId].type || "",
              photoUrl: vehiclesData[vehicleId].photoUrl || "",
            }));
            setVehicles(vehiclesList);
          } else {
            setVehicles([]);
            setNotification({ message: "No vehicles found", type: "error" });
          }
        } catch (err) {
          console.error("Error fetching vehicles:", err);
          setNotification({ message: "Failed to load vehicles", type: "error" });
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        console.error("Firebase listener error:", err);
        setNotification({ message: "Failed to listen for vehicles", type: "error" });
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleVehicleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setVehicleFormData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setNotification({ message: "No file selected", type: "error" });
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    try {
      const response = await fetch(CLOUDINARY_API_URL, { method: "POST", body: formData });
      const data = await response.json();
      if (data.secure_url) {
        setVehicleFormData((prev) => (prev ? { ...prev, photoUrl: data.secure_url } : null));
        setNotification({ message: "Photo uploaded successfully", type: "success" });
      } else {
        setNotification({ message: "Failed to upload photo", type: "error" });
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      setNotification({ message: "Failed to upload photo", type: "error" });
    }
  };

  const handleVehicleSave = async () => {
    if (!vehicleFormData) {
      setNotification({ message: "No vehicle data provided", type: "error" });
      return;
    }
    if (!vehicleFormData.vehicleNumber || !vehicleFormData.type) {
      setNotification({ message: "Vehicle Number and Type are required", type: "error" });
      return;
    }
    setIsSaving(true);
    const vehicleRef = ref(database, `vehicles/${vehicleFormData.vehicleId}`);
    try {
      await set(vehicleRef, {
        vehicleNumber: vehicleFormData.vehicleNumber,
        type: vehicleFormData.type,
        photoUrl: vehicleFormData.photoUrl || "",
      });
      setNotification({
        message: isAdding ? "Vehicle added successfully" : "Vehicle details updated successfully",
        type: "success",
      });
      setSelectedVehicle(null);
      setVehicleFormData(null);
      setIsAdding(false);
    } catch (error) {
      console.error("Error saving vehicle details:", error);
      setNotification({ message: "Failed to save vehicle details", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return;
    setIsLoading(true);
    const vehicleRef = ref(database, `vehicles/${vehicleId}`);
    try {
      await remove(vehicleRef);
      setNotification({ message: "Vehicle deleted successfully", type: "success" });
      setSelectedVehicle(null);
      setVehicleFormData(null);
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      setNotification({ message: "Failed to delete vehicle", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleFormData({ ...vehicle });
    setIsAdding(false);
  };

  const handleAddVehicle = () => {
    setSelectedVehicle(null);
    setVehicleFormData({
      vehicleId: generate(),
      vehicleNumber: "",
      type: "",
      photoUrl: "",
    });
    setIsAdding(true);
  };

  const handleCancel = () => {
    setSelectedVehicle(null);
    setVehicleFormData(null);
    setIsAdding(false);
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <div className="min-h-screen w-full px-4 py-10 sm:px-6 lg:px-8 bg-gray-50 flex justify-center">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3 text-gray-900 animate-fade-in justify-center">
          <Car className="h-8 w-8 text-blue-600" />
          Manage Vehicles
        </h1>
        {!selectedVehicle && !isAdding ? (
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-200 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Vehicle List</h2>
              <button
                onClick={handleAddVehicle}
                className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all duration-200 shadow-md"
              >
                <Plus className="h-5 w-5" /> Add New Vehicle
              </button>
            </div>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
            ) : vehicles.length === 0 ? (
              <p className="text-center text-gray-500">No vehicles available. Click "Add New Vehicle" to create one.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle.vehicleId}
                    className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-6 flex flex-col items-center"
                  >
                    {vehicle.photoUrl ? (
                      <img
                        src={vehicle.photoUrl}
                        alt={vehicle.vehicleNumber}
                        className="h-24 w-24 object-cover rounded-full mb-4"
                      />
                    ) : (
                      <div className="h-24 w-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                        <Car className="h-12 w-12 text-gray-500" />
                      </div>
                    )}
                    <h3 className="text-lg font-semibold text-gray-900">{vehicle.vehicleNumber}</h3>
                    <p className="text-sm text-gray-600">{vehicle.type}</p>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleSelectVehicle(vehicle)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all duration-200 shadow-sm"
                      >
                        <Edit2 className="h-5 w-5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteVehicle(vehicle.vehicleId)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-all duration-200 shadow-sm"
                      >
                        <Trash2 className="h-5 w-5" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-200 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                {isAdding ? "Add New Vehicle" : `Edit Vehicle: ${selectedVehicle?.vehicleNumber}`}
              </h2>
              <div className="flex gap-4">
                <button
                  onClick={handleVehicleSave}
                  disabled={isSaving}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all duration-200 shadow-md",
                    isSaving && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-5 py-3 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition-all duration-200 shadow-md"
                >
                  <X className="h-5 w-5" /> Cancel
                </button>
              </div>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Number / Plate</label>
                  <input
                    type="text"
                    name="vehicleNumber"
                    value={vehicleFormData?.vehicleNumber || ""}
                    onChange={handleVehicleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                    placeholder="Enter vehicle number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    name="type"
                    value={vehicleFormData?.type || ""}
                    onChange={handleVehicleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                  >
                    <option value="">Select type</option>
                    {["Truck", "Van", "Excavator", "Bulldozer", "Other"].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                  />
                  {vehicleFormData?.photoUrl && (
                    <img
                      src={vehicleFormData.photoUrl}
                      alt="Vehicle"
                      className="mt-4 h-40 w-40 object-cover rounded-lg shadow-sm mx-auto"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {notification && (
          <div
            className={cn(
              "fixed bottom-4 right-4 p-4 rounded-lg text-white font-medium shadow-lg animate-slide-in-right",
              notification.type === "success" ? "bg-green-600" : "bg-red-600"
            )}
          >
            {notification.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageVehicles;
