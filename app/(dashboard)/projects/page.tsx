"use client";
import React, { useState, useEffect } from "react";
import { ref, onValue, set, push, remove } from "firebase/database";
import { database } from "@/lib/firebase";
import {
  Plus, RefreshCw, Search, Building2, X, Calendar, AlertCircle, CheckCircle, Edit, Trash2, Users, IndianRupee
} from "lucide-react";
import dynamic from "next/dynamic";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Dynamically import Radix UI components
const Select = dynamic(() => import("@radix-ui/react-select").then((mod) => mod.Root), { ssr: false });
const SelectGroup = dynamic(() => import("@radix-ui/react-select").then((mod) => mod.Group), { ssr: false });
const SelectValue = dynamic(() => import("@radix-ui/react-select").then((mod) => mod.Value), { ssr: false });
const SelectTrigger = dynamic(() => import("@radix-ui/react-select").then((mod) => mod.Trigger), { ssr: false });
const SelectContent = dynamic(() => import("@radix-ui/react-select").then((mod) => mod.Content), { ssr: false });
const SelectItem = dynamic(() => import("@radix-ui/react-select").then((mod) => mod.Item), { ssr: false });
const SelectScrollUpButton = dynamic(() => import("@radix-ui/react-select").then((mod) => mod.ScrollUpButton), { ssr: false });
const SelectScrollDownButton = dynamic(() => import("@radix-ui/react-select").then((mod) => mod.ScrollDownButton), { ssr: false });
const ChevronDownIcon = dynamic(() => import("lucide-react").then((mod) => mod.ChevronDown), { ssr: false });
const ChevronUpIcon = dynamic(() => import("lucide-react").then((mod) => mod.ChevronUp), { ssr: false });

// UI Components from Shadcn
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Types
interface User {
  username: string;
  name: string;
  role: string;
}

interface ProjectEmployee {
  username: string;
  role: string;
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
  employees: ProjectEmployee[];
  createdAt: number;
}

