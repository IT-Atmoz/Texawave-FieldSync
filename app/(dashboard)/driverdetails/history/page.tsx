"use client";
import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase";
import { User, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";

interface Driver {
  uid: string;
  username: string;
  fullName: string;
  contactNumber?: string;
  licenseNumber?: string;
}
interface Vehicle {
  vehicleId: string;
  vehicleNumber: string;
  type: string;
}
interface Project {
  projectId: string;
  name: string;
  location: string;
  status: string;
}
interface ProjectAssignment {
  id: string;
  driverId: string;
  vehicleId: string;
  projectId: string;
  materials: string[];
  materialRequestId?: string;
  rideAccepted: boolean;
  materialDelivered: boolean;
  deliveryDate: string;
  deliveryTime: string;
}

const History: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectAssignments, setProjectAssignments] = useState<ProjectAssignment[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Available months and years for filtering
  const months = [
    { value: "", label: "All Months" },
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];
  const years = [
    { value: "", label: "All Years" },
    ...Array.from({ length: 5 }, (_, i) => ({
      value: (2025 - i).toString(),
      label: (2025 - i).toString(),
    })),
  ];

  // Fetch Drivers
  useEffect(() => {
    const driversRef = ref(database, "drivers");
    const unsubscribe = onValue(
      driversRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const driversData = snapshot.val();
            const driversList = Object.keys(driversData)
              .filter((uid) => driversData[uid].username && driversData[uid].fullName)
              .map((uid) => ({
                uid,
                username: driversData[uid].username || "",
                fullName: driversData[uid].fullName || "",
                contactNumber: driversData[uid].contactNumber || "",
                licenseNumber: driversData[uid].licenseNumber || "",
              }));
            setDrivers(driversList);
          } else {
            setDrivers([]);
          }
        } catch (err) {
          console.error("Error fetching drivers:", err);
          setNotification({ message: "Failed to load drivers", type: "error" });
        }
      },
      (err) => {
        console.error("Firebase listener error:", err);
        setNotification({ message: "Failed to listen for drivers", type: "error" });
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch Vehicles
  useEffect(() => {
    const vehiclesRef = ref(database, "vehicles");
    const unsubscribe = onValue(
      vehiclesRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const vehiclesData = snapshot.val();
            const vehiclesList = Object.keys(vehiclesData).map((vehicleId) => ({
              vehicleId,
              vehicleNumber: vehiclesData[vehicleId].vehicleNumber || "",
              type: vehiclesData[vehicleId].type || "",
            }));
            setVehicles(vehiclesList);
          } else {
            setVehicles([]);
          }
        } catch (err) {
          console.error("Error fetching vehicles:", err);
          setNotification({ message: "Failed to load vehicles", type: "error" });
        }
      },
      (err) => {
        console.error("Firebase listener error:", err);
        setNotification({ message: "Failed to listen for vehicles", type: "error" });
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch Projects
  useEffect(() => {
    const projectsRef = ref(database, "projects");
    const unsubscribe = onValue(
      projectsRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const projectsData = snapshot.val();
            const projectsList = Object.keys(projectsData).map((projectId) => ({
              projectId,
              name: projectsData[projectId].name || "Unknown",
              location: projectsData[projectId].location || "Unknown",
              status: projectsData[projectId].status || "Unknown",
            }));
            setProjects(projectsList);
          } else {
            setProjects([]);
          }
        } catch (err) {
          console.error("Error fetching projects:", err);
          setNotification({ message: "Failed to load projects", type: "error" });
        }
      },
      (err) => {
        console.error("Firebase listener error:", err);
        setNotification({ message: "Failed to listen for projects", type: "error" });
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch Project Assignments
  useEffect(() => {
    const assignmentsRef = ref(database, "driver_project_assignments");
    const unsubscribe = onValue(
      assignmentsRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const assignmentsData = snapshot.val();
            const assignmentsList = Object.keys(assignmentsData).map((id) => ({
              id,
              driverId: assignmentsData[id].driverId || "",
              vehicleId: assignmentsData[id].vehicleId || "",
              projectId: assignmentsData[id].projectId || "",
              materials: assignmentsData[id].materials || [],
              materialRequestId: assignmentsData[id].materialRequestId || "",
              rideAccepted: assignmentsData[id].rideAccepted || false,
              materialDelivered: assignmentsData[id].materialDelivered || false,
              deliveryDate: assignmentsData[id].deliveryDate || "",
              deliveryTime: assignmentsData[id].deliveryTime || "",
            }));
            setProjectAssignments(assignmentsList);
          } else {
            setProjectAssignments([]);
          }
        } catch (err) {
          console.error("Error fetching project assignments:", err);
          setNotification({ message: "Failed to load project assignments", type: "error" });
        }
      },
      (err) => {
        console.error("Firebase listener error:", err);
        setNotification({ message: "Failed to listen for project assignments", type: "error" });
      }
    );
    return () => unsubscribe();
  }, []);

  // Handle Driver Selection
  const handleDriverChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDriverId(e.target.value);
  };

  // Handle Month Selection
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(e.target.value);
  };

  // Handle Year Selection
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(e.target.value);
  };

  // Filter Assignments
  const filteredAssignments = projectAssignments.filter((assignment) => {
    if (!selectedDriverId) return false;
    if (assignment.driverId !== selectedDriverId) return false;
    if (!selectedMonth && !selectedYear) return true;
    const [assignmentYear, assignmentMonth] = assignment.deliveryDate.split("-");
    if (selectedYear && assignmentYear !== selectedYear) return false;
    if (selectedMonth && assignmentMonth !== selectedMonth) return false;
    return true;
  });

  // Export Selected Driver's History to CSV
  const exportDriverHistoryToCSV = () => {
    if (!selectedDriverId) {
      setNotification({ message: "Please select a driver", type: "error" });
      return;
    }
    const selectedDriver = drivers.find((d) => d.uid === selectedDriverId);
    const headers = [
      "Project",
      "Vehicle",
      "Materials",
      "Delivery Date",
      "Delivery Time",
      "Ride Accepted",
      "Material Delivered",
    ];
    const rows = filteredAssignments.map((assignment) => [
      projects.find((p) => p.projectId === assignment.projectId)?.name || "Unknown",
      vehicles.find((v) => v.vehicleId === assignment.vehicleId)?.vehicleNumber || "Unknown",
      assignment.materials.join("; "),
      assignment.deliveryDate,
      assignment.deliveryTime,
      assignment.rideAccepted ? "Yes" : "No",
      assignment.materialDelivered ? "Yes" : "No",
    ]);
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${selectedDriver?.username || "driver"}_history.csv`);
    setNotification({ message: "Driver history exported successfully", type: "success" });
  };

  // Export All Drivers' History to CSV
  const exportAllHistoryToCSV = () => {
    const headers = [
      "Driver",
      "Project",
      "Vehicle",
      "Materials",
      "Delivery Date",
      "Delivery Time",
      "Ride Accepted",
      "Material Delivered",
    ];
    const rows = projectAssignments.map((assignment) => [
      drivers.find((d) => d.uid === assignment.driverId)?.fullName || "Unknown",
      projects.find((p) => p.projectId === assignment.projectId)?.name || "Unknown",
      vehicles.find((v) => v.vehicleId === assignment.vehicleId)?.vehicleNumber || "Unknown",
      assignment.materials.join("; "),
      assignment.deliveryDate,
      assignment.deliveryTime,
      assignment.rideAccepted ? "Yes" : "No",
      assignment.materialDelivered ? "Yes" : "No",
    ]);
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "all_drivers_history.csv");
    setNotification({ message: "All drivers' history exported successfully", type: "success" });
  };

  // Notification Timeout
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-black dark:text-white mb-8 flex items-center gap-3 animate-fade-in">
          <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          Driver Work History
        </h1>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Driver
              </label>
              <select
                value={selectedDriverId}
                onChange={handleDriverChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400"
              >
                <option value="" className="text-gray-400">
                  Select a driver
                </option>
                {drivers.map((driver) => (
                  <option key={driver.uid} value={driver.uid} className="text-black dark:text-white">
                    {driver.fullName} ({driver.username})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Month
              </label>
              <select
                value={selectedMonth}
                onChange={handleMonthChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400"
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value} className="text-black dark:text-white">
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Year
              </label>
              <select
                value={selectedYear}
                onChange={handleYearChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400"
              >
                {years.map((year) => (
                  <option key={year.value} value={year.value} className="text-black dark:text-white">
                    {year.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Button
              onClick={exportDriverHistoryToCSV}
              className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
              disabled={!selectedDriverId}
            >
              <FileText className="h-5 w-5 mr-2" /> Export Driver History
            </Button>
            <Button
              onClick={exportAllHistoryToCSV}
              className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
            >
              <FileText className="h-5 w-5 mr-2" /> Export All History
            </Button>
          </div>
        </div>

        {/* Driver History Table */}
        {selectedDriverId && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700 animate-fade-in">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4 flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              {drivers.find((d) => d.uid === selectedDriverId)?.fullName || "Driver"}'s Work History
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {[
                      "Project",
                      "Vehicle",
                      "Materials",
                      "Delivery Date",
                      "Delivery Time",
                      "Ride Accepted",
                      "Material Delivered",
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAssignments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">
                        No assignments found
                      </td>
                    </tr>
                  ) : (
                    filteredAssignments.map((assignment) => (
                      <tr key={assignment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-4 whitespace-nowrap text-black dark:text-white">
                          {projects.find((p) => p.projectId === assignment.projectId)?.name || "Unknown"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-black dark:text-white">
                          {vehicles.find((v) => v.vehicleId === assignment.vehicleId)?.vehicleNumber || "Unknown"} (
                          {vehicles.find((v) => v.vehicleId === assignment.vehicleId)?.type || "Unknown"})
                        </td>
                        <td className="px-4 py-4 text-black dark:text-white">
                          {assignment.materials.join(", ")}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-black dark:text-white">
                          {assignment.deliveryDate}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-black dark:text-white">
                          {assignment.deliveryTime}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={cn(
                              "px-3 py-1 rounded-full text-sm font-medium",
                              assignment.rideAccepted
                                ? "bg-green-500 text-white"
                                : "bg-red-500 text-white"
                            )}
                          >
                            {assignment.rideAccepted ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={cn(
                              "px-3 py-1 rounded-full text-sm font-medium",
                              assignment.materialDelivered
                                ? "bg-green-500 text-white"
                                : "bg-red-500 text-white"
                            )}
                          >
                            {assignment.materialDelivered ? "Yes" : "No"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification && (
          <div
            className={cn(
              "fixed bottom-4 right-4 p-4 rounded-lg text-white font-medium shadow-lg animate-slide-in-right",
              notification.type === "success" ? "bg-green-500" : "bg-red-500"
            )}
          >
            {notification.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
