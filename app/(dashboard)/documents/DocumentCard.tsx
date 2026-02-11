"use client";
import React from "react";
import { Trash, Eye } from "lucide-react";

interface DocumentCardProps {
  doc: {
    id: string;
    title: string;
    description: string;
    url: string;
    uploadedBy: string;
    uploadedAt: number;
  };
  onDelete: (id: string) => void;
  onView: (url: string) => void;
}
const DocumentCard: React.FC<DocumentCardProps> = ({ doc, onDelete, onView }) => (
  <div className="bg-white shadow-lg rounded-xl p-4 flex flex-col justify-between h-full border hover:border-indigo-400 transition group">
    <div className="flex-1">
      <h3 className="text-xl font-bold text-indigo-700 mb-1 group-hover:underline break-words">{doc.title}</h3>
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{doc.description}</p>
    </div>
    <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
      <span>By: {doc.uploadedBy}</span>
      <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
    </div>
    <div className="flex gap-2">
      <button
        onClick={() => onView(doc.url)}
        className="flex-1 py-2 px-4 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 flex items-center justify-center gap-2 font-medium"
      >
        <Eye className="w-4 h-4" /> View
      </button>
      <button
        onClick={() => onDelete(doc.id)}
        className="py-2 px-4 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-2 font-medium"
      >
        <Trash className="w-4 h-4" /> Delete
      </button>
    </div>
  </div>
);
export default DocumentCard;
