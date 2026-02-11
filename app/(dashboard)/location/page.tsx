"use client";
import React, { useState, useEffect, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  User,
  MapPin,
  XCircle,
  CheckCircle,
  Satellite,
  SignalHigh,
  SignalLow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Chart from "chart.js/auto";
// Notification Component
const Notification: React.FC<{ message: string; type: "success" | "error" }> = ({ message, type }) => (
  <div
    className={`flex items-center gap-2 p-3 rounded-lg mb-6 transition-all duration-300 animate-slide-down w-full max-w-md mx-auto shadow-md ${
      type === "error" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
    }`}
  >
    {type === "error" ? (
      <XCircle className="h-4 sm:h-5 w-4 sm:w-5" />
    ) : (
      <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5" />
    )}
    <span className="text-xs sm:text-sm font-medium">{message}</span>
  </div>
);
// Modern GPS Status Graph
const GpsStatusChart: React.FC<{ gpsOn: number; gpsOff: number }> = ({ gpsOn, gpsOff }) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<any>(null);
  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstanceRef.current) chartInstanceRef.current.destroy();
    const centerTextPlugin = {
      id: "centerText",
      afterDraw: (chart: any) => {
        const { ctx } = chart;
        ctx.save();
        const size = Math.min(chart.width, chart.height);
        // Draw Satellite SVG
        const img = new window.Image();
        img.onload = () => {
          ctx.globalAlpha = 0.12;
          ctx.drawImage(
            img,
            chart.width / 2 - size * 0.18,
            chart.height / 2 - size * 0.18 - 20,
            size * 0.36,
            size * 0.36
          );
          ctx.globalAlpha = 1;
        };
        img.src =
          "data:image/svg+xml;utf8," +
          encodeURIComponent(
            `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" height="80" width="80" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="#06b6d4" stroke-width="2" /><circle cx="12" cy="12" r="3" fill="#22d3ee" stroke="#0891b2" stroke-width="2" /></svg>`
          );
        // Top - GPS ON Count
        ctx.font = `700 ${size * 0.15}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#0891b2";
        ctx.fillText(gpsOn.toString(), chart.width / 2, chart.height / 2 - size * 0.11);
        // Top Label - GPS ON
        ctx.font = `600 ${size * 0.09}px Inter, sans-serif`;
        ctx.fillStyle = "#0e7490";
        ctx.fillText("GPS ON", chart.width / 2, chart.height / 2 + size * 0.01);
        // Bottom - GPS OFF Count
        ctx.font = `700 ${size * 0.15}px Inter, sans-serif`;
        ctx.fillStyle = "#eab308";
        ctx.fillText(gpsOff.toString(), chart.width / 2, chart.height / 2 + size * 0.16);
        // Bottom Label - GPS OFF
        ctx.font = `600 ${size * 0.09}px Inter, sans-serif`;
        ctx.fillStyle = "#a16207";
        ctx.fillText("GPS OFF", chart.width / 2, chart.height / 2 + size * 0.27);
      },
    };
    chartInstanceRef.current = new Chart(chartRef.current, {
      type: "doughnut",
      data: {
        labels: ["GPS ON", "GPS OFF"],
        datasets: [
          {
            data: [gpsOn, gpsOff],
            backgroundColor: ["#22d3ee", "#fde68a"],
            borderWidth: 0,
            hoverOffset: 10,
          },
        ],
      },
      options: {
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: any) =>
                `${ctx.label}: ${ctx.parsed} (${Math.round(
                  (ctx.parsed * 100) / (gpsOn + gpsOff || 1)
                )}%)`,
            },
            bodyFont: { size: 16 },
          },
        },
        cutout: "72%",
        maintainAspectRatio: false,
        responsive: true,
      },
      plugins: [centerTextPlugin],
    });
  }, [gpsOn, gpsOff]);
  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <div className="relative w-full flex justify-center">
        <div className="w-[320px] h-[400px] sm:w-[340px] sm:h-[430px] bg-white/95 shadow-xl rounded-2xl flex flex-col items-center justify-center mx-auto">
          <canvas ref={chartRef} width={340} height={430} />
          {/* Chart legend below */}
          <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center gap-8">
            <span className="flex items-center gap-2 text-cyan-700 font-semibold text-base">
              <SignalHigh className="h-5 w-5 text-cyan-400" /> GPS ON
            </span>
            <span className="flex items-center gap-2 text-yellow-700 font-semibold text-base">
              <SignalLow className="h-5 w-5 text-yellow-400" /> GPS OFF
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
// Types
interface Location {
  latitude: string;
  longitude: string;
  gpsActive: boolean;
}
interface UserType {
  key: string;
  username: string;
  name: string;
  password: string;
  location?: Location;
}
// Main Page
const LocationTrackingPage: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [gpsOnCount, setGpsOnCount] = useState(0);
  const [gpsOffCount, setGpsOffCount] = useState(0);
  // Fetch users and live GPS status
  useEffect(() => {
    setIsLoading(true);
    const usersRef = ref(database, "users");
    const unsubscribe = onValue(
      usersRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const usersData = snapshot.val();
            const usersList: UserType[] = Object.keys(usersData)
              .map((key) => {
                const userData = usersData[key];
                const username = userData.username || key;
                return {
                  key,
                  username,
                  name: userData.name || username,
                  password: userData.password || "",
                  location: userData.location || {
                    latitude: "13.0827",
                    longitude: "80.2707",
                    gpsActive: false,
                  },
                };
              })
              .filter((user) => user.username.length <= 25);
            setUsers(usersList);
            // Calculate GPS ON/OFF count
            const onCount = usersList.filter((u) => u.location?.gpsActive).length;
            const offCount = usersList.length - onCount;
            setGpsOnCount(onCount);
            setGpsOffCount(offCount);
          } else {
            setUsers([]);
            setGpsOnCount(0);
            setGpsOffCount(0);
            setNotification({
              message: "No users found in the database. Please add users to the 'users' path.",
              type: "error",
            });
          }
          setIsLoading(false);
        } catch (err) {
          setNotification({
            message: "Failed to load users. Please check your database connection.",
            type: "error",
          });
          setIsLoading(false);
        }
      },
      (err) => {
        setNotification({
          message: "Failed to listen for users. Please check your database configuration.",
          type: "error",
        });
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);
  // Clear Notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  const handleTrackUserLocation = (user: UserType) => {
    router.push(
      `/employees?view=track&userId=${user.username}&userName=${encodeURIComponent(user.username)}`
    );
  };
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-indigo-100 px-2 sm:px-6"
      style={{ marginTop: 20 }}
    >
      <style jsx global>{`
        @keyframes slide-down {
          from {
            transform: translateY(-30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-down {
          animation: slide-down 0.5s ease;
        }
      `}</style>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-800 to-cyan-600 p-6 md:p-10 shadow-xl rounded-b-3xl mb-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white flex items-center gap-2 tracking-tight drop-shadow-md">
            <MapPin className="h-8 w-8 text-cyan-200 drop-shadow" /> Employee Location Tracking
          </h1>
        
        </div>
      </div>
      {/* --- The Main Content Grid --- */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-start mt-4">
        {/* Centered GPS Status Chart Card */}
        <div className="col-span-1 flex flex-col items-center w-full">
          <div className="w-full flex flex-col items-center">
            <GpsStatusChart gpsOn={gpsOnCount} gpsOff={gpsOffCount} />
            <div className="mt-2 text-xs text-gray-600 text-center">
              {gpsOnCount === 0 && gpsOffCount === 0
                ? "No employees to track."
                : ""}
            </div>
          </div>
        </div>
        {/* Employees Table - spans 2 columns on desktop */}
        <div className="col-span-2 w-full">
          {notification && <Notification message={notification.message} type={notification.type} />}
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-cyan-900 mb-6 flex items-center gap-2">
              <User className="h-6 w-6 text-cyan-700" />
              Employees
            </h2>
            {users.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>GPS Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow
                        key={user.key}
                        className="hover:bg-cyan-50/50 transition-colors text-base"
                      >
                        <TableCell className="font-bold text-cyan-800">{user.username}</TableCell>
                        <TableCell className="font-semibold text-cyan-900">{user.name}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold shadow transition-all duration-300
                              ${user.location?.gpsActive
                                ? "bg-cyan-100 text-cyan-800 animate-pulse"
                                : "bg-yellow-100 text-yellow-800"
                              }`}
                          >
                            {user.location?.gpsActive ? (
                              <>
                                <SignalHigh className="h-4 w-4 mr-1 text-cyan-500 animate-pulse" />
                                GPS On
                              </>
                            ) : (
                              <>
                                <SignalLow className="h-4 w-4 mr-1 text-yellow-500" />
                                GPS Off
                              </>
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() => handleTrackUserLocation(user)}
                            className="flex items-center gap-2 rounded-lg text-sm font-medium h-10 px-4 bg-gradient-to-r from-cyan-600 to-indigo-600 text-white hover:from-cyan-700 hover:to-indigo-700 shadow"
                          >
                            <MapPin className="h-4 w-4" />
                            Track
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed bg-cyan-50">
                <User className="h-10 w-10 text-cyan-300" />
                <h3 className="mt-4 text-lg font-medium text-cyan-900">No employees found</h3>
                <p className="text-sm text-cyan-600 text-center">
                  No employees with valid usernames available.<br />
                  Please ensure users are added in the database.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default LocationTrackingPage;
