"use client";
import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase";
import { User, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveAs } from "file-saver";
import Link from "next/link";

interface Driver {
  uid: string;
  username: string;
  fullName: string;
}
interface Vehicle {
  vehicleId: string;
  vehicleNumber: string;
  type: string;
}
interface ProjectAssignment {
  id: string;
  driverId: string;
  vehicleId: string;
  projectId: string;
  deliveryDate: string;
  deliveryTime: string;
  materials: string[];
  rideAccepted: boolean;
  materialDelivered: boolean;
}
interface Project {
  projectId: string;
  name: string;
  location: string;
}

const DriverDetails: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectAssignments, setProjectAssignments] = useState<ProjectAssignment[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

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
              driverId: assignmentsData[id].driverId,
              vehicleId: assignmentsData[id].vehicleId,
              projectId: assignmentsData[id].projectId,
              deliveryDate: assignmentsData[id].deliveryDate,
              deliveryTime: assignmentsData[id].deliveryTime,
              materials: assignmentsData[id].materials || [],
              rideAccepted: assignmentsData[id].rideAccepted || false,
              materialDelivered: assignmentsData[id].materialDelivered || false,
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

  const exportToCSV = () => {
    const headers = [
      "Username",
      "Full Name",
      "Assigned Projects",
      "Ride Accepted",
      "Material Delivered",
    ];
    const rows = drivers.map((driver) => {
      const driverAssignments = projectAssignments
        .filter((a) => a.driverId === driver.uid)
        .map(
          (a) =>
            `${projects.find((p) => p.projectId === a.projectId)?.name || "Unknown"} (Ride Accepted: ${
              a.rideAccepted ? "Yes" : "No"
            }, Material Delivered: ${a.materialDelivered ? "Yes" : "No"})`
        )
        .join("; ");
      return [driver.username, driver.fullName || "", driverAssignments];
    });
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "drivers_assignments.csv");
  };

  const exportToPDF = () => {
    setNotification({ message: "PDF export functionality to be implemented", type: "error" });
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <div className="min-h-screen bg-white text-black font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12 flex items-center justify-center gap-4 animate-fade-in">
          <User className="h-12 w-12 text-blue-600" />
          Construction Logistics Dashboard
        </h1>
        <div className="mb-12 bg-white rounded-2xl shadow-lg p-8 border border-gray-200 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-4">
                <Link
                  href="/driverdetails/add-driver"
                  className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all duration-200 shadow-md"
                >
                  Add Driver
                </Link>
                <Link
                  href="/driverdetails/add-vehicle"
                  className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all duration-200 shadow-md"
                >
                  Add Vehicle
                </Link>
                <Link
                  href="/driverdetails/assign-project"
                  className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all duration-200 shadow-md"
                >
                  Assign Project
                </Link>
                <Link
                  href="/driverdetails/pending-requests"
                  className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all duration-200 shadow-md"
                >
                  Pending Requests
                </Link>
                <Link
                  href="/driverdetails/track-driver"
                  className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all duration-200 shadow-md"
                >
                  Track Driver
                </Link>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4">Export Options</h2>
              <div className="space-y-4">
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-all duration-200 shadow-md"
                >
                  <FileText className="h-5 w-5" /> Export CSV
                </button>
                <button
                  onClick={exportToPDF}
                  className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-all duration-200 shadow-md"
                >
                  <FileText className="h-5 w-5" /> Export PDF
                </button>
              </div>
            </div>
          </div>
        </div>
        {notification && (
          <div
            className={cn(
              "fixed bottom-4 right-4 p-4 rounded-lg text-white font-medium shadow-lg animate-slide-in-right",
              notification.type === "success" ? "bg-green-600" : "bg-red-600"
            )}
          >
            {notification.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDetails;