// Notification Component
const Notification: React.FC<{ message: string; type: "success" | "error"; onClose: () => void }> = ({ message, type, onClose }) => {
  return (
    <div
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 p-4 rounded-xl shadow-2xl transition-all duration-300 animate-slide-in max-w-md ${
        type === "error" ? "bg-red-50 text-red-800 border-l-4 border-red-600" : "bg-green-50 text-green-800 border-l-4 border-green-600"
      }`}
    >
      {type === "error" ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
      <span className="text-base font-medium">{message}</span>
      <button onClick={onClose} className="ml-auto">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// Project Form Component
const ProjectForm: React.FC<{
  project?: Project | null;
  users: User[];
  onSave: (project: Project) => void;
  onCancel: () => void;
}> = ({ project, users, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Project>({
    projectId: project?.projectId || "",
    name: project?.name || "",
    location: project?.location || "",
    startDate: project?.startDate || new Date().toISOString().split("T")[0],
    endDate: project?.endDate || "",
    budget: project?.budget || 0,
    spent: 0, // Default spent value to 0
    status: project?.status || "ongoing",
    progress: project?.progress || 0,
    employees: project?.employees || [],
    createdAt: project?.createdAt || Date.now(),
  });

  const [selectedEmployee, setSelectedEmployee] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "budget" || name === "progress" ? parseFloat(value) || 0 : value,
    }));
  };

  const addEmployee = () => {
    if (!selectedEmployee) {
      toast.error("Please select an employee");
      return;
    }
    const user = users.find((u) => u.username === selectedEmployee);
    if (!user) {
      toast.error("Selected employee not found");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      employees: [...prev.employees, { username: selectedEmployee, role: user.role }],
    }));
    setSelectedEmployee("");
  };

  const removeEmployee = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      employees: prev.employees.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name ||
      !formData.location ||
      !formData.startDate ||
      !formData.budget ||
      formData.progress < 0 ||
      formData.progress > 100
    ) {
      toast.error("Please fill all required fields and ensure progress is between 0-100");
      return;
    }
    onSave(formData);
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Project Details */}
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Project Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-lg border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all text-sm py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full rounded-lg border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all text-sm py-2"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <div className="relative">
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all text-sm py-2 pl-8"
                required
              />
              <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <div className="relative">
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all text-sm py-2 pl-8"
              />
              <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Budget and Progress */}
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Budget and Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget (₹)</label>
            <input
              type="number"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              className="w-full rounded-lg border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all text-sm py-2"
              min="0"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Progress (%)</label>
            <input
              type="number"
              name="progress"
              value={formData.progress}
              onChange={handleChange}
              className="w-full rounded-lg border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all text-sm py-2"
              min="0"
              max="100"
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full rounded-lg border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all text-sm py-2"
          >
            <option value="ongoing">Ongoing</option>
            <option value="hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Employees Section */}
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Assign Employees</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full rounded-lg border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all text-sm py-2"
            >
              <option value="">Select Employee</option>
              {users.map((user) => (
                <option key={user.username} value={user.username}>
                  {user.name} ({user.username} - {user.role})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={addEmployee}
              className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium h-10 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transition-all"
            >
              Add Employee
            </button>
          </div>
        </div>
        {formData.employees.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Assigned Employees:</h4>
            {formData.employees.map((emp, index) => (
              <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg shadow-sm">
                <span className="text-sm text-gray-600">
                  {emp.username} - {emp.role}
                </span>
                <button
                  type="button"
                  onClick={() => removeEmployee(index)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <DialogFooter className="flex justify-end space-x-3 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="text-sm font-medium h-10 px-4 py-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-100 shadow-sm transition-all"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="text-sm font-medium h-10 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md transition-all"
        >
          {project ? "Update Project" : "Create Project"}
        </Button>
      </DialogFooter>
    </form>
  );
};

// Project Card Component
const ProjectCard: React.FC<{
  project: Project;
  users: User[];
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
}> = ({ project, users, onEdit, onDelete }) => {
  const formatDate = (date: string) => {
    return date ? new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A";
  };

  const getEmployeeName = (username: string) => {
    const user = users.find((u) => u.username === username);
    return user ? user.name : username;
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-2xl border-l-4 border-indigo-600 animate-slide-up">
      <div className="relative h-48 bg-gradient-to-r from-indigo-100 to-purple-100">
        <div className="flex h-full items-center justify-center">
          <Building2 className="h-16 w-16 text-indigo-600" />
        </div>
        <div className="absolute bottom-2 right-2">
          <Badge
            className={`text-base font-semibold px-3 py-1 rounded-full ${
              project.status === "ongoing"
                ? "bg-green-100 text-green-800"
                : project.status === "hold"
                ? "bg-amber-100 text-amber-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </Badge>
        </div>
      </div>
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">{project.name}</CardTitle>
        <CardDescription className="text-base text-gray-600">{project.location}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 text-base">
          <div className="flex justify-between">
            <span className="text-gray-600">Budget:</span>
            <span className="font-medium">₹{project.budget.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Progress:</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-3 bg-gray-200" indicatorColor="bg-indigo-600" />
          <div className="flex justify-between">
            <span className="text-gray-600">Start Date:</span>
            <span className="font-medium">{formatDate(project.startDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">End Date:</span>
            <span className="font-medium">{project.endDate ? formatDate(project.endDate) : "Not set"}</span>
          </div>
        </div>
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-5 w-5 text-gray-600" />
            <span className="text-base font-medium text-gray-700">Assigned Employees:</span>
          </div>
          {project.employees.length > 0 ? (
            <div className="space-y-3">
              {project.employees.map((emp, index) => (
                <div key={index} className="flex justify-between text-base text-gray-600">
                  <span>{getEmployeeName(emp.username)}</span>
                  <span>{emp.role}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-base text-gray-500">No employees assigned</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t bg-gray-50 px-6 py-4 flex justify-between">
        <Button
          variant="outline"
          size="lg"
          onClick={() => onEdit(project)}
          className="text-yellow-600 hover:text-yellow-700 border-yellow-600 hover:border-yellow-700 text-base"
        >
          <Edit className="h-5 w-5 mr-2" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => onDelete(project.projectId)}
          className="text-red-600 hover:text-red-700 border-red-600 hover:border-red-700 text-base"
        >
          <Trash2 className="h-5 w-5 mr-2" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

// Main Projects Page Component
const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [yearFilter, setYearFilter] = useState<string>("");
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Analytics State
  const [totalProjects, setTotalProjects] = useState(0);
  const [ongoingProjects, setOngoingProjects] = useState(0);
  const [completedProjects, setCompletedProjects] = useState(0);
  const [onHoldProjects, setOnHoldProjects] = useState(0);
  const [totalBudget, setTotalBudget] = useState(0);

  // Fetch Users
  useEffect(() => {
    const usersRef = ref(database, "users");
    const unsubscribeUsers = onValue(
      usersRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const usersData = snapshot.val();
            const usersList = Object.keys(usersData)
              .map((uid) => ({
                uid,
                name: usersData[uid].name || "",
                username: usersData[uid].username || "",
                role: usersData[uid].role || "Worker",
              }))
              .filter((user) => user.name && user.name.trim() !== "" && user.username && user.username.trim() !== "");
            setUsers(usersList);
          } else {
            setUsers([]);
          }
        } catch (err) {
          console.error("Error fetching users:", err);
          setNotification({ message: "Failed to load users", type: "error" });
        }
      },
      (err) => {
        console.error("Firebase users listener error:", err);
        setNotification({ message: "Failed to listen for users", type: "error" });
      }
    );

    return () => unsubscribeUsers();
  }, []);

  // Fetch Projects
  useEffect(() => {
    setIsLoading(true);
    const projectsRef = ref(database, "projects");
    const unsubscribeProjects = onValue(
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

            // Calculate Analytics
            const totalProjectsCount = projectsList.length;
            const ongoingCount = projectsList.filter((p: Project) => p.status === "ongoing").length;
            const completedCount = projectsList.filter((p: Project) => p.status === "completed").length;
            const onHoldCount = projectsList.filter((p: Project) => p.status === "hold").length;
            const totalBudgetAmount = projectsList.reduce((sum: number, p: Project) => sum + p.budget, 0);

            setTotalProjects(totalProjectsCount);
            setOngoingProjects(ongoingCount);
            setCompletedProjects(completedCount);
            setOnHoldProjects(onHoldCount);
            setTotalBudget(totalBudgetAmount);
          } else {
            setProjects([]);
            setFilteredProjects([]);
            setTotalProjects(0);
            setOngoingProjects(0);
            setCompletedProjects(0);
            setOnHoldProjects(0);
            setTotalBudget(0);
          }
          setIsLoading(false);
        } catch (err) {
          console.error("Error fetching projects:", err);
          setNotification({ message: "Failed to load projects", type: "error" });
          setIsLoading(false);
        }
      },
      (err) => {
        console.error("Firebase projects listener error:", err);
        setNotification({ message: "Failed to listen for projects", type: "error" });
        setIsLoading(false);
      }
    );

    return () => unsubscribeProjects();
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

  // Apply Filters
  useEffect(() => {
    applyFilters(projects, statusFilter, searchQuery, monthFilter, yearFilter);
  }, [projects, statusFilter, searchQuery, monthFilter, yearFilter]);

  const applyFilters = (projectsList: Project[], status: string, query: string, month: string, year: string) => {
    let filtered = [...projectsList];

    // Filter by status
    if (status !== "all") {
      filtered = filtered.filter((project) => project.status === status);
    }

    // Filter by search query
    if (query) {
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(query.toLowerCase()) ||
          project.location.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Filter by month and year
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

  const getProjectsByStatus = (status: string) => {
    return filteredProjects.filter((project) => project.status === status);
  };

  const handleCreateProject = () => {
    setEditingProject(null);
    setIsFormOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingProject(null);
  };

  const handleSaveProject = async (project: Project) => {
    const projectsRef = ref(database, "projects");
    const projectMembersRef = ref(database, "projectmembers");
    try {
      let newProject: Project;
      let oldEmployees: ProjectEmployee[] = [];

      if (project.projectId) {
        // Edit existing project
        const projectRef = ref(database, `projects/${project.projectId}`);
        oldEmployees = projects.find((p) => p.projectId === project.projectId)?.employees || [];
        await set(projectRef, { ...project, createdAt: project.createdAt || Date.now() });
        setProjects((prev) =>
          prev.map((p) => (p.projectId === project.projectId ? project : p))
        );
        newProject = project;
        setNotification({ message: "Project updated successfully", type: "success" });
      } else {
        // Create new project
        const newProjectRef = push(projectsRef);
        newProject = { ...project, projectId: newProjectRef.key!, createdAt: Date.now() };
        await set(newProjectRef, newProject);
        setProjects((prev) => [...prev, newProject]);
        setNotification({ message: "Project created successfully", type: "success" });
      }

      // Update projectmembers table
      // Remove entries for employees no longer in the project
      const currentUsernames = newProject.employees.map((emp) => emp.username);
      for (const oldEmp of oldEmployees) {
        if (!currentUsernames.includes(oldEmp.username)) {
          const memberRef = ref(database, `projectmembers/${oldEmp.username}/${newProject.projectId}`);
          await remove(memberRef);
        }
      }

      // Add or update entries for current employees
      for (const employee of newProject.employees) {
        const memberRef = ref(database, `projectmembers/${employee.username}/${newProject.projectId}`);
        await set(memberRef, {
          projectName: newProject.name,
          projectId: newProject.projectId,
        });
      }

      handleCancelForm();
    } catch (err) {
      console.error("Error saving project:", err);
      setNotification({ message: "Failed to save project", type: "error" });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const projectRef = ref(database, `projects/${projectId}`);
    try {
      const project = projects.find((p) => p.projectId === projectId);
      if (project) {
        // Remove all projectmembers entries for this project
        for (const employee of project.employees) {
          const memberRef = ref(database, `projectmembers/${employee.username}/${projectId}`);
          await remove(memberRef);
        }
      }

      // Delete the project
      await remove(projectRef);
      setProjects((prev) => prev.filter((p) => p.projectId !== projectId));
      setNotification({ message: "Project deleted successfully", type: "success" });
    } catch (err) {
      console.error("Error deleting project:", err);
      setNotification({ message: "Failed to delete project", type: "error" });
    }
  };

  // Generate month and year options for filtering
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString().padStart(2, "0"),
    label: new Date(0, i).toLocaleString("default", { month: "long" }),
  }));
  const years = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - 5 + i;
    return { value: year.toString(), label: year.toString() };
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
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
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .animate-slide-up { animation: slide-up 0.4s ease-out; }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
      `}</style>

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-12 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <h1 className="text-5xl font-extrabold text-white tracking-tight animate-fade-in">
              Projects Dashboard
            </h1>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleCreateProject}
                className="inline-flex items-center justify-center gap-2 rounded-lg text-base font-medium h-12 px-6 py-2 bg-white text-indigo-900 hover:bg-gray-100 shadow-lg transition-all"
              >
                <Plus className="h-5 w-5" />
                Create Project
              </button>
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setSearchQuery("");
                  setMonthFilter("");
                  setYearFilter("");
                  setNotification({ message: "Filters reset", type: "success" });
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg text-base font-medium h-12 px-6 py-2 bg-white text-indigo-900 hover:bg-gray-100 shadow-lg transition-all"
              >
                <RefreshCw className="h-5 w-5" />
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {/* Total Projects */}
          <div className="bg-white rounded-2xl shadow-md p-5 sm:p-6 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Total Projects</h3>
            <p className="text-3xl sm:text-4xl font-bold text-indigo-600 mt-2">{totalProjects}</p>
          </div>

          {/* Ongoing */}
          <div className="bg-white rounded-2xl shadow-md p-5 sm:p-6 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Ongoing</h3>
            <p className="text-3xl sm:text-4xl font-bold text-green-600 mt-2">{ongoingProjects}</p>
          </div>

          {/* Completed */}
          <div className="bg-white rounded-2xl shadow-md p-5 sm:p-6 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Completed</h3>
            <p className="text-3xl sm:text-4xl font-bold text-blue-600 mt-2">{completedProjects}</p>
          </div>

          {/* On Hold */}
          <div className="bg-white rounded-2xl shadow-md p-5 sm:p-6 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800">On Hold</h3>
            <p className="text-3xl sm:text-4xl font-bold text-amber-600 mt-2">{onHoldProjects}</p>
          </div>

          {/* Total Budget */}
          <div className="bg-white rounded-2xl shadow-md p-5 sm:p-6 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Total Budget</h3>
            <p
              className="text-2xl sm:text-3xl font-bold text-indigo-600 mt-2 break-words overflow-hidden text-ellipsis max-w-full px-2 text-center"
              style={{ wordBreak: "break-word", lineHeight: "1.3" }}
            >
              ₹{totalBudget.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Filters Section */}
        <div className="mb-12 bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full md:w-36">
                  <label className="block text-base font-medium text-gray-700 mb-1">Month</label>
                  <select
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="w-full rounded-lg border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all text-base py-3"
                  >
                    <option value="">All Months</option>
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full md:w-28">
                  <label className="block text-base font-medium text-gray-700 mb-1">Year</label>
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="w-full rounded-lg border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all text-base py-3"
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
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search projects..."
                  className="pl-10 w-full rounded-lg border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all text-base py-3"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Project Form Modal */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {editingProject ? "Edit Project" : "Create New Project"}
              </DialogTitle>
            </DialogHeader>
            <ProjectForm
              project={editingProject}
              users={users}
              onSave={handleSaveProject}
              onCancel={handleCancelForm}
            />
          </DialogContent>
        </Dialog>

        {/* Progress Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12 animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Project Progress Overview</h2>
          {filteredProjects.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={filteredProjects}>
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={14} />
                <YAxis label={{ value: "Progress (%)", angle: -90, position: "insideLeft", fontSize: 16 }} domain={[0, 100]} />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Bar dataKey="progress" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed bg-gray-50">
              <Building2 className="h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-xl font-medium text-gray-800">No projects to display</h3>
              <p className="text-base text-gray-500 text-center max-w-md">Add a project to see progress data</p>
            </div>
          )}
        </div>

        {/* Projects List */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="flex-wrap bg-gray-100 p-2 rounded-xl">
            <TabsTrigger value="all" className="px-4 py-2 text-base font-medium">All Projects</TabsTrigger>
            <TabsTrigger value="ongoing" className="px-4 py-2 text-base font-medium">
              Ongoing{" "}
              <Badge variant="outline" className="ml-2 bg-green-50 text-green-700">
                {getProjectsByStatus("ongoing").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="hold" className="px-4 py-2 text-base font-medium">
              On Hold{" "}
              <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700">
                {getProjectsByStatus("hold").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="px-4 py-2 text-base font-medium">
              Completed{" "}
              <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700">
                {getProjectsByStatus("completed").length}
              </Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.projectId}
                    project={project}
                    users={users}
                    onEdit={handleEditProject}
                    onDelete={handleDeleteProject}
                  />
                ))
              ) : (
                <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed bg-gray-50">
                  <Building2 className="h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-xl font-medium text-gray-800">No projects found</h3>
                  <p className="text-base text-gray-500 text-center max-w-md">
                    {searchQuery || monthFilter || yearFilter
                      ? "Try adjusting your filters"
                      : "Get started by creating your first project"}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="ongoing" className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {getProjectsByStatus("ongoing").length > 0 ? (
                getProjectsByStatus("ongoing").map((project) => (
                  <ProjectCard
                    key={project.projectId}
                    project={project}
                    users={users}
                    onEdit={handleEditProject}
                    onDelete={handleDeleteProject}
                  />
                ))
              ) : (
                <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed bg-gray-50">
                  <Building2 className="h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-xl font-medium text-gray-800">No ongoing projects</h3>
                  <p className="text-base text-gray-500 text-center max-w-md">
                    {searchQuery || monthFilter || yearFilter
                      ? "Try adjusting your filters"
                      : "All projects are in progress"}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="hold" className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {getProjectsByStatus("hold").length > 0 ? (
                getProjectsByStatus("hold").map((project) => (
                  <ProjectCard
                    key={project.projectId}
                    project={project}
                    users={users}
                    onEdit={handleEditProject}
                    onDelete={handleDeleteProject}
                  />
                ))
              ) : (
                <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed bg-gray-50">
                  <Building2 className="h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-xl font-medium text-gray-800">No projects on hold</h3>
                  <p className="text-base text-gray-500 text-center max-w-md">
                    {searchQuery || monthFilter || yearFilter
                      ? "Try adjusting your filters"
                      : "All projects are in progress"}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="completed" className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {getProjectsByStatus("completed").length > 0 ? (
                getProjectsByStatus("completed").map((project) => (
                  <ProjectCard
                    key={project.projectId}
                    project={project}
                    users={users}
                    onEdit={handleEditProject}
                    onDelete={handleDeleteProject}
                  />
                ))
              ) : (
                <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed bg-gray-50">
                  <Building2 className="h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-xl font-medium text-gray-800">No completed projects</h3>
                  <p className="text-base text-gray-500 text-center max-w-md">
                    {searchQuery || monthFilter || yearFilter
                      ? "Try adjusting your filters"
                      : "Projects will appear here when completed"}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectsPage;
