"use client";
import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase";
import { MapPin, X, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { LoadScript } from "@react-google-maps/api";

const GoogleMap = dynamic(() => import("@react-google-maps/api").then((mod) => mod.GoogleMap), { ssr: false });
const Marker = dynamic(() => import("@react-google-maps/api").then((mod) => mod.Marker), { ssr: false });
const InfoWindow = dynamic(() => import("@react-google-maps/api").then((mod) => mod.InfoWindow), { ssr: false });
const DirectionsRenderer = dynamic(() => import("@react-google-maps/api").then((mod) => mod.DirectionsRenderer), { ssr: false });

interface Driver {
  uid: string;
  fullName: string;
  username: string;
}

interface DriverLocation {
  uid: string;
  latitude: number;
  longitude: number;
  lastUpdated: number;
  gpsActive: boolean;
}

interface ProjectAssignment {
  id: string;
  driverId: string;
  rideAccepted: boolean;
  materialDelivered: boolean;
  streetName: string;
  areaName: string;
  pincode: string;
  city: string;
  materials: string[];
}

interface Destination {
  latitude: number;
  longitude: number;
}

const GOOGLE_MAPS_API_KEY = "AIzaSyBqN9hRjfX8lPhARFr6n8MoolSUqcl6WHc";
const MAP_LIBRARIES: ("places")[] = ["places"];

const TrackDriverLocation: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverLocations, setDriverLocations] = useState<DriverLocation[]>([]);
  const [projectAssignments, setProjectAssignments] = useState<ProjectAssignment[]>([]);
  const [selectedDriverLocation, setSelectedDriverLocation] = useState<DriverLocation | null>(null);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [onRideCount, setOnRideCount] = useState(0);
  const [isLoadingDestination, setIsLoadingDestination] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [activeInfoWindow, setActiveInfoWindow] = useState<"driver" | "destination" | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch Drivers
  useEffect(() => {
    const driversRef = ref(database, "drivers");
    const unsubscribe = onValue(
      driversRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const driversData = snapshot.val();
            const driversList = Object.keys(driversData).map((uid) => ({
              uid,
              fullName: driversData[uid].fullName || "Unknown",
              username: driversData[uid].username || "Unknown",
            }));
            setDrivers(driversList);

            const locationsList: DriverLocation[] = driversList.map((driver) => ({
              uid: driver.uid,
              latitude: driversData[driver.uid].location?.latitude || 0,
              longitude: driversData[driver.uid].location?.longitude || 0,
              lastUpdated: driversData[driver.uid].location?.lastUpdated || Date.now(),
              gpsActive: driversData[driver.uid].location?.gpsActive || false,
            }));
            setDriverLocations(locationsList);
          } else {
            setDrivers([]);
            setDriverLocations([]);
          }
        } catch (err) {
          console.error("Error fetching drivers:", err);
          setNotification({ message: "Failed to load drivers", type: "error" });
        }
      },
      (err) => {
        console.error("Error listening for drivers:", err);
        setNotification({ message: "Failed to listen for drivers", type: "error" });
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
              rideAccepted: assignmentsData[id].rideAccepted || false,
              materialDelivered: assignmentsData[id].materialDelivered || false,
              streetName: assignmentsData[id].streetName || "",
              areaName: assignmentsData[id].areaName || "",
              pincode: assignmentsData[id].pincode || "",
              city: assignmentsData[id].city || "",
              materials: assignmentsData[id].materials || [],
            }));
            setProjectAssignments(assignmentsList);
            const onRide = assignmentsList.filter(
              (assignment) => assignment.rideAccepted && !assignment.materialDelivered
            ).length;
            setOnRideCount(onRide);
          } else {
            setProjectAssignments([]);
            setOnRideCount(0);
          }
        } catch (err) {
          console.error("Error fetching assignments:", err);
          setNotification({ message: "Failed to load project assignments", type: "error" });
        }
      },
      (err) => {
        console.error("Error listening for assignments:", err);
        setNotification({ message: "Failed to listen for project assignments", type: "error" });
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch Destination + Directions with route
  const fetchDestinationAndDirections = async (driverId: string) => {
    setIsLoadingDestination(true);
    const assignment = projectAssignments.find(
      (a) => a.driverId === driverId && a.rideAccepted && !a.materialDelivered
    );
    if (!assignment) {
      setIsLoadingDestination(false);
      setDestination(null);
      setDirections(null);
      setNotification({ message: "No active assignment found for this driver", type: "error" });
      return;
    }

    const address = `${assignment.streetName}, ${assignment.areaName}, ${assignment.city}, ${assignment.pincode}`;
    const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
    try {
      const geoResponse = await fetch(geocodingUrl);
      const geoData = await geoResponse.json();
      if (geoData.status === "OK" && geoData.results.length > 0) {
        const { lat, lng } = geoData.results[0].geometry.location;
        setDestination({ latitude: lat, longitude: lng });

        if (window.google && selectedDriverLocation) {
          const directionsService = new window.google.maps.DirectionsService();
          directionsService.route(
            {
              origin: new window.google.maps.LatLng(selectedDriverLocation.latitude, selectedDriverLocation.longitude),
              destination: new window.google.maps.LatLng(lat, lng),
              travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
              if (status === "OK") {
                setDirections(result);
              } else {
                setNotification({ message: "Unable to fetch route", type: "error" });
                setDirections(null);
              }
            }
          );
        } else {
          setNotification({ message: "Google Maps API not loaded", type: "error" });
          setDirections(null);
        }
      } else {
        setNotification({ message: "Unable to find coordinates for the provided address", type: "error" });
        setDestination(null);
        setDirections(null);
      }
    } catch (error) {
      console.error("Error fetching destination or directions:", error);
      setNotification({ message: "Failed to load destination or route", type: "error" });
      setDestination(null);
      setDirections(null);
    } finally {
      setIsLoadingDestination(false);
    }
  };

  // Handle Track Driver
  const handleTrackDriver = async (driverId: string) => {
    const location = driverLocations.find((loc) => loc.uid === driverId);
    if (location && location.latitude !== 0 && location.longitude !== 0 && location.gpsActive) {
      setSelectedDriverLocation(location);
      await fetchDestinationAndDirections(driverId);
      setShowMap(true);
    } else {
      setNotification({ message: "No valid location data or GPS is off for this driver", type: "error" });
    }
  };

  // Notification Timeout
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Handle Map Load
  const onMapLoad = (map: google.maps.Map) => {
    setIsMapLoaded(true);
    if (directions) {
      const bounds = new google.maps.LatLngBounds();
      directions.routes[0].overview_path.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds);
    }
  };

  if (!isMounted) return null;

