"use client";
import React from "react";
import { XCircle } from "lucide-react";

interface DocumentPreviewModalProps {
  file: {
    name: string;
    url: string;
    type: string;
  };
  onClose: () => void;
}

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ file, onClose }) => {
  if (!file) return null;

 const fileType = file?.type || "";
const fileName = file?.name || "";

const isImage = fileType.startsWith("image/");
const isPDF = fileType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-2">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 flex flex-col items-center">
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 rounded-full transition"
        >
          <XCircle className="h-7 w-7" />
        </button>
        <h2 className="text-lg font-semibold text-gray-800 mb-4 truncate w-full text-center">{file.name}</h2>
        <div className="w-full flex flex-col items-center justify-center gap-4">
          {isImage ? (
            <img
              src={file.url}
              alt={file.name}
              className="rounded-xl shadow max-h-[65vh] object-contain mx-auto"
              style={{ maxWidth: "100%" }}
            />
          ) : isPDF ? (
            <div className="flex flex-col items-center gap-3 p-4">
              <div className="text-indigo-700 text-2xl font-bold">PDF Preview Not Supported</div>
              <a
                href={file.url}
                download={file.name}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
              >
                Download PDF
              </a>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 p-4">
              <div className="text-indigo-700 text-2xl font-bold">Preview Not Supported</div>
              <a
                href={file.url}
                download={file.name}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
              >
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;
