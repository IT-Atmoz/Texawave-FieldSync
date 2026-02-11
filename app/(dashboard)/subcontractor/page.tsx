"use client";

import React, { useState, useEffect } from "react";
import { ref, onValue, set, remove } from "firebase/database";
import { database } from "@/lib/firebase";
import { ReceiptText, Edit2, Trash2, Loader2, Save, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { generate } from "short-uuid";
import { saveAs } from "file-saver";

interface Subcontractor {
  uid: string;
  name: string;
  trade: string;
  phone?: string;
  gstNumber?: string;
  photoUrl?: string;
}

const CLOUDINARY_CLOUD_NAME = "dpgf1rkjl";
const CLOUDINARY_UPLOAD_PRESET = "unsigned_preset";
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const SubcontractorBilling: React.FC = () => {
  const [subs, setSubs] = useState<Subcontractor[]>([]);
  const [formData, setFormData] = useState<Subcontractor | null>(null);
  const [selectedSub, setSelectedSub] = useState<Subcontractor | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [month, setMonth] = useState<string>("09");
  const [year, setYear] = useState<string>("2025");

  useEffect(() => {
    const subsRef = ref(database, "subcontractors");
    const unsubscribe = onValue(subsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map((uid) => ({ uid, ...data[uid] }));
        setSubs(list);
      } else {
        setSubs([]);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    const res = await fetch(CLOUDINARY_API_URL, { method: "POST", body: fd });
    const data = await res.json();
    if (data.secure_url) {
      setFormData((prev) => (prev ? { ...prev, photoUrl: data.secure_url } : null));
    }
  };

  const handleSave = async () => {
    if (!formData?.name || !formData.trade) {
      setNotification({ message: "Name and trade are required", type: "error" });
      return;
    }
    setIsSaving(true);
    const subRef = ref(database, `subcontractors/${formData.uid}`);
    await set(subRef, { ...formData });
    setNotification({ message: "Saved successfully", type: "success" });
    setFormData(null);
    setSelectedSub(null);
    setIsAdding(false);
    setIsSaving(false);
  };

  const handleDelete = async (uid: string) => {
    if (!confirm("Are you sure?")) return;
    await remove(ref(database, `subcontractors/${uid}`));
    setNotification({ message: "Deleted", type: "success" });
  };

  const handleExportCSV = () => {
    const headers = ["Name", "Trade", "Phone", "GST", "Month", "Year"];
    const rows = subs.map((s) => [s.name, s.trade, s.phone || "", s.gstNumber || "", month, year]);
    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `subcontractors_${month}_${year}.csv`);
  };

  return (
    <div className="min-h-screen w-full px-4 py-10 sm:px-6 lg:px-8 bg-gray-50 flex justify-center">
      <div className="w-full max-w-5xl">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3 text-gray-900 justify-center">
          <ReceiptText className="h-8 w-8 text-blue-600" /> Subcontractor Billing
        </h1>

        <div className="flex gap-4 mb-6 items-center justify-between">
          <div className="flex gap-4 items-center">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={(i + 1).toString().padStart(2, "0")}>{i + 1}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300"
            >
              {["2024", "2025", "2026"].map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-4">
            <button onClick={handleExportCSV} className="px-4 py-2 bg-green-600 text-white rounded-lg">
              Export CSV
            </button>
            <button onClick={() => {
              setFormData({ uid: generate(), name: "", trade: "", phone: "", gstNumber: "", photoUrl: "" });
              setIsAdding(true);
            }} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Subcontractor
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {subs.map((s) => (
              <div key={s.uid} className="bg-white rounded-xl shadow-md p-6 text-center">
                {s.photoUrl ? (
                  <img src={s.photoUrl} className="h-24 w-24 rounded-full object-cover mx-auto mb-4" />
                ) : (
                  <div className="h-24 w-24 bg-gray-200 rounded-full flex justify-center items-center mx-auto mb-4">
                    <ReceiptText className="h-10 w-10 text-gray-500" />
                  </div>
                )}
                <h3 className="text-lg font-semibold text-gray-900">{s.name}</h3>
                <p className="text-sm text-gray-600">{s.trade}</p>
                <p className="text-sm text-gray-600">{s.phone || "N/A"}</p>
                <div className="flex gap-3 justify-center mt-4">
                  <button
                    onClick={() => {
                      setSelectedSub(s);
                      setFormData({ ...s });
                      setIsAdding(false);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4 inline-block mr-1" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(s.uid)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4 inline-block mr-1" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {(formData || selectedSub) && (
          <div className="bg-white mt-10 p-6 rounded-2xl shadow-xl border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {isAdding ? "Add New Subcontractor" : `Edit Subcontractor: ${selectedSub?.name}`}
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                </button>
                <button
                  onClick={() => {
                    setFormData(null);
                    setSelectedSub(null);
                    setIsAdding(false);
                  }}
                  className="bg-gray-400 text-white px-5 py-2 rounded-lg flex items-center gap-2"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { label: "Name", name: "name" },
                { label: "Trade", name: "trade" },
                { label: "Phone", name: "phone" },
                { label: "GST Number", name: "gstNumber" },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input
                    type="text"
                    name={f.name}
                    value={formData?.[f.name as keyof Subcontractor] || ""}
                    onChange={(e) => setFormData((prev) => prev ? { ...prev, [f.name]: e.target.value } : null)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Enter ${f.label}`}
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                />
                {formData?.photoUrl && (
                  <img src={formData.photoUrl} alt="Photo" className="mt-4 h-32 w-32 object-cover rounded-full" />
                )}
              </div>
            </div>
          </div>
        )}

        {notification && (
          <div
            className={cn(
              "fixed bottom-4 right-4 p-4 rounded-lg text-white font-medium shadow-lg",
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

export default SubcontractorBilling;
