"use client";
import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase";
import { MapPin, CheckCircle, Download, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { saveAs } from "file-saver";
import { format, parse } from "date-fns";

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface DeliveryProof {
  assignmentId: string;
  driverId: string;
  driverName: string;
  imageUrl: string;
  projectName: string;
  projectLocation: string;
  materials: string[];
  location: {
    lat: number;
    lng: number;
    accuracy: number;
  };
  timestamp: number;
}

interface Driver {
  uid: string;
  fullName: string;
}

const VerifyWork: React.FC = () => {
  const [proofs, setProofs] = useState<DeliveryProof[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedDriver, setSelectedDriver] = useState<string>("all");
  const [expandedDrivers, setExpandedDrivers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Load drivers from drivers table
    const driversRef = ref(database, "drivers");
    onValue(driversRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const driverList: Driver[] = Object.keys(data)
          .filter((key) => data[key].fullName)
          .map((key) => ({
            uid: key,
            fullName: data[key].fullName,
          }));
        setDrivers(driverList);
      }
    });

    // Load delivery proofs
    const proofsRef = ref(database, "deliveryProofs");
    onValue(proofsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: DeliveryProof[] = Object.keys(data).map((id) => ({
          assignmentId: id,
          driverId: data[id].driverId,
          driverName: data[id].driverName,
          imageUrl: data[id].imageUrl,
          projectName: data[id].projectName || "Unknown",
          projectLocation: data[id].projectLocation || "Unknown",
          materials: data[id].materials || [],
          location: data[id].location,
          timestamp: data[id].timestamp,
        }));
        setProofs(list);
      } else {
        setProofs([]);
      }
      setLoading(false);
    });
  }, []);

  // Generate month and year options
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  // Filter proofs by driver, month, and year
  const filteredProofs = proofs.filter((proof) => {
    const proofDate = new Date(proof.timestamp);
    const proofMonth = format(proofDate, "MMMM");
    const proofYear = format(proofDate, "yyyy");
    const matchesDriver = selectedDriver === "all" || proof.driverId === selectedDriver;
    const matchesMonth = selectedMonth === "" || proofMonth === selectedMonth;
    const matchesYear = selectedYear === "" || proofYear === selectedYear;
    return matchesDriver && matchesMonth && matchesYear;
  });

  // Group proofs by driver full name
  const groupedProofs = filteredProofs.reduce((acc, proof) => {
    const driver = drivers.find((d) => d.uid === proof.driverId);
    const driverName = driver ? driver.fullName : proof.driverName || "Unknown";
    if (!acc[driverName]) {
      acc[driverName] = [];
    }
    acc[driverName].push(proof);
    return acc;
  }, {} as Record<string, DeliveryProof[]>);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Driver Name",
      "Assignment ID",
      "Project Name",
      "Project Location",
      "Materials",
      "Delivery Date",
      "Latitude",
      "Longitude",
      "Accuracy (m)",
      "Image URL",
    ];
    const csvRows = [
      headers.join(","),
      ...filteredProofs.map((proof) => {
        const driver = drivers.find((d) => d.uid === proof.driverId);
        const driverName = driver ? driver.fullName : proof.driverName || "Unknown";
        return [
          `"${driverName}"`,
          proof.assignmentId,
          `"${proof.projectName}"`,
          `"${proof.projectLocation}"`,
          `"${proof.materials.join("; ")}"`,
          `"${new Date(proof.timestamp).toLocaleString("en-IN")}"`,
          proof.location.lat,
          proof.location.lng,
          proof.location.accuracy.toFixed(2),
          proof.imageUrl,
        ].join(",");
      }),
    ];
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `delivery_proofs_${new Date().toISOString().split("T")[0]}.csv`);
  };

  // Toggle driver section
  const toggleDriver = (driverName: string) => {
    setExpandedDrivers((prev) => ({
      ...prev,
      [driverName]: !prev[driverName],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg text-gray-600">
        Loading proofs...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header and Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              Verify Delivery Proofs
            </h1>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
              >
                <option value="">All Months</option>
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
              >
                <option value="">All Years</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
              >
                <option value="all">All Drivers</option>
                {drivers.map((driver) => (
                  <option key={driver.uid} value={driver.uid}>
                    {driver.fullName}
                  </option>
                ))}
              </select>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition w-full sm:w-auto"
              >
                <Download className="h-5 w-5" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Proofs List */}
        {Object.keys(groupedProofs).length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center text-gray-600">
            No delivery proofs available for the selected filters.
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedProofs).map(([driverName, driverProofs]) => (
              <div key={driverName} className="bg-white rounded-2xl shadow-lg border border-gray-200">
                <button
                  onClick={() => toggleDriver(driverName)}
                  className="w-full flex justify-between items-center p-6 bg-gradient-to-r from-blue-50 to-gray-50 rounded-t-2xl"
                >
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {driverName} ({driverProofs.length} {driverProofs.length === 1 ? "Proof" : "Proofs"})
                  </h2>
                  {expandedDrivers[driverName] ? (
                    <ChevronUp className="h-6 w-6 text-gray-600" />
                  ) : (
                    <ChevronDown className="h-6 w-6 text-gray-600" />
                  )}
                </button>
                {expandedDrivers[driverName] && (
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {driverProofs.map((proof) => (
                        <div
                          key={proof.assignmentId}
                          className="bg-gray-50 rounded-xl shadow-md border border-gray-100 overflow-hidden"
                        >
                          {/* Proof Header */}
                          <div className="p-4 bg-gradient-to-r from-blue-50 to-gray-50 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                              <MapPin className="h-5 w-5 text-blue-600" />
                              {proof.projectName}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">{proof.projectLocation}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              Delivered: {new Date(proof.timestamp).toLocaleString("en-IN")}
                            </p>
                          </div>
                          {/* Proof Details */}
                          <div className="p-4">
                            <p className="text-sm font-medium text-gray-700">Assignment ID: {proof.assignmentId}</p>
                            <p className="text-sm font-medium text-gray-700 mt-2">Materials:</p>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                              {proof.materials.length > 0 ? (
                                proof.materials.map((material, index) => (
                                  <li key={index}>{material}</li>
                                ))
                              ) : (
                                <li>No materials listed</li>
                              )}
                            </ul>
                            <img
                              src={proof.imageUrl}
                              alt="Delivery Proof"
                              className="w-full h-48 object-cover rounded-lg mt-4 shadow-sm"
                            />
                          </div>
                          {/* Map */}
                          <div className="h-64">
                            <MapContainer
                              center={[proof.location.lat, proof.location.lng]}
                              zoom={15}
                              style={{
                                height: "100%",
                                width: "100%",
                                borderRadius: "0 0 8px 8px",
                              }}
                            >
                              <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                              />
                              <Marker position={[proof.location.lat, proof.location.lng]}>
                                <Popup>
                                  {driverName} <br />
                                  {proof.projectName} <br />
                                  Accuracy: {proof.location.accuracy.toFixed(2)}m <br />
                                  {new Date(proof.timestamp).toLocaleString("en-IN")}
                                </Popup>
                              </Marker>
                            </MapContainer>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyWork;