return (
  <LoadScript
    googleMapsApiKey={GOOGLE_MAPS_API_KEY}
    libraries={MAP_LIBRARIES}
    onLoad={() => setIsMapLoaded(true)}
    onError={() => setNotification({ message: "Failed to load Google Maps", type: "error" })}
  >
    <div className="min-h-screen bg-white text-black font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <MapPin className="h-8 w-8 text-blue-600" />
          Track Driver Location
        </h1>

        <div className="mb-8 flex items-center justify-between bg-blue-100 dark:bg-blue-900 rounded-xl p-4 shadow-md">
          <div className="flex items-center gap-3">
            <Truck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span className="text-lg font-semibold text-blue-800 dark:text-blue-200">
              Drivers On Ride: {onRideCount}
            </span>
          </div>
          <span className="text-sm text-blue-600 dark:text-blue-300">
            (Based on assignments with Ride Accepted and Material Not Delivered)
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Driver", "Last Updated", "GPS Status", "Ride Status", "Action"].map((header) => (
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
                {drivers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No driver data
                    </td>
                  </tr>
                ) : (
                  drivers.map((driver) => {
                    const location = driverLocations.find((loc) => loc.uid === driver.uid);
                    const hasValidLocation =
                      location && location.latitude !== 0 && location.longitude !== 0 && location.gpsActive;
                    const isOnRide = projectAssignments.some(
                      (a) => a.driverId === driver.uid && a.rideAccepted && !a.materialDelivered
                    );
                    return (
                      <tr key={driver.uid} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {driver.fullName} ({driver.username})
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {location?.lastUpdated ? new Date(location.lastUpdated).toLocaleString() : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={cn(
                              "px-3 py-1 rounded-full text-sm font-medium",
                              location?.gpsActive ? "bg-green-600 text-white" : "bg-red-600 text-white"
                            )}
                          >
                            {location?.gpsActive ? "On" : "Off"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={cn(
                              "px-3 py-1 rounded-full text-sm font-medium",
                              isOnRide ? "bg-yellow-600 text-white" : "bg-gray-300 text-gray-800"
                            )}
                          >
                            {isOnRide ? "On Ride" : "Not on Ride"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleTrackDriver(driver.uid)}
                            disabled={!hasValidLocation}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 shadow-sm",
                              hasValidLocation
                                ? "bg-blue-600 text-white hover:bg-blue-500"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            )}
                          >
                            <MapPin className="h-5 w-5" /> Track
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL MAP */}
        {showMap && selectedDriverLocation && isMapLoaded && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-slide-in">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <MapPin className="h-6 w-6 text-blue-600" />
                  Driver Location: {drivers.find((d) => d.uid === selectedDriverLocation.uid)?.fullName || "Unknown"}
                </h2>
                <button
                  onClick={() => {
                    setShowMap(false);
                    setSelectedDriverLocation(null);
                    setDestination(null);
                    setDirections(null);
                    setActiveInfoWindow(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {isLoadingDestination || !GOOGLE_MAPS_API_KEY ? (
                <div className="h-96 flex items-center justify-center text-gray-500">
                  {GOOGLE_MAPS_API_KEY ? "Loading destination..." : "Google Maps API key missing"}
                </div>
              ) : (
                <div className="h-96">
                  <GoogleMap
                    mapContainerStyle={{ height: "100%", width: "100%", borderRadius: "12px" }}
                    center={{ lat: selectedDriverLocation.latitude, lng: selectedDriverLocation.longitude }}
                    zoom={13}
                    options={{ mapTypeControl: false, streetViewControl: false }}
                    onLoad={(map) => {
                      if (directions) {
                        const bounds = new google.maps.LatLngBounds();
                        directions.routes[0].overview_path.forEach((p) => bounds.extend(p));
                        map.fitBounds(bounds);
                      }
                    }}
                  >
                    {/* Driver Marker */}
                    <Marker
                      position={{ lat: selectedDriverLocation.latitude, lng: selectedDriverLocation.longitude }}
                      title="Driver"
                      onClick={() => setActiveInfoWindow("driver")}
                    >
                      {activeInfoWindow === "driver" && (
                        <InfoWindow
                          position={{ lat: selectedDriverLocation.latitude, lng: selectedDriverLocation.longitude }}
                          onCloseClick={() => setActiveInfoWindow(null)}
                        >
                          <div>
                            <p>{drivers.find((d) => d.uid === selectedDriverLocation.uid)?.fullName || "Unknown"}</p>
                            <p>Last Updated: {new Date(selectedDriverLocation.lastUpdated).toLocaleString()}</p>
                            <p>GPS: {selectedDriverLocation.gpsActive ? "On" : "Off"}</p>
                          </div>
                        </InfoWindow>
                      )}
                    </Marker>

                    {/* Destination Marker */}
                    {destination && (
                      <Marker
                        position={{ lat: destination.latitude, lng: destination.longitude }}
                        title="Destination"
                        icon={{ url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png" }}
                        onClick={() => setActiveInfoWindow("destination")}
                      >
                        {activeInfoWindow === "destination" && (
                          <InfoWindow
                            position={{ lat: destination.latitude, lng: destination.longitude }}
                            onCloseClick={() => setActiveInfoWindow(null)}
                          >
                            <div>
                              <p>Destination</p>
                              <p>
                                {
                                  projectAssignments.find(
                                    (a) =>
                                      a.driverId === selectedDriverLocation.uid &&
                                      a.rideAccepted &&
                                      !a.materialDelivered
                                  )?.streetName
                                }
                                ,{" "}
                                {
                                  projectAssignments.find(
                                    (a) =>
                                      a.driverId === selectedDriverLocation.uid &&
                                      a.rideAccepted &&
                                      !a.materialDelivered
                                  )?.areaName
                                }
                                ,{" "}
                                {
                                  projectAssignments.find(
                                    (a) =>
                                      a.driverId === selectedDriverLocation.uid &&
                                      a.rideAccepted &&
                                      !a.materialDelivered
                                  )?.city
                                }
                                ,{" "}
                                {
                                  projectAssignments.find(
                                    (a) =>
                                      a.driverId === selectedDriverLocation.uid &&
                                      a.rideAccepted &&
                                      !a.materialDelivered
                                  )?.pincode
                                }
                              </p>
                              <p>
                                Materials:{" "}
                                {
                                  projectAssignments.find(
                                    (a) =>
                                      a.driverId === selectedDriverLocation.uid &&
                                      a.rideAccepted &&
                                      !a.materialDelivered
                                  )?.materials.join(", ") || "None"
                                }
                              </p>
                            </div>
                          </InfoWindow>
                        )}
                      </Marker>
                    )}

                    {/* Route line */}
                    {directions && (
                      <DirectionsRenderer
                        directions={directions}
                        options={{ polylineOptions: { strokeColor: "#3b82f6", strokeWeight: 4 } }}
                      />
                    )}
                  </GoogleMap>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notification Toast */}
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
  </LoadScript>
);

};

export default TrackDriverLocation;
