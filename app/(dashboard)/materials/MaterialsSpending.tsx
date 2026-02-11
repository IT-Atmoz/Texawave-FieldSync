"use client";
import React, { useState, useEffect, useMemo, Component, ReactNode } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase";
import { Search, Calendar, X, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../salary/Button";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { format } from "date-fns";
import { CSVLink } from "react-csv";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Error Boundary for Chart
interface ChartErrorBoundaryProps {
  children: ReactNode;
}
interface ChartErrorBoundaryState {
  hasError: boolean;
}
class ChartErrorBoundary extends Component<ChartErrorBoundaryProps, ChartErrorBoundaryState> {
  constructor(props: ChartErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): ChartErrorBoundaryState {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center text-sm text-red-600 p-4 bg-red-50 rounded-lg">
          Error rendering chart. Please check Chart.js configuration.
        </div>
      );
    }
    return this.props.children;
  }
}

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
  name: string;
  price: number;
  category: string;
  quantity: number;
  unitType: string;
}

interface Project {
  projectId: string;
  name: string;
  budget: number;
  spent: number;
}

interface StockAudit {
  materialId: string;
  materialName: string;
  recordedQuantity: number;
  actualQuantity: number;
  auditedAt: number;
  auditedBy: string;
}

const MaterialsSpending: React.FC = () => {
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [materials, setMaterials] = useState<{ [key: string]: Material }>({});
  const [projects, setProjects] = useState<{ [key: string]: Project }>({});
  const [audits, setAudits] = useState<StockAudit[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("All Statuses");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch materials
  useEffect(() => {
    const materialsRef = ref(database, "materials");
    const unsubscribeMaterials = onValue(
      materialsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const materialsData = snapshot.val();
          const materialsMap: { [key: string]: Material } = {};
          Object.keys(materialsData).forEach((id) => {
            materialsMap[id] = {
              id,
              name: materialsData[id].name || "",
              price: parseFloat(materialsData[id].price) || 0,
              category: materialsData[id].category || "Uncategorized",
              quantity: parseInt(materialsData[id].quantity) || 0,
              unitType: materialsData[id].unitType || "N/A",
            };
          });
          setMaterials(materialsMap);
        } else {
          setMaterials({});
        }
      },
      (error) => {
        console.error("Failed to fetch materials:", error);
        setError("Failed to load materials data. Please try again later.");
      }
    );
    return () => unsubscribeMaterials();
  }, []);

  // Fetch projects
  useEffect(() => {
    const projectsRef = ref(database, "projects");
    const unsubscribeProjects = onValue(
      projectsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const projectsData = snapshot.val();
          const projectsMap: { [key: string]: Project } = {};
          Object.keys(projectsData).forEach((id) => {
            projectsMap[id] = {
              projectId: id,
              name: projectsData[id].name || "Unknown Project",
              budget: parseFloat(projectsData[id].budget) || 0,
              spent: parseFloat(projectsData[id].spent) || 0,
            };
          });
          setProjects(projectsMap);
        } else {
          setProjects({});
        }
      },
      (error) => {
        console.error("Failed to fetch projects:", error);
        setError("Failed to load projects data. Please try again later.");
      }
    );
    return () => unsubscribeProjects();
  }, []);

  // Fetch requests
  useEffect(() => {
    const requestsRef = ref(database, "material_requests");
    const unsubscribeRequests = onValue(
      requestsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const requestsData = snapshot.val();
          const requestsList = Object.keys(requestsData).map((id) => ({
            id,
            materialId: requestsData[id].materialId || "",
            materialName: requestsData[id].materialName || "",
            quantityRequested: parseInt(requestsData[id].quantityRequested) || 0,
            userId: requestsData[id].userId || "",
            username: requestsData[id].username || "",
            status: requestsData[id].status || "pending",
            requestedAt: parseInt(requestsData[id].requestedAt) || 0,
            respondedAt: parseInt(requestsData[id].respondedAt) || 0,
            responseMessage: requestsData[id].responseMessage || "",
            projectId: requestsData[id].projectId || "",
            totalCost: parseFloat(requestsData[id].totalCost) || 0,
          }));
          setRequests(requestsList);
        } else {
          setRequests([]);
        }
      },
      (error) => {
        console.error("Failed to fetch requests:", error);
        setError("Failed to load requests data. Please try again later.");
      }
    );
    return () => unsubscribeRequests();
  }, []);

  // Fetch stock audits
  useEffect(() => {
    const auditsRef = ref(database, "stock_audits");
    const unsubscribeAudits = onValue(
      auditsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const auditsData = snapshot.val();
          const auditsList = Object.keys(auditsData).map((id) => ({
            materialId: auditsData[id].materialId || "",
            materialName: auditsData[id].materialName || "",
            recordedQuantity: parseInt(auditsData[id].recordedQuantity) || 0,
            actualQuantity: parseInt(auditsData[id].actualQuantity) || 0,
            auditedAt: parseInt(auditsData[id].auditedAt) || 0,
            auditedBy: auditsData[id].auditedBy || "",
          }));
          setAudits(auditsList);
        } else {
          setAudits([]);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Failed to fetch audits:", error);
        setError("Failed to load audits data. Please try again later.");
        setIsLoading(false);
      }
    );
    return () => unsubscribeAudits();
  }, []);

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesSearch =
        request.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (projects[request.projectId]?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "All Statuses" || request.status === filterStatus.toLowerCase();
      const requestDate = new Date(request.requestedAt);
      const matchesDateRange =
        (!startDate || requestDate >= new Date(startDate)) && (!endDate || requestDate <= new Date(endDate));
      return matchesSearch && matchesStatus && matchesDateRange;
    });
  }, [requests, projects, searchQuery, filterStatus, startDate, endDate]);

  // Calculate project spending
  const projectSpending = useMemo(() => {
    const spendingMap: { [key: string]: { projectId: string; name: string; budget: number; spent: number; approvedCost: number } } = {};
    Object.values(projects).forEach((project) => {
      spendingMap[project.projectId] = {
        projectId: project.projectId,
        name: project.name,
        budget: project.budget,
        spent: project.spent,
        approvedCost: 0,
      };
    });
    filteredRequests.forEach((request) => {
      if (request.status === "approved" && spendingMap[request.projectId]) {
        spendingMap[request.projectId].approvedCost += request.totalCost;
      }
    });
    return Object.values(spendingMap);
  }, [filteredRequests, projects]);

  // Calculate spending metrics
  const spendingMetrics = useMemo(() => {
    let approved = 0;
    let pending = 0;
    let rejected = 0;
    const categorySpending: { [key: string]: number } = {};
    filteredRequests.forEach((request) => {
      const material = materials[request.materialId];
      if (!material) return;
      const cost = request.totalCost;
      const category = material.category || "Uncategorized";
      if (request.status === "approved") {
        approved += cost;
        categorySpending[category] = (categorySpending[category] || 0) + cost;
      } else if (request.status === "pending") {
        pending += cost;
      } else if (request.status === "rejected") {
        rejected += cost;
      }
    });
    const total = approved;
    return { approved, pending, rejected, total, categorySpending };
  }, [filteredRequests, materials]);

  // Prepare chart data
  const chartData = useMemo(
    () => ({
      labels: Object.keys(spendingMetrics.categorySpending),
      datasets: [
        {
          label: "Approved Spending by Category (₹)",
          data: Object.values(spendingMetrics.categorySpending),
          backgroundColor: "rgba(34, 197, 94, 0.6)",
          borderColor: "rgba(34, 197, 94, 1)",
          borderWidth: 1,
        },
      ],
    }),
    [spendingMetrics.categorySpending]
  );

  // Calculate wastage
  const wastage = useMemo(() => {
    const wastageMap: {
      [key: string]: { materialId: string; materialName: string; requested: number; consumed: number; cost: number };
    } = {};
    filteredRequests
      .filter((r) => r.status === "approved")
      .forEach((r) => {
        const materialId = r.materialId;
        const material = materials[materialId];
        if (!material) return;
        if (!wastageMap[materialId]) {
          wastageMap[materialId] = {
            materialId,
            materialName: r.materialName,
            requested: 0,
            consumed: 0,
            cost: 0,
          };
        }
        wastageMap[materialId].requested += r.quantityRequested;
        wastageMap[materialId].cost += r.totalCost;
      });
    audits.forEach((audit) => {
      if (wastageMap[audit.materialId]) {
        wastageMap[audit.materialId].consumed = audit.actualQuantity;
      }
    });
    return Object.values(wastageMap).filter((item) => item.requested > item.consumed);
  }, [filteredRequests, audits, materials]);

  // Prepare CSV data
  const projectSpendingCsv = useMemo(() => {
    return projectSpending.map((project) => ({
      Project: project.name,
      Budget: project.budget.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      Spent: project.spent.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      "Approved Spending": project.approvedCost.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
    }));
  }, [projectSpending]);

  const transactionsCsv = useMemo(() => {
    return filteredRequests.map((request) => {
      const material = materials[request.materialId];
      const project = projects[request.projectId];
      return {
        Material: request.materialName,
        Project: project?.name || "Unknown Project",
        Quantity: request.quantityRequested,
        "Unit Price": (material?.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
        "Total Cost": request.totalCost.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
        Status: request.status.charAt(0).toUpperCase() + request.status.slice(1),
        Date: format(new Date(request.requestedAt), "yyyy-MM-dd"),
      };
    });
  }, [filteredRequests, materials, projects]);

  const wastageCsv = useMemo(() => {
    return wastage.map((item) => {
      const wastedQuantity = item.requested - item.consumed;
      const wastageCost = wastedQuantity * (item.cost / item.requested);
      return {
        Material: item.materialName,
        Requested: item.requested,
        Consumed: item.consumed,
        Wasted: wastedQuantity,
        "Cost of Wastage": wastageCost.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      };
    });
  }, [wastage]);

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setFilterStatus("All Statuses");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
     
          <span className="text-sm text-gray-600">
            {format(new Date(), "PPPP p", { timeZone: "Asia/Kolkata" })}
          </span>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <span>{error}</span>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Spending</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by material or project..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                title="Search by material or project name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                title="Filter by request status"
              >
                {["All Statuses", "Pending", "Approved", "Rejected"].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Date Range</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    title="Filter by start date"
                  />
                </div>
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    title="Filter by end date"
                  />
                </div>
              </div>
            </div>
          </div>
          <Button
            onClick={resetFilters}
            className="mt-4 bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Reset Filters
          </Button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading data...</p>
          </div>
        ) : (
          <>
            {/* Project Spending */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Spending by Project</h3>
                <CSVLink
                  data={projectSpendingCsv}
                  filename={`project_spending_${format(new Date(), "yyyy-MM-dd")}.csv`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </CSVLink>
              </div>
              {projectSpending.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-600">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th className="px-6 py-3">Project</th>
                        <th className="px-6 py-3">Budget (₹)</th>
                        <th className="px-6 py-3">Spent (₹)</th>
                        <th className="px-6 py-3">Approved Spending (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectSpending.map((project, index) => (
                        <tr
                          key={project.projectId}
                          className={cn("border-b hover:bg-gray-50", index % 2 === 0 ? "bg-white" : "bg-gray-50")}
                        >
                          <td className="px-6 py-4">{project.name}</td>
                          <td className="px-6 py-4">₹{project.budget.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          <td className="px-6 py-4">₹{project.spent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          <td className="px-6 py-4">₹{project.approvedCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-sm text-gray-500 py-4">No project spending data available.</p>
              )}
            </div>

            {/* Spending by Category */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Approved Spending by Category</h3>
              {chartData.labels.length > 0 ? (
                <ChartErrorBoundary>
                  <Bar
                    data={chartData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: "top", labels: { font: { size: 12 } } },
                        title: { display: true, text: "Approved Spending by Category", font: { size: 16 } },
                        tooltip: {
                          callbacks: {
                            label: (context) =>
                              `₹${context.raw.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
                          },
                        },
                      },
                      scales: {
                        x: {
                          type: "category",
                          grid: { display: false },
                        },
                        y: {
                          type: "linear",
                          beginAtZero: true,
                          ticks: {
                            callback: (value) => `₹${value.toLocaleString("en-IN")}`,
                          },
                        },
                      },
                    }}
                  />
                </ChartErrorBoundary>
              ) : (
                <p className="text-center text-sm text-gray-500 py-4">No approved spending data available.</p>
              )}
            </div>

            {/* Material Transactions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Material Transactions</h3>
                <CSVLink
                  data={transactionsCsv}
                  filename={`material_transactions_${format(new Date(), "yyyy-MM-dd")}.csv`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </CSVLink>
              </div>
              {filteredRequests.length > 0 ? (
                <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full text-sm text-left text-gray-600">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3">Material</th>
                        <th className="px-6 py-3">Project</th>
                        <th className="px-6 py-3">Quantity</th>
                        <th className="px-6 py-3">Unit Price (₹)</th>
                        <th className="px-6 py-3">Total Cost (₹)</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map((request, index) => {
                        const material = materials[request.materialId];
                        const project = projects[request.projectId];
                        return (
                          <tr
                            key={request.id}
                            className={cn("border-b hover:bg-gray-50", index % 2 === 0 ? "bg-white" : "bg-gray-50")}
                          >
                            <td className="px-6 py-4">{request.materialName}</td>
                            <td className="px-6 py-4">{project?.name || "Unknown Project"}</td>
                            <td className="px-6 py-4">{request.quantityRequested} {material?.unitType || "N/A"}</td>
                            <td className="px-6 py-4">₹{(material?.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                            <td className="px-6 py-4">₹{request.totalCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                            <td
                              className={cn(
                                "px-6 py-4 font-medium",
                                request.status === "approved"
                                  ? "text-green-600"
                                  : request.status === "rejected"
                                  ? "text-red-600"
                                  : "text-yellow-600"
                              )}
                            >
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </td>
                            <td className="px-6 py-4">
                              {format(new Date(request.requestedAt), "yyyy-MM-dd")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-sm text-gray-500 py-4">No transactions found.</p>
              )}
            </div>

            {/* Wastage Report */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Wastage Report</h3>
                <CSVLink
                  data={wastageCsv}
                  filename={`wastage_report_${format(new Date(), "yyyy-MM-dd")}.csv`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </CSVLink>
              </div>
              {wastage.length > 0 ? (
                <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full text-sm text-left text-gray-600">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3">Material</th>
                        <th className="px-6 py-3">Requested</th>
                        <th className="px-6 py-3">Consumed</th>
                        <th className="px-6 py-3">Wasted</th>
                        <th className="px-6 py-3">Cost of Wastage (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wastage.map((item, index) => {
                        const wastedQuantity = item.requested - item.consumed;
                        const wastageCost = wastedQuantity * (item.cost / item.requested);
                        return (
                          <tr
                            key={item.materialId}
                            className={cn("border-b hover:bg-gray-50", index % 2 === 0 ? "bg-white" : "bg-gray-50")}
                          >
                            <td className="px-6 py-4">{item.materialName}</td>
                            <td className="px-6 py-4">{item.requested}</td>
                            <td className="px-6 py-4">{item.consumed}</td>
                            <td className="px-6 py-4 flex items-center gap-2">
                              {wastedQuantity}
                              {wastedQuantity > 50 && (
                                <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded">High Wastage</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              ₹{wastageCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-sm text-gray-500 py-4">No wastage found.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MaterialsSpending;
