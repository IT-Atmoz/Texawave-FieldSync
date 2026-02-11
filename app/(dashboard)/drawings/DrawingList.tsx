"use client";
import React, { useEffect, useState } from "react";
import { ref, onValue, remove } from "firebase/database";
import { database } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Eye, Download, Trash2 } from "lucide-react";

type DrawingType = {
  key: string;
  name: string;
  url: string;
  type: string;
  projectId: string;
  drawingType: string;
  description: string;
  uploadedAt: number;
};

type ProjectMap = { [projectId: string]: string };

const DrawingList: React.FC = () => {
  const [drawings, setDrawings] = useState<DrawingType[]>([]);
  const [projects, setProjects] = useState<ProjectMap>({});
  const [preview, setPreview] = useState<DrawingType | null>(null);

  useEffect(() => {
    import("firebase/database").then(({ ref, onValue }) => {
      // Fetch project names
      onValue(ref(database, "projects"), (snap) => {
        if (snap.exists()) {
          const data = snap.val();
          const pMap: ProjectMap = {};
          Object.keys(data).forEach(id => { pMap[id] = data[id].name; });
          setProjects(pMap);
        }
      });
      // Fetch drawings
      onValue(ref(database, "drawings"), (snap) => {
        if (snap.exists()) {
          const data = snap.val();
          const arr: DrawingType[] = Object.keys(data).map(key => ({
            ...data[key],
            key,
          }));
          arr.sort((a, b) => b.uploadedAt - a.uploadedAt); // latest first
          setDrawings(arr);
        }
      });
    });
  }, []);

  // Remove Drawing
  const handleDelete = async (key: string) => {
    if (window.confirm("Delete this drawing?")) {
      await remove(ref(database, "drawings/" + key));
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto mb-20">
      <h2 className="text-2xl font-bold mb-5 text-indigo-900">Uploaded Drawings</h2>
      <div className="flex flex-col gap-6">
        {drawings.length === 0 && (
          <div className="bg-gray-100 text-gray-500 rounded-xl text-lg text-center py-12 font-semibold">
            No drawings uploaded yet.
          </div>
        )}
        {drawings.map((drawing) => {
          const isImage = drawing.type.startsWith("image/");
          const isPDF = drawing.type === "application/pdf" || drawing.name?.toLowerCase().endsWith(".pdf");
          const is3D = drawing.type.startsWith("model/") ||
            [".gltf", ".glb", ".obj", ".stl"].some(ext => drawing.name?.toLowerCase().endsWith(ext));

          return (
            <div
              key={drawing.key}
              className="bg-white/90 rounded-2xl shadow flex flex-col md:flex-row gap-5 items-center p-5 border border-indigo-50"
            >
              {/* Thumbnail/Preview */}
              <div className="flex-shrink-0 w-36 h-36 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 overflow-hidden">
                {isImage ? (
                  <img src={drawing.url} alt={drawing.name} className="w-full h-full object-contain" />
                ) : isPDF ? (
                  <span className="text-4xl text-red-500 font-bold">PDF</span>
                ) : is3D ? (
                  <span className="text-4xl text-indigo-400 font-bold">3D</span>
                ) : (
                  <span className="text-4xl text-gray-400">?</span>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                  <div className="font-bold text-indigo-700 text-lg truncate">{drawing.name}</div>
                  <div className="text-xs text-gray-500">{new Date(drawing.uploadedAt).toLocaleString()}</div>
                </div>
                <div className="flex flex-wrap gap-3 my-2">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-xl">
                    Project: <span className="font-semibold">{projects[drawing.projectId] || drawing.projectId}</span>
                  </span>
                  {drawing.drawingType && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-xl">
                      Type: {drawing.drawingType}
                    </span>
                  )}
                </div>
                <div className="text-gray-700 text-sm break-words">
                  {drawing.description}
                </div>
              </div>
              {/* Actions */}
              <div className="flex flex-col gap-3 items-end">
                {(isImage || is3D) && (
                  <Button
                    variant="outline"
                    className="flex gap-2 items-center"
                    onClick={() => setPreview(drawing)}
                  >
                    <Eye className="h-4 w-4" /> View
                  </Button>
                )}
                {isPDF && (
                  <a
                    href={drawing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-3 py-2 rounded-lg bg-gradient-to-r from-red-400 to-pink-500 text-white font-medium shadow hover:from-red-500 hover:to-pink-600"
                  >
                    <Download className="h-4 w-4 mr-1" /> Download PDF
                  </a>
                )}
                {isImage && (
                  <a
                    href={drawing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium shadow hover:from-indigo-600 hover:to-purple-700"
                    download={drawing.name}
                  >
                    <Download className="h-4 w-4 mr-1" /> Download
                  </a>
                )}
                <Button
                  variant="destructive"
                  className="flex gap-2 items-center"
                  onClick={() => handleDelete(drawing.key)}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2">
          <div className="relative bg-white rounded-2xl p-6 max-w-2xl w-full flex flex-col items-center">
            <button
              className="absolute top-3 right-4 text-gray-500 hover:text-red-700 text-xl"
              onClick={() => setPreview(null)}
            >×</button>
            <div className="mb-2 font-bold text-lg">{preview.name}</div>
            {preview.type.startsWith("image/") ? (
              <img src={preview.url} alt={preview.name} className="max-h-[60vh] w-auto rounded-xl shadow" />
            ) : (preview.type.startsWith("model/") || [".gltf", ".glb"].some(ext => preview.name.toLowerCase().endsWith(ext))) ? (
              <iframe
                src={`https://modelviewer.dev/editor/?model=${encodeURIComponent(preview.url)}`}
                style={{ width: "480px", height: "350px", border: "none", background: "#f8f8ff", borderRadius: "12px" }}
                title="3D Preview"
              />
            ) : (
              <div className="text-gray-500 text-lg">Preview not supported.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DrawingList;
