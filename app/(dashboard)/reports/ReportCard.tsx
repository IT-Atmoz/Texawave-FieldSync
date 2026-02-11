import React from "react";
import { Clock } from "lucide-react";

interface Report {
  id: string;
  type: "text" | "photo" | "pdf";
  content: string;
  photoUrl?: string;
  timestamp: number;
}

interface ReportCardProps {
  report: Report;
}

const ReportCard: React.FC<ReportCardProps> = ({ report }) => {
  const formattedDate = new Date(report.timestamp).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-gray-50 rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900 capitalize">Type: {report.type}</h3>
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Clock className="h-4 w-4" />
          <span>{formattedDate}</span>
        </div>
      </div>
      {report.photoUrl && (
        <img
          src={report.photoUrl}
          alt="Report image"
          className="w-full h-64 object-cover rounded-lg mb-4"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            console.error("Failed to load image:", report.photoUrl);
          }}
        />
      )}
      <p className="text-gray-700 text-sm leading-relaxed">{report.content}</p>
    </div>
  );
};

export default ReportCard;
