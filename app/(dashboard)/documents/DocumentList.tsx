"use client";
import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase";
import { Eye, Trash2 } from "lucide-react";
import DocumentPreviewModal from "./DocumentPreviewModal"; // the modal code above
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

// Document type
type DocumentType = {
  id: string;
  name: string;
  url: string;
  type?: string;
  createdAt: number;
  projectId: string;
  category?: string;
  description?: string;
};

type ProjectType = {
  projectId: string;
  name: string;
};

const DocumentList: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [previewDoc, setPreviewDoc] = useState<DocumentType | null>(null);

  // Fetch projects (dynamic!)
  useEffect(() => {
    const projectsRef = ref(database, "projects");
    onValue(projectsRef, (snap) => {
      if (snap.exists()) {
        const projObj = snap.val();
        const arr: ProjectType[] = Object.keys(projObj).map((id) => ({
          projectId: id,
          name: projObj[id].name || id,
        }));
        setProjects(arr);
      }
    });
  }, []);

  // Fetch documents
  useEffect(() => {
    const docRef = ref(database, "documents");
    onValue(docRef, (snap) => {
      if (snap.exists()) {
        const docsObj = snap.val();
        const arr: DocumentType[] = Object.keys(docsObj).map((id) => ({
          id,
          ...docsObj[id],
        }));
        setDocuments(arr);
      }
    });
  }, []);

  // Filter docs by project and date
  const filteredDocs = documents.filter((doc) => {
    let match = true;
    if (selectedProject) match = match && doc.projectId === selectedProject;
    if (fromDate) match = match && doc.createdAt >= new Date(fromDate).setHours(0,0,0,0);
    if (toDate) match = match && doc.createdAt <= new Date(toDate).setHours(23,59,59,999);
    return match;
  });

  // Delete logic (optional: only if you want)
  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure?")) {
      import("firebase/database").then(({ ref, remove }) => {
        remove(ref(database, `documents/${id}`));
      });
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-3 items-end mb-6">
        {/* Project filter */}
        <div>
          <label className="block text-base font-medium mb-1 text-indigo-700">Project</label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="rounded-xl border-indigo-300 px-4 py-2 min-w-[180px] bg-white shadow"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.projectId} value={p.projectId}>{p.name}</option>
            ))}
          </select>
        </div>
        {/* From date */}
        <div>
          <label className="block text-base font-medium mb-1 text-indigo-700">From</label>
          <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="rounded-xl px-4 py-2"/>
        </div>
        {/* To date */}
        <div>
          <label className="block text-base font-medium mb-1 text-indigo-700">To</label>
          <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="rounded-xl px-4 py-2"/>
        </div>
      </div>
      {/* Docs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7">
        {filteredDocs.length === 0 ? (
          <div className="col-span-full flex flex-col items-center text-gray-500 py-16 text-lg">
            No documents found.
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <Card key={doc.id} className="shadow-lg rounded-2xl p-0 bg-gradient-to-br from-white to-indigo-50 relative group">
              <CardContent className="p-6">
                <div className="flex flex-row justify-between items-center gap-2">
                  <div className="text-xl font-bold text-indigo-800 truncate">{doc.name}</div>
                  <Badge className="ml-2 text-xs bg-indigo-100 text-indigo-800">{projects.find(p => p.projectId === doc.projectId)?.name || "Unknown Project"}</Badge>
                </div>
                <div className="mt-2 mb-3">
                  <div className="mb-1">
                    <span className="block text-base font-semibold text-gray-700">Category:</span>
                    <span className="block text-lg font-bold text-purple-800 break-words">{doc.category || "—"}</span>
                  </div>
                  <div className="mb-1">
                    <span className="block text-base font-semibold text-gray-700">Description:</span>
                    <span className="block text-base font-normal text-gray-800 bg-indigo-50 rounded-md p-2">{doc.description || "—"}</span>
                  </div>
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    Uploaded: <span className="ml-2">{doc.createdAt ? format(new Date(doc.createdAt), "PPP p") : ""}</span>
                  </div>
                </div>
                <div className="flex gap-3 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                    onClick={() => setPreviewDoc(doc)}
                  >
                    <Eye className="h-4 w-4" /> View
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="hover:bg-red-100 hover:text-red-800"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      {/* Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal file={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  );
};

export default DocumentList;
