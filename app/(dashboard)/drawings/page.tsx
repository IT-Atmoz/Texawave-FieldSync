"use client";
import DrawingUploader from "./DrawingUploader";
import DrawingList from "./DrawingList";
import React from "react";
export default function DrawingsPage() {
  const [refresh, setRefresh] = React.useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-10 px-2">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold text-indigo-900 mb-10 tracking-tight">
          Project Drawings & 3D Models
        </h1>
        <DrawingUploader onUploaded={() => setRefresh(x => x + 1)} />
        <DrawingList key={refresh} />
      </div>
    </div>
  );
}
