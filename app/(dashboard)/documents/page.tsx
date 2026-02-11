"use client";
import React, { useState } from "react";
import DocumentUploader from "./DocumentUploader";
import DocumentList from "./DocumentList";
import { FileText } from "lucide-react";

export default function DocumentsPage() {
  const [refresh, setRefresh] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white" style={{ marginTop: 20 }}>
      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        <div className="flex flex-col gap-4 items-center mb-8">
          <div className="flex items-center gap-2">
            <FileText className="h-8 w-8 text-indigo-700" />
            <h1 className="text-3xl sm:text-4xl font-extrabold text-indigo-900">Documents</h1>
          </div>
          <p className="text-gray-500 text-center max-w-lg">
            Manage your project documents , plans, and documentation.
            Each file is linked to a project.
          </p>
        </div>
        <div className="mb-8 bg-white rounded-2xl shadow p-6">
          <DocumentUploader onUploaded={() => setRefresh(r => r+1)} />
        </div>
        <div className="bg-white/80 rounded-2xl shadow p-6">
          <DocumentList key={refresh} />
        </div>
      </div>
    </div>
  );
}
