"use client";
import { useState, useEffect, useMemo } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase";
import { toast } from "sonner";
import {
  Activity, Building2, Calendar, HardHat, MapPin, Users, RefreshCcw, Search, X, ChevronDown, ChevronUp, IndianRupee, AlertCircle, CheckCircle, Clock
} from "lucide-react";
import dynamic from "next/dynamic";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardMap } from "@/components/dashboard/dashboard-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Dynamically import Radix UI components
const Select = dynamic(() => import("@radix-ui/react-select").then((mod) => mod.Select), { ssr: false });
const SelectTrigger = dynamic(() => import("@radix-ui/react-select").then((mod) => mod.SelectTrigger), { ssr: false });
const SelectValue = dynamic(() => import("@radix-ui/react-select").then((mod) => mod.SelectValue), { ssr: false });
const SelectContent = dynamic(() => import("@radix-ui/react-select").then((mod) => mod.SelectContent), { ssr: false });
const SelectItem = dynamic(() => import("@radix-ui/react-select").then((mod) => mod.SelectItem), { ssr: false });
const SelectScrollUpButton = dynamic(() => import("@radix-ui/react-select").then((mod) => mod.SelectScrollUpButton), { ssr: false });
const SelectScrollDownButton = dynamic(() => import("@radix-ui/react-select").then((mod) => mod.SelectScrollDownButton), { ssr: false });
interface DashboardStats {
  activeProjects: number;
  totalEmployees: number;
  sitesWithActiveWorkers: number;
  pendingMaterialRequests: number;
}
interface User {
  uid: string;
  username: string;
  name: string;
  role: string;
  loggedIn: boolean;
}
interface Project {
  projectId: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  status: "ongoing" | "hold" | "completed";
  progress: number;
  employees: { username: string; role: string }[];
  createdAt: number;
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
}
interface Material {
  id: string;
  name: string;
  price: number;
  category: string;
  quantity: number;
}
// Notification Component
const Notification: React.FC<{ message: string; type: "success" | "error"; onClose: () => void }> = ({ message, type, onClose }) => {
  return (
    <div
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 p-4 rounded-xl shadow-2xl transition-all duration-300 animate-slide-in max-w-md backdrop-blur-sm ${
        type === "error" ? "bg-red-50/80 text-red-800 border-l-4 border-red-600" : "bg-green-50/80 text-green-800 border-l-4 border-green-600"
      }`}
    >
      {type === "error" ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-auto">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    activeProjects: 0,
    totalEmployees: 0,
    sitesWithActiveWorkers: 0,
    pendingMaterialRequests: 0,
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [materials, setMaterials] = useState<{ [key: string]: Material }>({});
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [yearFilter, setYearFilter] = useState<string>("");
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Fetch Data from Firebase
  useEffect(() => {
    const fetchDashboardData = () => {
      try {
        setIsLoading(true);
        // Fetch Users
        const usersRef = ref(database, "users");
        onValue(
          usersRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const usersData = snapshot.val();
              const usersList = Object.keys(usersData)
                .map((uid) => ({
                  uid,
                  name: usersData[uid].name || "",
                  username: usersData[uid].username || "",
                  role: usersData[uid].role || "Worker",
                  loggedIn: usersData[uid].loggedIn || false,
                }))
                .filter((user) => user.name && user.name.trim() !== "" && user.username && user.username.trim() !== "");
              setUsers(usersList);
              const totalEmployees = usersList.length;
              const sitesWithActiveWorkers = usersList.filter((user) => user.loggedIn === true).length;
              setStats((prev) => ({
                ...prev,
                totalEmployees,
                sitesWithActiveWorkers,
              }));
            } else {
              toast.error("No user data found");
              setUsers([]);
              setStats((prev) => ({
                ...prev,
                totalEmployees: 0,
                sitesWithActiveWorkers: 0,
              }));
            }
          },
          (err) => {
            console.error("Error fetching user data:", err);
            toast.error("Failed to load user data");
            setIsLoading(false);
          }
        );
        // Fetch Projects
        const projectsRef = ref(database, "projects");
        onValue(
          projectsRef,
          (snapshot) => {
            try {
              if (snapshot.exists()) {
                const projectsData = snapshot.val();
                const projectsList = Object.entries(projectsData).map(([id, project]: [string, any]) => ({
                  projectId: id,
                  name: project.name || "",
                  location: project.location || "",
                  startDate: project.startDate || "",
                  endDate: project.endDate || "",
                  budget: project.budget || 0,
                  spent: project.spent || 0,
                  status: project.status || "ongoing",
                  progress: project.progress || 0,
                  employees: project.employees || [],
                  createdAt: project.createdAt || Date.now(),
                }));
                setProjects(projectsList);
                applyFilters(projectsList, statusFilter, searchQuery, monthFilter, yearFilter);
                setStats((prev) => ({
                  ...prev,
                  activeProjects: projectsList.filter((p: Project) => p.status === "ongoing").length,
                }));
              } else {
                setProjects([]);
                setFilteredProjects([]);
                setStats((prev) => ({
                  ...prev,
                  activeProjects: 0,
                }));
              }
            } catch (err) {
              console.error("Error fetching projects:", err);
              setNotification({ message: "Failed to load projects", type: "error" });
            }
          },
          (err) => {
            console.error("Firebase projects listener error:", err);
            setNotification({ message: "Failed to listen for projects", type: "error" });
            setIsLoading(false);
          }
        );
        // Fetch Material Requests
        const requestsRef = ref(database, "material_requests");
        onValue(
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
                username: requestsData[id].username || "",
                status: requestsData[id].status || "pending",
                requestedAt: requestsData[id].requestedAt || 0,
                respondedAt: requestsData[id].respondedAt || 0,
                responseMessage: requestsData[id].responseMessage || "",
              }));
              setMaterialRequests(requestsList);
              setStats((prev) => ({
                ...prev,
                pendingMaterialRequests: requestsList.filter((r) => r.status === "pending").length,
              }));
            } else {
              setMaterialRequests([]);
              setStats((prev) => ({
                ...prev,
                pendingMaterialRequests: 0,
              }));
            }
            setIsLoading(false);
          },
          (err) => {
            console.error("Error fetching material requests:", err);
            toast.error("Failed to load material requests");
            setIsLoading(false);
          }
        );
        // Fetch Materials
        const materialsRef = ref(database, "materials");
        onValue(
          materialsRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const materialsData = snapshot.val();
              const materialsMap: { [key: string]: Material } = {};
              Object.keys(materialsData).forEach((id) => {
                materialsMap[id] = {
                  id,
                  name: materialsData[id].name || "",
                  price: materialsData[id].price || 0,
                  category: materialsData[id].category || "",
                  quantity: materialsData[id].quantity || 0,
                };
              });
              setMaterials(materialsMap);
            }
          },
          (err) => {
            console.error("Error fetching materials:", err);
            toast.error("Failed to load materials");
          }
        );
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);
  // Clear Notification After 3 Seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  // Apply Filters for Projects
  const applyFilters = (projectsList: Project[], status: string, query: string, month: string, year: string) => {
    let filtered = [...projectsList];
    if (status !== "all") {
      filtered = filtered.filter((project) => project.status === status);
    }
    if (query) {
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(query.toLowerCase()) ||
          project.location.toLowerCase().includes(query.toLowerCase())
      );
    }
    if (month || year) {
      filtered = filtered.filter((project) => {
        const projectDate = new Date(project.startDate);
        const projectMonth = (projectDate.getMonth() + 1).toString().padStart(2, "0");
        const projectYear = projectDate.getFullYear().toString();
        const monthMatch = month ? projectMonth === month : true;
        const yearMatch = year ? projectYear === year : true;
        return monthMatch && yearMatch;
      });
    }
    setFilteredProjects(filtered);
  };
  // Calculate Material Metrics
  const materialMetrics = useMemo(() => {
    // Approved
    const approvedSpending = materialRequests
      .filter((r) => r.status === "approved")
      .reduce((sum, r) => sum + ((materials[r.materialId]?.price || 0) * r.quantityRequested), 0);
    // Pending
    const pendingSpending = materialRequests
      .filter((r) => r.status === "pending")
      .reduce((sum, r) => sum + ((materials[r.materialId]?.price || 0) * r.quantityRequested), 0);
    // Rejected
    const rejectedSpending = materialRequests
      .filter((r) => r.status === "rejected")
      .reduce((sum, r) => sum + ((materials[r.materialId]?.price || 0) * r.quantityRequested), 0);
    // Current Stock Value
    const holdingStock = Object.values(materials).reduce(
      (sum, m) => sum + (m.price * m.quantity), 0
    );
    // Wastage Calculation
    const wastageMap = {};
    materialRequests
      .filter((r) => r.status === "approved")
      .forEach((r) => {
        const materialId = r.materialId;
        if (!wastageMap[materialId]) {
          wastageMap[materialId] = {
            materialName: r.materialName,
            requested: 0,
            available: materials[materialId]?.quantity || 0,
            cost: 0,
          };
        }
        wastageMap[materialId].requested += r.quantityRequested;
        wastageMap[materialId].cost += (materials[materialId]?.price || 0) * r.quantityRequested;
      });
    const wastage = Object.values(wastageMap).map((item) => ({
      materialName: item.materialName,
      wasted: item.requested > item.available ? item.requested - item.available : 0,
      cost: item.requested > item.available
        ? (item.requested - item.available) * (item.cost / item.requested)
        : 0,
    }));
    const totalWastageCost = wastage.reduce((sum, w) => sum + w.cost, 0);
    return {
      approvedSpending,
      pendingSpending,
      rejectedSpending,
      holdingStock,
      wastage,
      totalWastageCost,
    };
  }, [materialRequests, materials]);
  // Chart Data for Analytics
  const spendingChartData = [
    { name: "Approved", value: materialMetrics.approvedSpending, fill: "#22c55e" },
    { name: "Pending", value: materialMetrics.pendingSpending, fill: "#facc15" },
    { name: "Rejected", value: materialMetrics.rejectedSpending, fill: "#ef4444" },
  ];
  const holdingChartData = Object.values(materials).map((m) => ({
    name: m.name,
    value: m.price * m.quantity,
    fill: "#3b82f6",
  }));
  const wastageChartData = materialMetrics.wastage
    .filter((w) => w.wasted > 0)
    .map((w) => ({
      name: w.materialName,
      value: w.cost,
      fill: "#f43f5e",
    }));
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString().padStart(2, "0"),
    label: new Date(0, i).toLocaleString("default", { month: "long" }),
  }));
  const years = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - 5 + i;
    return { value: year.toString(), label: year.toString() };
  });
  // Calculate days until deadline
  const getDaysUntilDeadline = (endDate: string) => {
    const today = new Date();
    const deadline = new Date(endDate);
    const diffTime = deadline.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <style jsx global>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .animate-slide-up { animation: slide-up 0.4s ease-out; }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .animate-pulse-glow { animation: pulse 1.5s infinite; }
        .glass-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 animate-fade-in">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
          Dashboard
        </h1>
        <div className="flex items-center gap-3 text-sm text-gray-600 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
          <Calendar className="h-5 w-5 text-indigo-500" />
          <span>{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</span>
        </div>
      </div>
      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="glass-card shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-800">Active Projects</CardTitle>
            <Building2 className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {isLoading ? <div className="h-8 w-16 animate-pulse rounded bg-gray-200"></div> : stats.activeProjects}
            </div>
            <div className="text-xs text-gray-600 mt-1">+2.5% from last month</div>
          </CardContent>
        </Card>
        <Card className="glass-card shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-800">Total Employees</CardTitle>
            <Users className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {isLoading ? <div className="h-8 w-16 animate-pulse rounded bg-gray-200"></div> : stats.totalEmployees}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {isLoading ? (
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
              ) : (
                `+${stats.totalEmployees - 138} new this month`
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-800">Sites with Active Workers</CardTitle>
            <HardHat className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {isLoading ? <div className="h-8 w-16 animate-pulse rounded bg-gray-200"></div> : stats.sitesWithActiveWorkers}
            </div>
            <div className="text-xs text-gray-600 mt-1">Active across regions</div>
          </CardContent>
        </Card>
        <Card className="glass-card shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-800">Pending Material Requests</CardTitle>
            <IndianRupee className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {isLoading ? <div className="h-8 w-16 animate-pulse rounded bg-gray-200"></div> : stats.pendingMaterialRequests}
            </div>
            <div className="text-xs text-gray-600 mt-1">Awaiting approval</div>
          </CardContent>
        </Card>
      </div>
      {/* Material Spending Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="glass-card shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-800 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {isLoading ? (
                <div className="h-8 w-24 animate-pulse rounded bg-gray-200"></div>
              ) : (
                `₹${materialMetrics.approvedSpending.toLocaleString("en-IN")}`
              )}
            </div>
            <div className="text-xs text-gray-600 mt-1">Material Approved</div>
          </CardContent>
        </Card>
        <Card className="glass-card shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-yellow-400">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-800 flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {isLoading ? (
                <div className="h-8 w-24 animate-pulse rounded bg-gray-200"></div>
              ) : (
                `₹${materialMetrics.pendingSpending.toLocaleString("en-IN")}`
              )}
            </div>
            <div className="text-xs text-gray-600 mt-1">Material Pending</div>
          </CardContent>
        </Card>
        <Card className="glass-card shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Declined
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {isLoading ? (
                <div className="h-8 w-24 animate-pulse rounded bg-gray-200"></div>
              ) : (
                `₹${materialMetrics.rejectedSpending.toLocaleString("en-IN")}`
              )}
            </div>
            <div className="text-xs text-gray-600 mt-1">Material Declined</div>
          </CardContent>
        </Card>
      </div>
      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex flex-wrap bg-white/80 backdrop-blur-sm p-2 rounded-xl shadow-md">
          <TabsTrigger value="overview" className="px-4 py-2 text-sm font-medium text-gray-800 hover:bg-indigo-50 rounded-lg">
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="px-4 py-2 text-sm font-medium text-gray-800 hover:bg-indigo-50 rounded-lg">
            Analytics
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          {/* Projects Overview Header */}
          <div className="bg-gradient-to-r from-indigo-800 to-purple-800 p-6 rounded-2xl shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <h2 className="text-2xl font-bold text-white">Projects Overview</h2>
              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    setStatusFilter("all");
                    setSearchQuery("");
                    setMonthFilter("");
                    setYearFilter("");
                    setNotification({ message: "Filters reset", type: "success" });
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium h-10 px-4 py-2 bg-white text-indigo-800 hover:bg-gray-100 shadow-md transition-all"
                >
                  <RefreshCcw className="h-5 w-5" />
                  Reset Filters
                </Button>
              </div>
            </div>
          </div>
          {/* Filters */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
              
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-36">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                    <select
                      value={monthFilter}
                      onChange={(e) => setMonthFilter(e.target.value)}
                      className="w-full rounded-lg border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all sm:text-sm"
                    >
                      <option value="">All Months</option>
                      {months.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-28">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <select
                      value={yearFilter}
                      onChange={(e) => setYearFilter(e.target.value)}
                      className="w-full rounded-lg border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all sm:text-sm"
                    >
                      <option value="">All Years</option>
                      {years.map((year) => (
                        <option key={year.value} value={year.value}>
                          {year.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search projects..."
                    className="pl-10 w-full rounded-lg border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Overview Grid */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
            <Card className="lg:col-span-4 glass-card shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">Project Summary</CardTitle>
                <CardDescription className="text-sm text-gray-600">Project distribution by status and progress</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={filteredProjects}>
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                    <YAxis label={{ value: "Progress (%)", angle: -90, position: "insideLeft", fontSize: 14 }} domain={[0, 100]} />
                    <Tooltip formatter={(value: number) => `${value}%`} />
                    <Bar dataKey="progress" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="lg:col-span-3 glass-card shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">Active Sites</CardTitle>
                <CardDescription className="text-sm text-gray-600">Live view of all branches with active workers</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] pl-2">
                <DashboardMap />
              </CardContent>
            </Card>
          </div>
          {/* Upcoming Deadlines */}
          <Card className="glass-card shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">Upcoming Deadlines</CardTitle>
              <CardDescription className="text-sm text-gray-600">Projects due in the next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-gray-100 rounded-lg animate-pulse">
                      <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-32 rounded bg-gray-200"></div>
                        <div className="h-3 w-24 rounded bg-gray-200"></div>
                      </div>
                    </div>
                  ))
                ) : filteredProjects
                    .filter(
                      (project) =>
                        project.endDate &&
                        new Date(project.endDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    )
                    .slice(0, 3)
                    .map((project, index) => {
                      const daysUntil = getDaysUntilDeadline(project.endDate);
                      const isOverdue = daysUntil < 0;
                      const isUrgent = !isOverdue && daysUntil <= 3;
                      return (
                        <div
                          key={index}
                          className={`relative flex items-center gap-4 p-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] ${
                            isOverdue || isUrgent
                              ? "bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 animate-pulse-glow"
                              : "bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500"
                          }`}
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                            <Building2 className="h-6 w-6 text-indigo-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{project.name}</p>
                            <p className="text-sm text-gray-600">
                              Due {new Date(project.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className={`h-5 w-5 ${isOverdue || isUrgent ? "text-red-600" : "text-indigo-600"}`} />
                            <span
                              className={`text-sm font-semibold px-3 py-1 rounded-full ${
                                isOverdue || isUrgent ? "bg-red-500 text-white" : "bg-indigo-500 text-white"
                              }`}
                            >
                              {isOverdue
                                ? `Due date crossed ${Math.abs(daysUntil)} ${Math.abs(daysUntil) === 1 ? "day" : "days"} ago`
                                : `${daysUntil} ${daysUntil === 1 ? "Day" : "Days"} Left`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                {filteredProjects.filter(
                  (project) =>
                    project.endDate &&
                    new Date(project.endDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                ).length === 0 && !isLoading && (
                  <div className="flex h-32 items-center justify-center text-gray-600 text-sm">
                    No upcoming deadlines in the next 7 days
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <Card className="glass-card shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">Material Spending Status</CardTitle>
                <CardDescription className="text-sm text-gray-600">Total spending across request statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={spendingChartData}>
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis label={{ value: "Amount (₹)", angle: -90, position: "insideLeft", fontSize: 14 }} />
                    <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="glass-card shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">Material Holding Stock</CardTitle>
                <CardDescription className="text-sm text-gray-600">Value of current material inventory</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={holdingChartData}>
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                    <YAxis label={{ value: "Value (₹)", angle: -90, position: "insideLeft", fontSize: 14 }} />
                    <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <Card className="glass-card shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">Material Wastage</CardTitle>
              <CardDescription className="text-sm text-gray-600">Cost of unconsumed approved materials</CardDescription>
            </CardHeader>
            <CardContent>
              {wastageChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={wastageChartData}>
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                    <YAxis label={{ value: "Cost (₹)", angle: -90, position: "insideLeft", fontSize: 14 }} />
                    <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-gray-600 text-sm">
                  No wastage detected
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
