"use client";
import React, { useState, useEffect } from "react";
import { ref, onValue, set, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { User, Save, X, FileText, Plus, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { generate } from "short-uuid";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import GooglePlacesAutocomplete from "./GooglePlacesAutocomplete";

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

interface MaterialRequest {
  id: string;
  materialName: string;
  projectId: string;
  quantityRequested: number;
  username: string;
  status: string;
  deliveryAssigned?: boolean;
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
  streetName: string;
  areaName: string;
  pincode: string;
  city: string;
}

const AssignProject: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<MaterialRequest[]>([]);
  const [projectAssignments, setProjectAssignments] = useState<ProjectAssignment[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [assignmentForm, setAssignmentForm] = useState({
    driverId: "",
    vehicleId: "",
    deliveryDate: "",
    deliveryTime: "",
    streetName: "",
    areaName: "",
    pincode: "",
    city: "",
  });
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    streetName: "",
    areaName: "",
    pincode: "",
    city: "",
  });

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

  // Fetch Material Requests
  useEffect(() => {
    const requestsRef = ref(database, "material_requests");
    const unsubscribe = onValue(
      requestsRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const requestsData = snapshot.val();
            const requestsList = Object.keys(requestsData).map((id) => ({
              id,
              materialName: requestsData[id].materialName || "",
              projectId: requestsData[id].projectId || "",
              quantityRequested: requestsData[id].quantityRequested || 0,
              username: requestsData[id].username || "",
              status: requestsData[id].status || "",
              deliveryAssigned: requestsData[id].deliveryAssigned || false,
            }));
            setMaterialRequests(requestsList);
            const pending = requestsList.filter(
              (r) => r.status === "approved" && !r.deliveryAssigned
            );
            setPendingRequests(pending);
          } else {
            setMaterialRequests([]);
            setPendingRequests([]);
          }
        } catch (err) {
          console.error("Error fetching material requests:", err);
          setNotification({ message: "Failed to load material requests", type: "error" });
        }
      },
      (err) => {
        console.error("Firebase listener error:", err);
        setNotification({ message: "Failed to listen for material requests", type: "error" });
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
              streetName: assignmentsData[id].streetName || "",
              areaName: assignmentsData[id].areaName || "",
              pincode: assignmentsData[id].pincode || "",
              city: assignmentsData[id].city || "",
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

  // Handle Assignment Form Changes
  const handleAssignmentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAssignmentForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Edit Form Changes
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Edit Start
  const handleEditStart = (assignment: ProjectAssignment) => {
    setEditingAssignmentId(assignment.id);
    setEditForm({
      streetName: assignment.streetName,
      areaName: assignment.areaName,
      pincode: assignment.pincode,
      city: assignment.city,
    });
  };

  // Save Edit
  const handleEditSave = async (assignmentId: string) => {
    if (
      !editForm.streetName ||
      !editForm.areaName ||
      !editForm.pincode ||
      !editForm.city
    ) {
      setNotification({ message: "All address fields are required", type: "error" });
      return;
    }
    const assignmentRef = ref(database, `driver_project_assignments/${assignmentId}`);
    try {
      await update(assignmentRef, {
        streetName: editForm.streetName,
        areaName: editForm.areaName,
        pincode: editForm.pincode,
        city: editForm.city,
      });
      setEditingAssignmentId(null);
      setNotification({ message: "Address updated successfully", type: "success" });
    } catch (error) {
      console.error("Error updating address:", error);
      setNotification({ message: "Failed to update address", type: "error" });
    }
  };

  // Cancel Edit
  const handleEditCancel = () => {
    setEditingAssignmentId(null);
    setEditForm({ streetName: "", areaName: "", pincode: "", city: "" });
  };

  // Assign Delivery
  const handleAssignDelivery = (request: MaterialRequest) => {
    setSelectedRequest(request);
    setShowAssignmentForm(true);
    setAssignmentForm({
      driverId: "",
      vehicleId: "",
      deliveryDate: "",
      deliveryTime: "",
      streetName: "",
      areaName: "",
      pincode: "",
      city: "",
    });
  };

  const handleDeliveryAssignmentSave = async () => {
    if (
      !selectedRequest ||
      !assignmentForm.driverId ||
      !assignmentForm.vehicleId ||
      !assignmentForm.deliveryDate ||
      !assignmentForm.deliveryTime ||
      !assignmentForm.streetName ||
      !assignmentForm.areaName ||
      !assignmentForm.pincode ||
      !assignmentForm.city
    ) {
      setNotification({ message: "All fields are required", type: "error" });
      return;
    }
    const assignmentId = generate();
    const assignmentRef = ref(database, `driver_project_assignments/${assignmentId}`);
    try {
      await set(assignmentRef, {
        driverId: assignmentForm.driverId,
        vehicleId: assignmentForm.vehicleId,
        projectId: selectedRequest.projectId,
        deliveryDate: assignmentForm.deliveryDate,
        deliveryTime: assignmentForm.deliveryTime,
        streetName: assignmentForm.streetName,
        areaName: assignmentForm.areaName,
        pincode: assignmentForm.pincode,
        city: assignmentForm.city,
        materials: [`${selectedRequest.materialName} x ${selectedRequest.quantityRequested}`],
        materialRequestId: selectedRequest.id,
        rideAccepted: false,
        materialDelivered: false,
      });
      await update(ref(database, `material_requests/${selectedRequest.id}`), { deliveryAssigned: true });
      setShowAssignmentForm(false);
      setSelectedRequest(null);
      setNotification({ message: "Delivery assignment saved successfully", type: "success" });
    } catch (error) {
      console.error("Error saving delivery assignment:", error);
      setNotification({ message: "Failed to save delivery assignment", type: "error" });
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Project",
      "Driver",
      "Vehicle",
      "Materials",
      "Ride Accepted",
      "Material Delivered",
      "Street Name",
      "Area Name",
      "Pincode",
      "City",
    ];
    const rows = projectAssignments
      .filter((a) => projects.find((p) => p.projectId === a.projectId)?.status === "ongoing")
      .map((assignment) => [
        projects.find((p) => p.projectId === assignment.projectId)?.name || "Unknown",
        drivers.find((d) => d.uid === assignment.driverId)?.fullName || "Unknown",
        vehicles.find((v) => v.vehicleId === assignment.vehicleId)?.vehicleNumber || "Unknown",
        assignment.materials.join(", "),
        assignment.rideAccepted ? "Yes" : "No",
        assignment.materialDelivered ? "Yes" : "No",
        assignment.streetName,
        assignment.areaName,
        assignment.pincode,
        assignment.city,
      ]);
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "project_assignments.csv");
  };

  // Notification Timeout
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4 mt-[-50px]">
      <div className="w-full max-w-7xl">
        {/* Pending Material Requests */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-4 flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            Pending Material Requests
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {["Material", "Project", "Quantity", "Requested By", "Action"].map((header) => (
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
                {pendingRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">
                      No pending requests
                    </td>
                  </tr>
                ) : (
                  pendingRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-4 whitespace-nowrap text-black dark:text-white">
                        {request.materialName}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-black dark:text-white">
                        {projects.find((p) => p.projectId === request.projectId)?.name || "Unknown"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-black dark:text-white">
                        {request.quantityRequested}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-black dark:text-white">
                        {request.username}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Button
                          onClick={() => handleAssignDelivery(request)}
                          className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                          <Plus className="h-4 w-4 mr-2" /> Assign
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Ongoing Project Assignments */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-4 flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            Ongoing Project Assignments
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {[
                    "Project",
                    "Driver",
                    "Vehicle",
                    "Materials",
                    "Ride Accepted",
                    "Material Delivered",
                    "Street Name",
                    "Area Name",
                    "Pincode",
                    "City",
                    "Action",
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
                {projectAssignments
                  .filter((a) => projects.find((p) => p.projectId === a.projectId)?.status === "ongoing")
                  .length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">
                      No ongoing assignments
                    </td>
                  </tr>
                ) : (
                  projectAssignments
                    .filter((a) => projects.find((p) => p.projectId === a.projectId)?.status === "ongoing")
                    .map((assignment) => (
                      <tr key={assignment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-4 whitespace-nowrap text-black dark:text-white">
                          {projects.find((p) => p.projectId === assignment.projectId)?.name || "Unknown"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-black dark:text-white">
                          {drivers.find((d) => d.uid === assignment.driverId)?.fullName || "Unknown"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-black dark:text-white">
                          {vehicles.find((v) => v.vehicleId === assignment.vehicleId)?.vehicleNumber || "Unknown"} (
                          {vehicles.find((v) => v.vehicleId === assignment.vehicleId)?.type || "Unknown"})
                        </td>
                        <td className="px-4 py-4 text-black dark:text-white">
                          {assignment.materials.join(", ")}
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
                        <td className="px-4 py-4 whitespace-nowrap text-black dark:text-white">
                          {editingAssignmentId === assignment.id ? (
                            <GooglePlacesAutocomplete
                              label="Street Name"
                              value={editForm.streetName}
                              onChange={(value) => setEditForm((prev) => ({ ...prev, streetName: value }))}
                              city={editForm.city}
                              pincode={editForm.pincode}
                              type="route"
                            />
                          ) : (
                            assignment.streetName
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-black dark:text-white">
                          {editingAssignmentId === assignment.id ? (
                            <GooglePlacesAutocomplete
                              label="Area Name"
                              value={editForm.areaName}
                              onChange={(value) => setEditForm((prev) => ({ ...prev, areaName: value }))}
                              city={editForm.city}
                              pincode={editForm.pincode}
                              type="sublocality"
                            />
                          ) : (
                            assignment.areaName
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-black dark:text-white">
                          {editingAssignmentId === assignment.id ? (
                            <input
                              type="text"
                              name="pincode"
                              value={editForm.pincode}
                              onChange={handleEditChange}
                              className="w-full min-w-[200px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400"
                              placeholder="Enter pincode"
                            />
                          ) : (
                            assignment.pincode
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-black dark:text-white">
                          {editingAssignmentId === assignment.id ? (
                            <input
                              type="text"
                              name="city"
                              value={editForm.city}
                              onChange={handleEditChange}
                              className="w-full min-w-[200px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400"
                              placeholder="Enter city"
                            />
                          ) : (
                            assignment.city
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {editingAssignmentId === assignment.id ? (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleEditSave(assignment.id)}
                                className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                              >
                                <Save className="h-4 w-4 mr-2" /> Save
                              </Button>
                              <Button
                                onClick={handleEditCancel}
                                className="bg-gray-300 text-black hover:bg-gray-400 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
                              >
                                <X className="h-4 w-4 mr-2" /> Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleEditStart(assignment)}
                              className="bg-yellow-600 text-white hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600"
                            >
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Assignment Form (Modal) */}
        {showAssignmentForm && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-slide-in">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-lg w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-black dark:text-white flex items-center gap-3">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Assign Delivery: {selectedRequest.materialName} x {selectedRequest.quantityRequested}
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowAssignmentForm(false);
                    setSelectedRequest(null);
                  }}
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-300" />
                </Button>
              </div>
              <div className="mb-4 text-gray-600 dark:text-gray-400">
                <p>
                  Project: {projects.find((p) => p.projectId === selectedRequest.projectId)?.name || "Unknown"}
                </p>
                <p>Requested By: {selectedRequest.username}</p>
              </div>
              <form className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Select Driver
                    </label>
                    <select
                      name="driverId"
                      value={assignmentForm.driverId}
                      onChange={handleAssignmentChange}
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Select Vehicle
                    </label>
                    <select
                      name="vehicleId"
                      value={assignmentForm.vehicleId}
                      onChange={handleAssignmentChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400"
                    >
                      <option value="" className="text-gray-400">
                        Select a vehicle
                      </option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.vehicleId} value={vehicle.vehicleId} className="text-black dark:text-white">
                          {vehicle.vehicleNumber} ({vehicle.type})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Delivery Date
                    </label>
                    <input
                      type="date"
                      name="deliveryDate"
                      value={assignmentForm.deliveryDate}
                      onChange={handleAssignmentChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Delivery Time
                    </label>
                    <input
                      type="time"
                      name="deliveryTime"
                      value={assignmentForm.deliveryTime}
                      onChange={handleAssignmentChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={assignmentForm.city}
                      onChange={handleAssignmentChange}
                      className="w-full min-w-[200px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400"
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Pincode
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={assignmentForm.pincode}
                      onChange={handleAssignmentChange}
                      className="w-full min-w-[200px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400"
                      placeholder="Enter pincode"
                    />
                  </div>
                  <GooglePlacesAutocomplete
                    label="Area Name"
                    value={assignmentForm.areaName}
                    onChange={(value) => setAssignmentForm((prev) => ({ ...prev, areaName: value }))}
                    city={assignmentForm.city}
                    pincode={assignmentForm.pincode}
                    type="sublocality"
                  />
                  <GooglePlacesAutocomplete
                    label="Street Name"
                    value={assignmentForm.streetName}
                    onChange={(value) => setAssignmentForm((prev) => ({ ...prev, streetName: value }))}
                    city={assignmentForm.city}
                    pincode={assignmentForm.pincode}
                    type="route"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    onClick={handleDeliveryAssignmentSave}
                    className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    <Save className="h-4 w-4 mr-2" /> Assign Delivery
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAssignmentForm(false);
                      setSelectedRequest(null);
                    }}
                    className="border-gray-300 dark:border-gray-600 text-black dark:text-white"
                  >
                    <X className="h-4 w-4 mr-2" /> Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Export Button */}
        <div className="flex justify-end mb-8">
          <Button
            onClick={exportToCSV}
            className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
          >
            <FileText className="h-5 w-5 mr-2" /> Export CSV
          </Button>
        </div>
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

export default AssignProject;
