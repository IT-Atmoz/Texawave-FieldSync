import React, { useState } from "react";
import { Button } from "../salary/Button";
import { CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface MaterialRequest {
  id: string;
  materialId: string;
  materialName: string;
  quantityRequested: number;
  userId: string;
  username: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: number;
  respondedAt: number;
  responseMessage: string;
  projectId: string;
  totalCost: number;
}

interface Material {
  id: string;
  quantity: number;
  name: string;
  price: number;
  unitType: string;
}

interface Project {
  projectId: string;
  name: string;
  budget: number;
  spent: number;
}

interface RequestCardProps {
  request: MaterialRequest;
  material?: Material;
  project?: Project;
  onApprove: (message: string) => void;
  onReject: (message: string) => void;
  onSelect: () => void;
  isSelected: boolean;
}

const RequestCard: React.FC<RequestCardProps> = ({
  request,
  material,
  project,
  onApprove,
  onReject,
  onSelect,
  isSelected,
}) => {
  const [responseMessage, setResponseMessage] = useState<string>("");

  const currentBudget = project ? project.budget - project.spent : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <h3 className="text-lg font-semibold text-black">{request.materialName}</h3>
        </div>
        <span
          className={`text-sm font-medium ${
            request.status === "pending"
              ? "text-yellow-600"
              : request.status === "approved"
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </span>
      </div>
      <div className="mt-2 text-sm text-gray-600">
        <p><strong>Requested by:</strong> {request.username}</p>
        <p><strong>Project:</strong> {project?.name || "Unknown Project"}</p>
        <p><strong>Quantity:</strong> {request.quantityRequested} {material?.unitType || "N/A"}</p>
        <p><strong>Unit Price:</strong> ₹{material?.price?.toFixed(2) || "0.00"} per {material?.unitType || "N/A"}</p>
        <p><strong>Total Cost:</strong> ₹{request.totalCost.toFixed(2)}</p>
        <p><strong>Actual Budget:</strong> ₹{project?.budget?.toFixed(2) || "0.00"}</p>
        <p><strong>Spent:</strong> ₹{project?.spent?.toFixed(2) || "0.00"}</p>
        <p><strong>Current Budget:</strong> ₹{currentBudget.toFixed(2)}</p>
        <p><strong>Requested At:</strong> {format(new Date(request.requestedAt), "MMM d, yyyy HH:mm")}</p>
        {request.respondedAt > 0 && (
          <p><strong>Responded At:</strong> {format(new Date(request.respondedAt), "MMM d, yyyy HH:mm")}</p>
        )}
        {request.responseMessage && (
          <p><strong>Response:</strong> {request.responseMessage}</p>
        )}
      </div>
      {request.status === "pending" && (
        <div className="mt-4 space-y-2">
          <textarea
            className="w-full rounded-lg border border-gray-300 p-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add response message (optional)"
            value={responseMessage}
            onChange={(e) => setResponseMessage(e.target.value)}
          />
          <div className="flex space-x-2">
            <Button
              onClick={() => onApprove(responseMessage)}
              variant="outline"
              size="sm"
              className="text-green-600 border-green-600 hover:bg-green-50"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </Button>
            <Button
              onClick={() => onReject(responseMessage)}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestCard;
