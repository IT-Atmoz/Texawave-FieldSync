"use client";
import React, { useEffect, useState, useRef } from "react";
import { ref, push } from "firebase/database";
import { database } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

type ProjectType = { projectId: string; name: string };

const DocumentUploader: React.FC<{ onUploaded?: () => void }> = ({ onUploaded }) => {
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [projectId, setProjectId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  // Fetch projects from Firebase
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

  // Cloudinary upload
  const uploadToCloudinary = async (file: File): Promise<{ url: string; type: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "unsigned_preset");
    const isImage = file.type.startsWith("image/");
    const endpoint = isImage
      ? "https://api.cloudinary.com/v1_1/dpgf1rkjl/image/upload"
      : "https://api.cloudinary.com/v1_1/dpgf1rkjl/raw/upload";

    const response = await fetch(endpoint, { method: "POST", body: formData });
    const data = await response.json();
    if (!data.secure_url) throw new Error("Cloudinary upload failed");
    return { url: data.secure_url, type: file.type };
  };

  // Reset all fields
  const resetFields = () => {
    setProjectId("");
    setFile(null);
    setCategory("");
    setDescription("");
    if (formRef.current) formRef.current.reset();
  };

  // Handle Upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!file || !projectId) {
      setErrorMsg("Please select a file and project.");
      return;
    }
    setUploading(true);
    try {
      const { url, type } = await uploadToCloudinary(file);
      await push(ref(database, "documents"), {
        name: file.name,
        url,
        type,
        createdAt: Date.now(),
        projectId,
        category,
        description,
      });
      resetFields();
      setSuccessMsg("Upload successful!");
      if (onUploaded) onUploaded();
    } catch (err: any) {
      setErrorMsg(err.message || "Upload failed");
    } finally {
      setUploading(false);
      setTimeout(() => setSuccessMsg(""), 2500);
    }
  };

  return (
    <form
      ref={formRef}
      className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-lg p-8 mb-10 w-full max-w-2xl mx-auto border border-indigo-100 animate-fade-in"
      onSubmit={handleUpload}
      autoComplete="off"
    >
      <h2 className="text-2xl font-extrabold text-indigo-900 mb-8 flex items-center gap-2">
        Upload Project Document
      </h2>

      {/* Success and Error messages */}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg mb-4 bg-green-50 text-green-700 shadow animate-slide-down">
          <CheckCircle className="h-5 w-5" /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg mb-4 bg-red-50 text-red-700 shadow animate-slide-down">
          <XCircle className="h-5 w-5" /> {errorMsg}
        </div>
      )}

      <div className="mb-6">
        <label className="block font-bold text-lg mb-1 text-indigo-800">Select Project <span className="text-red-600">*</span></label>
        <select
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
          required
          className="w-full p-3 rounded-xl border border-indigo-200 shadow focus:ring-2 focus:ring-indigo-400 text-base"
        >
          <option value="">-- Choose Project --</option>
          {projects.map(p => (
            <option key={p.projectId} value={p.projectId}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <label className="block font-bold text-lg mb-1 text-indigo-800">Category</label>
        <Input
          value={category}
          onChange={e => setCategory(e.target.value)}
          placeholder="Document Category"
          className="p-3 text-lg rounded-xl bg-gray-50 border-2 border-indigo-100"
          maxLength={50}
        />
      </div>

      <div className="mb-6">
        <label className="block font-bold text-lg mb-1 text-indigo-800">Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Document Description"
          rows={5}
          className="w-full p-4 text-base rounded-xl border-2 border-indigo-100 bg-gray-50 resize-none"
          maxLength={400}
        />
      </div>

      <div className="mb-6">
        <label className="block font-bold text-lg mb-1 text-indigo-800">Select File <span className="text-red-600">*</span></label>
        <Input
          type="file"
          accept="image/*,application/pdf"
          onChange={e => setFile(e.target.files?.[0] || null)}
          className="p-3 bg-white border-2 border-indigo-100"
          required
        />
        {file && (
          <span className="block mt-2 text-sm text-indigo-700 font-medium truncate">{file.name}</span>
        )}
      </div>

      <Button
        type="submit"
        className="mt-2 px-8 py-3 text-lg rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow hover:from-indigo-700 hover:to-purple-700 w-full transition"
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Upload"}
      </Button>
      <style jsx global>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(30px);} to {opacity:1; transform: none;} }
        .animate-fade-in { animation: fade-in 0.7s cubic-bezier(.19,1,.22,1); }
        @keyframes slide-down { from { transform: translateY(-24px); opacity: 0;} to { transform: none; opacity: 1;}}
        .animate-slide-down { animation: slide-down 0.35s cubic-bezier(.19,1,.22,1);}
      `}</style>
    </form>
  );
};

export default DocumentUploader;
