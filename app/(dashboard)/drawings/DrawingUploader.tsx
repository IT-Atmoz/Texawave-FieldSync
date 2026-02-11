"use client";
import React, { useEffect, useState } from "react";
import { ref, push } from "firebase/database";
import { database } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ProjectType = { projectId: string; name: string };
const ALLOWED_TYPES = [
  "image/png", "image/jpeg", "image/jpg", "image/gif", "application/pdf",
  "model/gltf-binary", "model/gltf+json", "model/obj", "model/stl",
  // Add more MIME types as needed
];

const DrawingUploader: React.FC<{ onUploaded?: () => void }> = ({ onUploaded }) => {
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [projectId, setProjectId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [drawingType, setDrawingType] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);

  // Fetch projects dynamically
  useEffect(() => {
    import("firebase/database").then(({ ref, onValue }) => {
      onValue(ref(database, "projects"), (snap) => {
        if (snap.exists()) {
          const data = snap.val();
          const arr: ProjectType[] = Object.keys(data).map(id => ({
            projectId: id,
            name: data[id].name || id,
          }));
          setProjects(arr);
        }
      });
    });
  }, []);

  // Cloudinary upload, auto select endpoint
  const uploadToCloudinary = async (file: File): Promise<{ url: string; type: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "unsigned_preset");

    let endpoint = "https://api.cloudinary.com/v1_1/dpgf1rkjl/image/upload";
    if (file.type.startsWith("application/pdf")) {
      endpoint = "https://api.cloudinary.com/v1_1/dpgf1rkjl/raw/upload";
    } else if (file.type.startsWith("model/")) {
      endpoint = "https://api.cloudinary.com/v1_1/dpgf1rkjl/raw/upload";
    }

    const response = await fetch(endpoint, { method: "POST", body: formData });
    const data = await response.json();
    if (!data.secure_url) throw new Error("Cloudinary upload failed");
    return { url: data.secure_url, type: file.type };
  };

  // Upload logic
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !projectId) {
      alert("Please select a project and drawing file.");
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert("Unsupported file type. Images, PDFs, and 3D files (gltf, obj, stl) only.");
      return;
    }
    setUploading(true);
    try {
      const { url, type } = await uploadToCloudinary(file);
      await push(ref(database, "drawings"), {
        name: file.name,
        url,
        type,
        projectId,
        drawingType,
        description,
        uploadedAt: Date.now(),
      });
      setFile(null);
      setDrawingType("");
      setDescription("");
      setProjectId("");
      if (onUploaded) onUploaded();
    } catch (err: any) {
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form
      className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-md p-7 mb-8 w-full max-w-2xl mx-auto"
      onSubmit={handleUpload}
    >
      <h2 className="text-xl font-bold mb-5 text-indigo-700">Upload New Drawing</h2>
      <div className="mb-5">
        <label className="block font-bold text-lg mb-1 text-indigo-800">Select Project *</label>
        <select
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
          required
          className="w-full p-3 rounded-xl border border-indigo-300 shadow text-lg"
        >
          <option value="">-- Choose Project --</option>
          {projects.map(p => (
            <option key={p.projectId} value={p.projectId}>{p.name}</option>
          ))}
        </select>
      </div>
      <div className="mb-5">
        <label className="block font-bold text-lg mb-1 text-indigo-800">Drawing Type</label>
        <Input
          value={drawingType}
          onChange={e => setDrawingType(e.target.value)}
          placeholder="e.g. Architectural, Structural, 3D Model"
          className="p-3 text-lg rounded-xl"
        />
      </div>
      <div className="mb-5">
        <label className="block font-bold text-lg mb-1 text-indigo-800">Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Drawing Description"
          rows={4}
          className="w-full p-3 rounded-xl border border-indigo-300 text-base resize-none"
        />
      </div>
      <div className="mb-5">
        <label className="block font-bold text-lg mb-1 text-indigo-800">Select File *</label>
        <Input
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          onChange={e => setFile(e.target.files?.[0] || null)}
          className="p-3"
        />
        <div className="text-xs text-gray-500 mt-2">
          Allowed: Images (jpg, png, gif), PDF, 3D (gltf, obj, stl)
        </div>
      </div>
      <Button
        type="submit"
        className="mt-2 px-8 py-3 text-lg rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow hover:from-indigo-700 hover:to-purple-700"
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Upload Drawing"}
      </Button>
    </form>
  );
};

export default DrawingUploader;
