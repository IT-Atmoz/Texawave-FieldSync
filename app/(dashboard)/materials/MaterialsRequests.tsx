import React, { useState, useEffect, useMemo } from "react";
import { ref, onValue, set, update, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { Search, Calendar, Download, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../salary/Button";
import RequestCard from "./RequestCard";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { CSVLink } from "react-csv";

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
  category: string;
  imageUrl: string;
  supplier: string;
  description: string;
  size: string;
  weight: number;
  unitType: string;
  createdAt: number;
  updatedAt: number;
}

interface Project {
  projectId: string;
  name: string;
  budget: number;
  spent: number;
}

interface FilterState {
  searchQuery: string;
  filterStatus: string;
  filterUsername: string;
  startDate: string;
  endDate: string;
}

const MaterialsRequests: React.FC = () => {
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [materials, setMaterials] = useState<{ [key: string]: Material }>({});
  const [projects, setProjects] = useState<{ [key: string]: Project }>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("All Statuses");
  const [filterUsername, setFilterUsername] = useState<string>("All Users");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [savedFilters, setSavedFilters] = useState<FilterState[]>([]);

  // Fetch materials
  useEffect(() => {
    const materialsRef = ref(database, "materials");
    const unsubscribeMaterials = onValue(materialsRef, (snapshot) => {
      if (snapshot.exists()) {
        const materialsData = snapshot.val();
        const materialsMap: { [key: string]: Material } = {};
        Object.keys(materialsData).forEach((id) => {
          const material = materialsData[id];
          materialsMap[id] = {
            id,
            quantity: material.quantity || 0,
            name: material.name || "",
            price: material.price || 0,
            category: material.category || "Uncategorized",
            imageUrl: material.imageUrl || "",
            supplier: material.supplier || "N/A",
            description: material.description || "No description available",
            size: material.size || "N/A",
            weight: material.weight || 0,
            unitType: material.unitType || "N/A",
            createdAt: material.createdAt || 0,
            updatedAt: material.updatedAt || 0,
          };
        });
        setMaterials(materialsMap);
      }
    });
    return () => unsubscribeMaterials();
  }, []);

  // Fetch projects
  useEffect(() => {
    const projectsRef = ref(database, "projects");
    const unsubscribeProjects = onValue(projectsRef, (snapshot) => {
      if (snapshot.exists()) {
        const projectsData = snapshot.val();
        const projectsMap: { [key: string]: Project } = {};
        Object.keys(projectsData).forEach((id) => {
          const project = projectsData[id];
          projectsMap[id] = {
            projectId: id,
            name: project.name || "Unknown Project",
            budget: project.budget || 0,
            spent: project.spent || 0,
          };
        });
        setProjects(projectsMap);
      }
    });
    return () => unsubscribeProjects();
  }, []);

  // Fetch requests
  useEffect(() => {
    const requestsRef = ref(database, "material_requests");
    const unsubscribe = onValue(
      requestsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const requestsData = snapshot.val();
          const requestsList = Object.keys(requestsData).map((id) => ({
            id,
            materialId: requestsData[id].materialId || "",
            materialName: requestsData[id].materialName || "",
            quantityRequested: requestsData[id].quantityRequested || 0,
            userId: requestsData[id].userId || "",
            username: requestsData[id].username || "Unknown User",
            status: requestsData[id].status || "pending",
            requestedAt: requestsData[id].requestedAt || 0,
            respondedAt: requestsData[id].respondedAt || 0,
            responseMessage: requestsData[id].responseMessage || "",
            projectId: requestsData[id].projectId || "",
            totalCost: requestsData[id].totalCost || 0,
          }));
          setRequests(requestsList);
        } else {
          setRequests([]);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Failed to fetch requests:", error);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Get unique usernames
  const usernames = useMemo(() => {
    const uniqueUsernames = new Set<string>(requests.map((request) => request.username));
    return ["All Users", ...Array.from(uniqueUsernames)];
  }, [requests]);

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesSearch =
        request.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.username.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "All Statuses" || request.status === filterStatus.toLowerCase();
      const matchesUsername = filterUsername === "All Users" || request.username === filterUsername;
      const requestDate = new Date(request.requestedAt);
      const matchesDateRange =
        (!startDate || requestDate >= new Date(startDate)) &&
        (!endDate || requestDate <= new Date(endDate));
      return matchesSearch && matchesStatus && matchesUsername && matchesDateRange;
    });
  }, [requests, searchQuery, filterStatus, filterUsername, startDate, endDate]);

  // Prepare CSV data
  const csvData = useMemo(() => {
    return filteredRequests.map((request) => ({
      ID: request.id,
      Material: request.materialName,
      Quantity: request.quantityRequested,
      User: request.username,
      Status: request.status,
      "Requested At": format(new Date(request.requestedAt), "yyyy-MM-dd HH:mm:ss"),
      "Responded At": request.respondedAt ? format(new Date(request.respondedAt), "yyyy-MM-dd HH:mm:ss") : "N/A",
      "Response Message": request.responseMessage,
      Project: projects[request.projectId]?.name || "Unknown",
      "Total Cost": request.totalCost,
    }));
  }, [filteredRequests, projects]);

  // Handle approve/reject request
  const handleRespond = async (request: MaterialRequest, status: "approved" | "rejected", message: string) => {
    try {
      const materialRef = ref(database, `materials/${request.materialId}`);
      const materialSnapshot = await get(materialRef);
      if (!materialSnapshot.exists()) {
        throw new Error("Material not found");
      }
      const materialData = materialSnapshot.val();
      const material: Material = {
        id: request.materialId,
        quantity: materialData.quantity || 0,
        name: materialData.name || "",
        price: materialData.price || 0,
        category: materialData.category || "Uncategorized",
        imageUrl: materialData.imageUrl || "",
        supplier: materialData.supplier || "N/A",
        description: materialData.description || "No description available",
        size: materialData.size || "N/A",
        weight: materialData.weight || 0,
        unitType: materialData.unitType || "N/A",
        createdAt: materialData.createdAt || 0,
        updatedAt: materialData.updatedAt || 0,
      };

      const projectRef = ref(database, `projects/${request.projectId}`);
      const projectSnapshot = await get(projectRef);
      if (!projectSnapshot.exists()) {
        throw new Error("Project not found");
      }
      const projectData = projectSnapshot.val();
      const project: Project = {
        projectId: request.projectId,
        name: projectData.name || "Unknown Project",
        budget: projectData.budget || 0,
        spent: projectData.spent || 0,
      };

      if (status === "approved") {
        if (request.quantityRequested > material.quantity) {
          throw new Error(`Insufficient quantity: ${material.quantity} available`);
        }
        const currentBudget = project.budget - project.spent;
        if (request.totalCost > currentBudget) {
          throw new Error(`Budget exceeded: ₹${request.totalCost} > ₹${currentBudget}`);
        }
      }

      const requestRef = ref(database, `material_requests/${request.id}`);
      const updatedRequest = {
        ...request,
        status,
        respondedAt: Date.now(),
        responseMessage: message,
      };

      if (status === "approved") {
        await update(materialRef, {
          quantity: material.quantity - request.quantityRequested,
          updatedAt: Date.now(),
        });
        await update(projectRef, {
          spent: project.spent + request.totalCost,
        });
      }
      await set(requestRef, updatedRequest);
    } catch (error: any) {
      alert(`Failed to ${status} request: ${error.message}`);
    }
  };

  // Save current filter
  const handleSaveFilter = () => {
    const currentFilter: FilterState = {
      searchQuery,
      filterStatus,
      filterUsername,
      startDate,
      endDate,
    };
    setSavedFilters((prev) => [...prev, currentFilter]);
    alert("Filter saved!");
  };

  // Load saved filter
  const handleLoadFilter = (filter: FilterState) => {
    setSearchQuery(filter.searchQuery);
    setFilterStatus(filter.filterStatus);
    setFilterUsername(filter.filterUsername);
    setStartDate(filter.startDate);
    setEndDate(filter.endDate);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
       
          <div className="flex gap-2">
          
            <CSVLink
              data={csvData}
              filename={`material_requests_${format(new Date(), "yyyy-MM-dd")}.csv`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </CSVLink>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search materials or users..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {["All Statuses", "Pending", "Approved", "Rejected"].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            value={filterUsername}
            onChange={(e) => setFilterUsername(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {usernames.map((username) => (
              <option key={username} value={username}>
                {username}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Saved Filters */}
        {savedFilters.length > 0 && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Saved Filters</h2>
            <div className="flex flex-wrap gap-2">
              {savedFilters.map((filter, index) => (
                <Button
                  key={index}
                  onClick={() => handleLoadFilter(filter)}
                  className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Filter {index + 1}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Requests List */}
        {isLoading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading requests...</p>
          </div>
        ) : filteredRequests.length > 0 ? (
          <div className="grid gap-4">
            <AnimatePresence>
              {filteredRequests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <RequestCard
                    request={request}
                    material={materials[request.materialId]}
                    project={projects[request.projectId]}
                    onApprove={(message) => handleRespond(request, "approved", message)}
                    onReject={(message) => handleRespond(request, "rejected", message)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            No requests found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialsRequests;
