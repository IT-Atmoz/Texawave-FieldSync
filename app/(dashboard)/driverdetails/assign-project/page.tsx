"use client";
import React, { useState, useEffect } from "react";
import { ref, onValue, set, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { User, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { generate } from "short-uuid";

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
interface Project {
  projectId: string;
  name: string;
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

const AssignProject: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);
  const [assignmentForm, setAssignmentForm] = useState({
    driverId: "",
    vehicleId: "",
    deliveryDate: "",
    deliveryTime: "",
  });
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const driversRef = ref(database, "drivers");
    onValue(driversRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const driversData = snapshot.val();
          const driversList = Object.keys(driversData).map((uid) => ({
            uid,
            username: driversData[uid].username || "",
            fullName: driversData[uid].fullName || "",
          }));
          setDrivers(driversList);
        } else {
          setDrivers([]);
        }
      } catch (err) {
        setNotification({ message: "Failed to load drivers", type: "error" });
      }
    });
  }, []);

  useEffect(() => {
    const vehiclesRef = ref(database, "vehicles");
    onValue(vehiclesRef, (snapshot) => {
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
        setNotification({ message: "Failed to load vehicles", type: "error" });
      }
    });
  }, []);

  useEffect(() => {
    const projectsRef = ref(database, "projects");
    onValue(projectsRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const projectsData = snapshot.val();
          const projectsList = Object.keys(projectsData).map((projectId) => ({
            projectId,
            name: projectsData[projectId].name || "Unknown",
          }));
          setProjects(projectsList);
        } else {
          setProjects([]);
        }
      } catch (err) {
        setNotification({ message: "Failed to load projects", type: "error" });
      }
    });
  }, []);

  useEffect(() => {
    const requestsRef = ref(database, "material_requests");
    onValue(requestsRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const requestsData = snapshot.val();
          const requestsList = Object.keys(requestsData)
            .map((id) => ({ id, ...requestsData[id] }))
            .filter((r) => r.status === "approved" && !r.deliveryAssigned);
          setMaterialRequests(requestsList);
        } else {
          setMaterialRequests([]);
        }
      } catch (err) {
        setNotification({ message: "Failed to load material requests", type: "error" });
      }
    });
  }, []);

  const handleAssignmentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAssignmentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAssignDelivery = (request: MaterialRequest) => {
    setSelectedRequest(request);
    setAssignmentForm({ driverId: "", vehicleId: "", deliveryDate: "", deliveryTime: "" });
  };

  const handleDeliveryAssignmentSave = async () => {
    if (
      !selectedRequest ||
      !assignmentForm.driverId ||
      !assignmentForm.vehicleId ||
      !assignmentForm.deliveryDate ||
      !assignmentForm.deliveryTime
    ) {
      setNotification({ message: "Driver, Vehicle, Date, and Time are required", type: "error" });
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
        materials: [`${selectedRequest.materialName} x ${selectedRequest.quantityRequested}`],
        materialRequestId: selectedRequest.id,
        rideAccepted: false,
        materialDelivered: false,
      });
      await update(ref(database, `material_requests/${selectedRequest.id}`), { deliveryAssigned: true });
      setSelectedRequest(null);
      setNotification({ message: "Delivery assigned successfully", type: "success" });
    } catch (error) {
      setNotification({ message: "Failed to save delivery assignment", type: "error" });
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <User className="h-8 w-8 text-blue-600" />
          Assign Project
        </h1>
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <h2 className="text-2xl font-semibold mb-6">Pending Requests</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Project", "Material", "Quantity", "Requested By", "Action"].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {materialRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No pending requests
                    </td>
                  </tr>
                ) : (
                  materialRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {projects.find((p) => p.projectId === request.projectId)?.name || "Unknown"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{request.materialName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{request.quantityRequested}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{request.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleAssignDelivery(request)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all duration-200 shadow-sm"
                        >
                          Assign
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {selectedRequest && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-slide-in">
              <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full mx-4">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-3">
                    <User className="h-6 w-6 text-blue-600" />
                    Assign Delivery: {selectedRequest.materialName} x {selectedRequest.quantityRequested}
                  </h2>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="mb-4 text-gray-600">
                  <p>Project: {projects.find((p) => p.projectId === selectedRequest.projectId)?.name || "Unknown"}</p>
                  <p>Requested By: {selectedRequest.username}</p>
                </div>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Driver</label>
                      <select
                        name="driverId"
                        value={assignmentForm.driverId}
                        onChange={handleAssignmentChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                      >
                        <option value="">Select a driver</option>
                        {drivers.map((driver) => (
                          <option key={driver.uid} value={driver.uid}>
                            {driver.fullName} ({driver.username})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Vehicle</label>
                      <select
                        name="vehicleId"
                        value={assignmentForm.vehicleId}
                        onChange={handleAssignmentChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                      >
                        <option value="">Select a vehicle</option>
                        {vehicles.map((vehicle) => (
                          <option key={vehicle.vehicleId} value={vehicle.vehicleId}>
                            {vehicle.vehicleNumber} ({vehicle.type})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Date</label>
                      <input
                        type="date"
                        name="deliveryDate"
                        value={assignmentForm.deliveryDate}
                        onChange={handleAssignmentChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Time</label>
                      <input
                        type="time"
                        name="deliveryTime"
                        value={assignmentForm.deliveryTime}
                        onChange={handleAssignmentChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={handleDeliveryAssignmentSave}
                      className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all duration-200 shadow-md"
                    >
                      <Save className="h-5 w-5" /> Assign Delivery
                    </button>
                    <button
                      onClick={() => setSelectedRequest(null)}
                      className="flex items-center gap-2 px-5 py-3 bg-gray-300 text-black rounded-lg hover:bg-gray-400 transition-all duration-200 shadow-md"
                    >
                      <X className="h-5 w-5" /> Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
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

export default AssignProject;
