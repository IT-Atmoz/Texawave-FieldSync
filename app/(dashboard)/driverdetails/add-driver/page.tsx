"use client";
import React, { useState, useEffect } from "react";
import { ref, onValue, set, remove } from "firebase/database";
import { database } from "@/lib/firebase";
import { User, Save, X, Loader2, Edit2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { generate } from "short-uuid";

interface Driver {
  uid: string;
  username: string;
  password: string;
  fullName: string;
  contactNumber?: string;
  licenseNumber?: string;
  photoUrl?: string;
  area?: string;
  street?: string;
  pincode?: string;
  city?: string;
}

const CLOUDINARY_CLOUD_NAME = "dpgf1rkjl";
const CLOUDINARY_UPLOAD_PRESET = "unsigned_preset";
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const ManageDrivers: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [driverFormData, setDriverFormData] = useState<Driver | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);



  useEffect(() => {
    const driversRef = ref(database, "drivers");
    const unsubscribe = onValue(
      driversRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const driversData = snapshot.val();
            const driversList = Object.keys(driversData).map((uid) => ({
              uid,
              username: driversData[uid].username || "",
              password: driversData[uid].password || "",
              fullName: driversData[uid].fullName || "",
              contactNumber: driversData[uid].contactNumber || "",
              licenseNumber: driversData[uid].licenseNumber || "",
              photoUrl: driversData[uid].photoUrl || "",
              area: driversData[uid].area || "",
              street: driversData[uid].street || "",
              pincode: driversData[uid].pincode || "",
              city: driversData[uid].city || "",
            }));
            setDrivers(driversList);
          } else {
            setDrivers([]);
            setNotification({ message: "No drivers found", type: "error" });
          }
        } catch (err) {
          console.error("Error fetching drivers:", err);
          setNotification({ message: "Failed to load drivers", type: "error" });
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        console.error("Firebase listener error:", err);
        setNotification({ message: "Failed to listen for drivers", type: "error" });
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleDriverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDriverFormData((prev) => (prev ? { ...prev, [name]: value } : null));
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
        setDriverFormData((prev) => (prev ? { ...prev, photoUrl: data.secure_url } : null));
        setNotification({ message: "Photo uploaded successfully", type: "success" });
      } else {
        setNotification({ message: "Failed to upload photo", type: "error" });
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      setNotification({ message: "Failed to upload photo", type: "error" });
    }
  };

  const handleDriverSave = async () => {
    if (!driverFormData) {
      setNotification({ message: "No driver data provided", type: "error" });
      return;
    }
    if (
      !driverFormData.username ||
      !driverFormData.fullName ||
      !driverFormData.password ||
      !driverFormData.area ||
      !driverFormData.street ||
      !driverFormData.pincode ||
      !driverFormData.city
    ) {
      setNotification({
        message: "Username, Full Name, Password, Area, Street, Pincode, and City are required",
        type: "error",
      });
      return;
    }
    setIsSaving(true);
    const driverRef = ref(database, `drivers/${driverFormData.uid}`);
    try {
      await set(driverRef, {
        username: driverFormData.username,
        password: driverFormData.password,
        fullName: driverFormData.fullName,
        contactNumber: driverFormData.contactNumber || "",
        licenseNumber: driverFormData.licenseNumber || "",
        photoUrl: driverFormData.photoUrl || "",
        area: driverFormData.area,
        street: driverFormData.street,
        pincode: driverFormData.pincode,
        city: driverFormData.city,
      });
      setNotification({
        message: isAdding ? "Driver added successfully" : "Driver details updated successfully",
        type: "success",
      });
      setSelectedDriver(null);
      setDriverFormData(null);
      setIsAdding(false);
    } catch (error) {
      console.error("Error saving driver details:", error);
      setNotification({ message: "Failed to save driver details", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDriver = async (uid: string) => {
    if (!confirm("Are you sure you want to delete this driver?")) return;
    setIsLoading(true);
    const driverRef = ref(database, `drivers/${uid}`);
    try {
      await remove(driverRef);
      setNotification({ message: "Driver deleted successfully", type: "success" });
      setSelectedDriver(null);
      setDriverFormData(null);
    } catch (error) {
      console.error("Error deleting driver:", error);
      setNotification({ message: "Failed to delete driver", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDriver = (driver: Driver) => {
    setSelectedDriver(driver);
    setDriverFormData({ ...driver });
    setIsAdding(false);
  };

  const handleAddDriver = () => {
    setSelectedDriver(null);
    setDriverFormData({
      uid: generate(),
      username: "",
      password: "",
      fullName: "",
      contactNumber: "",
      licenseNumber: "",
      photoUrl: "",
      area: "",
      street: "",
      pincode: "",
      city: "",
    });
    setIsAdding(true);
  };

  const handleCancel = () => {
    setSelectedDriver(null);
    setDriverFormData(null);
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
          <User className="h-8 w-8 text-blue-600" />
          Manage Drivers
        </h1>
        {!selectedDriver && !isAdding ? (
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-200 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Driver List</h2>
              <button
                onClick={handleAddDriver}
                className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all duration-200 shadow-md"
              >
                <Plus className="h-5 w-5" /> Add New Driver
              </button>
            </div>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
            ) : drivers.length === 0 ? (
              <p className="text-center text-gray-500">No drivers available. Click "Add New Driver" to create one.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {drivers.map((driver) => (
                  <div
                    key={driver.uid}
                    className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-6 flex flex-col items-center"
                  >
                    {driver.photoUrl ? (
                      <img
                        src={driver.photoUrl}
                        alt={driver.fullName}
                        className="h-24 w-24 object-cover rounded-full mb-4"
                      />
                    ) : (
                      <div className="h-24 w-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                        <User className="h-12 w-12 text-gray-500" />
                      </div>
                    )}
                    <h3 className="text-lg font-semibold text-gray-900">{driver.fullName}</h3>
                    <p className="text-sm text-gray-600">{driver.username}</p>
                    <p className="text-sm text-gray-600">{driver.contactNumber || "N/A"}</p>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleSelectDriver(driver)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all duration-200 shadow-sm"
                      >
                        <Edit2 className="h-5 w-5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteDriver(driver.uid)}
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
                {isAdding ? "Add New Driver" : `Edit Driver: ${selectedDriver?.fullName}`}
              </h2>
              <div className="flex gap-4">
                <button
                  onClick={handleDriverSave}
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
                {[
                  { label: "Username", name: "username", type: "text" },
                  { label: "Password", name: "password", type: "password" },
                  { label: "Full Name", name: "fullName", type: "text" },
                  { label: "Contact Number", name: "contactNumber", type: "text" },
                  { label: "License Number", name: "licenseNumber", type: "text" },
                  { label: "Area", name: "area", type: "text" },
                  { label: "Street", name: "street", type: "text" },
                  { label: "Pincode", name: "pincode", type: "text" },
                  { label: "City", name: "city", type: "text" },
                ].map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
                    <input
                      type={field.type}
                      name={field.name}
                      value={driverFormData ? driverFormData[field.name as keyof Driver] || "" : ""}
                      onChange={handleDriverChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Driver Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                  />
                  {driverFormData?.photoUrl && (
                    <img
                      src={driverFormData.photoUrl}
                      alt="Driver"
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

export default ManageDrivers;
