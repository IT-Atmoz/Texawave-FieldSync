"use client";

import React, { useState, useEffect } from "react";
import { ref, onValue, set, push } from "firebase/database";
import { database } from "@/lib/firebase";
import { Calendar, Clock, RefreshCw, AlertCircle, CheckCircle, Settings, BarChart2, Search } from "lucide-react";
import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { format, parseISO, getWeek, getYear, startOfWeek, addDays, getHours, getMinutes } from "date-fns";

// Register Chart.js plugin for data labels
Chart.register(ChartDataLabels);

// Interface Definitions
interface User {
  name: string;
  username: string;
  empId: string;
}

interface Shift {
  shiftId: string; // Unique ID for each shift
  userId: string;
  username: string;
  week: string; // e.g., "2025-W01"
  shiftType: "Morning" | "Afternoon" | "Night";
  startTime: string;
  endTime: string;
  date: string;
  status: "upcoming" | "completed" | "missed";
}

interface ShiftTiming {
  shiftType: "Morning" | "Afternoon" | "Night";
  startTime: string;
  endTime: string;
}

interface NotificationProps {
  message: string;
  type: "success" | "error" | "info";
}

// Utility Functions
const formatDisplayDate = (dateStr: string): string => {
  try {
    const date = parseISO(dateStr);
    return format(date, "MMM d, yyyy");
  } catch {
    return dateStr;
  }
};

const formatTime = (time: string): string => {
  try {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const adjustedHours = hours % 12 || 12;
    return `${adjustedHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  } catch {
    return time;
  }
};

const getWeekYearOptions = () => {
  const options: string[] = [];
  const today = new Date();
  const currentYear = getYear(today);
  for (let year = currentYear - 1; year <= currentYear; year++) {
    for (let week = 1; week <= 52; week++) {
      options.push(`${year}-W${week.toString().padStart(2, "0")}`);
    }
  }
  return options.reverse();
};

const getCurrentShiftType = (timings: ShiftTiming[], currentTime: Date): "Morning" | "Afternoon" | "Night" | null => {
  const currentHours = getHours(currentTime);
  const currentMinutes = getMinutes(currentTime);
  const currentTotalMinutes = currentHours * 60 + currentMinutes;

  for (const timing of timings) {
    let [startHours, startMinutes] = timing.startTime.split(":").map(Number);
    let [endHours, endMinutes] = timing.endTime.split(":").map(Number);

    const isOvernight = endHours < startHours || (endHours === startHours && endMinutes <= startMinutes);
    let startTotalMinutes = startHours * 60 + startMinutes;
    let endTotalMinutes = endHours * 60 + endMinutes;

    if (isOvernight) {
      if (currentTotalMinutes >= startTotalMinutes || currentTotalMinutes < endTotalMinutes) {
        return timing.shiftType;
      }
    } else {
      if (currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes) {
        return timing.shiftType;
      }
    }
  }
  return null;
};

const calculateWeeklyShiftCounts = (shifts: Shift[], selectedWeek: string) => {
  const shiftTypes = ["Morning", "Afternoon", "Night"];
  const counts: { [key: string]: number } = { Morning: 0, Afternoon: 0, Night: 0 };
  
  shifts
    .filter((s) => s.week === selectedWeek)
    .forEach((s) => {
      counts[s.shiftType]++;
    });

  return {
    labels: shiftTypes,
    datasets: [{
      label: "Shift Counts",
      data: shiftTypes.map(type => counts[type]),
      backgroundColor: [
        "rgba(34, 197, 94, 0.6)", // Green for Morning
        "rgba(234, 179, 8, 0.6)", // Yellow for Afternoon
        "rgba(147, 51, 234, 0.6)", // Purple for Night
      ],
      borderColor: [
        "rgba(34, 197, 94, 1)",
        "rgba(234, 179, 8, 1)",
        "rgba(147, 51, 234, 1)",
      ],
      borderWidth: 1,
    }],
  };
};

// Notification Component
const Notification: React.FC<NotificationProps> = ({ message, type }) => {
  return (
    <div
      className={`fixed top-6 right-6 z-50 flex items-center gap-2 p-4 rounded-xl shadow-2xl transition-transform duration-500 animate-in slide-in-from-top-4 w-[90%] sm:w-auto max-w-md font-medium
        ${type === "error" ? "bg-red-50 text-red-800 border-l-4 border-red-600" : 
          type === "success" ? "bg-teal-50 text-teal-800 border-l-4 border-teal-600" : 
          "bg-blue-50 text-blue-800 border-l-4 border-blue-600"}`}
      role="alert"
      aria-live="assertive"
    >
      {type === "error" ? (
        <AlertCircle className="h-5 w-5" />
      ) : type === "success" ? (
        <CheckCircle className="h-5 w-5" />
      ) : (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      )}
      <span className="text-sm">{message}</span>
    </div>
  );
};

// Shift Timing Configuration Modal
const ShiftTimingModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  timings: ShiftTiming[];
  onSave: (timings: ShiftTiming[]) => void;
}> = ({ isOpen, onClose, timings, onSave }) => {
  const [formData, setFormData] = useState<ShiftTiming[]>(timings);
  const [errors, setErrors] = useState<string[]>([]);

  const handleChange = (index: number, field: "startTime" | "endTime", value: string) => {
    const updatedTimings = [...formData];
    updatedTimings[index] = { ...updatedTimings[index], [field]: value };
    setFormData(updatedTimings);
    setErrors([]);
  };

  const handleSave = () => {
    const validationErrors: string[] = [];
    formData.forEach((timing) => {
      if (!timing.startTime || !timing.endTime) {
        validationErrors.push(`${timing.shiftType} requires both start and end times`);
      }
    });
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ${isOpen ? "block" : "hidden"}`}>
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 sm:max-w-[600px] w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Configure Shift Timings</h2>
        <div className="grid gap-6 py-6">
          {errors.length > 0 && (
            <div className="bg-red-50 p-4 rounded-xl text-sm text-red-800 shadow-inner">
              {errors.map((err, idx) => (
                <p key={idx}>{err}</p>
              ))}
            </div>
          )}
          {formData.map((timing, index) => (
            <div key={timing.shiftType} className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-semibold text-gray-700">{timing.shiftType}</label>
              <input
                type="time"
                value={timing.startTime}
                onChange={(e) => handleChange(index, "startTime", e.target.value)}
                className="col-span-1 rounded-lg border-gray-300 shadow-sm focus:ring-teal-500 p-2"
              />
              <input
                type="time"
                value={timing.endTime}
                onChange={(e) => handleChange(index, "endTime", e.target.value)}
                className="col-span-1 rounded-lg border-gray-300 shadow-sm focus:ring-teal-500 p-2"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="rounded-lg border-gray-300 text-gray-700 hover:bg-gray-200 px-4 py-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-teal-600 text-white hover:bg-teal-700 shadow-md px-4 py-2"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// Current Shift Monitor Component
const CurrentShiftMonitor: React.FC<{
  users: User[];
  shifts: Shift[];
  timings: ShiftTiming[];
  currentTime: Date;
}> = ({ users, shifts, timings, currentTime }) => {
  const currentShiftType = getCurrentShiftType(timings, currentTime);
  const currentDate = format(currentTime, "yyyy-MM-dd");
  const currentShifts = shifts.filter((s) => s.date === currentDate && s.shiftType === currentShiftType);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Clock className="h-6 w-6 text-teal-600" />
        Current Shift ({currentShiftType || "No Active Shift"})
      </h2>
      <div className="space-y-4">
        {currentShifts.length === 0 ? (
          <p className="text-gray-500">No employees assigned to this shift</p>
        ) : (
          currentShifts.map((shift) => (
            <div
              key={shift.shiftId}
              className={`p-4 rounded-lg flex items-center gap-4 animate-pulse
                ${shift.shiftType === "Morning" ? "bg-green-100" : 
                  shift.shiftType === "Afternoon" ? "bg-yellow-100" : 
                  "bg-purple-100"}`}
            >
              <div className="h-10 w-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold">
                {shift.username[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{shift.username}</p>
                <p className="text-sm text-gray-600">
                  {shift.shiftType} ({formatTime(shift.startTime)} - {formatTime(shift.endTime)})
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Shift Assignment Table Component
const ShiftAssignmentTable: React.FC<{
  users: User[];
  shifts: Shift[];
  selectedWeek: string;
  timings: ShiftTiming[];
  onToggleShift: (userId: string, shiftType: ShiftTiming["shiftType"], date: string) => void;
  currentTime: Date;
}> = ({ users, shifts, selectedWeek, timings, onToggleShift, currentTime }) => {
  const weekStart = startOfWeek(new Date(parseInt(selectedWeek.split("-")[0]), 0, 1), { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, (parseInt(selectedWeek.split("-W")[1]) - 1) * 7 + i);
    return format(date, "yyyy-MM-dd");
  });

  const currentShiftType = getCurrentShiftType(timings, currentTime);
  const currentDate = format(currentTime, "yyyy-MM-dd");

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Calendar className="h-6 w-6 text-teal-600" />
        Shift Assignments ({selectedWeek})
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="bg-teal-50 text-teal-800 font-semibold">
            <tr>
              <th className="p-4 rounded-tl-lg">Employee</th>
              {weekDates.map((date) => (
                <th key={date} className="p-4">{format(parseISO(date), "EEE, MMM d")}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500">
                  No users available
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.empId}
                  className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="p-4 font-medium text-gray-800">{user.username}</td>
                  {weekDates.map((date) => {
                    const shift = shifts.find((s) => s.userId === user.empId && s.date === date);
                    const isCurrentShift = date === currentDate && shift?.shiftType === currentShiftType;
                    return (
                      <td key={date} className="p-4">
                        {shift ? (
                          <div
                            className={`p-2 rounded-lg text-center font-semibold
                              ${isCurrentShift ? 
                                (shift.shiftType === "Morning" ? "bg-green-100 text-green-800" :
                                 shift.shiftType === "Afternoon" ? "bg-yellow-100 text-yellow-800" :
                                 "bg-purple-100 text-purple-800") : 
                                "bg-gray-100 text-gray-600"}`}
                          >
                            {shift.shiftType}
                            <br />
                            <span className="text-xs">
                              ({formatTime(shift.startTime)} - {formatTime(shift.endTime)})
                            </span>
                          </div>
                        ) : (
                          <select
                            onChange={(e) => {
                              const shiftType = e.target.value as ShiftTiming["shiftType"];
                              if (shiftType) {
                                onToggleShift(user.empId, shiftType, date);
                              }
                            }}
                            className="p-2 rounded-lg border-gray-300 focus:ring-teal-500 w-full"
                          >
                            <option value="">None</option>
                            {timings.map((timing) => (
                              <option key={timing.shiftType} value={timing.shiftType}>
                                {timing.shiftType}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Weekly Shift Counts Graph Component
const WeeklyShiftGraph: React.FC<{
  shifts: Shift[];
  selectedWeek: string;
}> = ({ shifts, selectedWeek }) => {
  useEffect(() => {
    const ctx = document.getElementById("weeklyShiftChart") as HTMLCanvasElement;
    if (!ctx) return;

    const chartData = calculateWeeklyShiftCounts(shifts, selectedWeek);
    const maxCount = Math.max(...chartData.datasets[0].data, 10) + 2;

    const chart = new Chart(ctx, {
      type: "bar",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "rgba(31, 41, 55, 0.9)",
            titleFont: { size: 14, weight: "600" },
            bodyFont: { size: 12 },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => `${context.raw} shifts`,
            },
          },
          datalabels: {
            anchor: "end",
            align: "top",
            color: "#1F2937",
            font: { size: 12, weight: "600" },
            formatter: (value: number) => (value > 0 ? value : ""),
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Shift Type",
              font: { size: 16, weight: "600" },
              color: "#1F2937",
            },
            ticks: {
              font: { size: 12 },
              color: "#4B5563",
            },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            max: maxCount,
            title: {
              display: true,
              text: "Number of Shifts",
              font: { size: 16, weight: "600" },
              color: "#1F2937",
            },
            ticks: {
              stepSize: 1,
              font: { size: 12 },
              color: "#4B5563",
            },
            grid: { color: "rgba(209, 213, 219, 0.3)" },
          },
        },
        animation: {
          duration: 1500,
          easing: "easeOutQuart",
        },
        layout: {
          padding: { top: 20, bottom: 10 },
        },
      },
    });

    return () => chart.destroy();
  }, [shifts, selectedWeek]);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <BarChart2 className="h-6 w-6 text-teal-600" />
        Weekly Shift Counts ({selectedWeek})
      </h2>
      <div className="h-80">
        <canvas id="weeklyShiftChart"></canvas>
      </div>
    </div>
  );
};

// ShiftManagementPage Component
const ShiftManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>(
    `${getYear(new Date())}-W${getWeek(new Date(), { weekStartsOn: 1 }).toString().padStart(2, "0")}`
  );
  const [timings, setTimings] = useState<ShiftTiming[]>([
    { shiftType: "Morning", startTime: "06:00", endTime: "14:00" },
    { shiftType: "Afternoon", startTime: "14:00", endTime: "22:00" },
    { shiftType: "Night", startTime: "22:00", endTime: "06:00" },
  ]);
  const [isTimingModalOpen, setIsTimingModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Users
  useEffect(() => {
    setIsLoading(true);
    const usersRef = ref(database, "users");
    const unsubscribe = onValue(
      usersRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const usersData = snapshot.val();
            const usersList = Object.keys(usersData)
              .map((uid) => ({
                empId: uid,
                name: usersData[uid].name || "",
                username: usersData[uid].username || "",
              }))
              .filter((user) => user.name && user.username);

            setUsers(usersList);
            setIsLoading(false);
          } else {
            setUsers([]);
            setIsLoading(false);
            setNotification({ message: "No users found", type: "error" });
          }
        } catch (err) {
          console.error("Error fetching users:", err);
          setIsLoading(false);
          setNotification({ message: "Failed to load users", type: "error" });
        }
      },
      (err) => {
        console.error("Firebase listener error:", err);
        setIsLoading(false);
        setNotification({ message: "Failed to listen for users", type: "error" });
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch Shifts
  useEffect(() => {
    const shiftsRef = ref(database, "shifts");
    const unsubscribe = onValue(
      shiftsRef,
      (snapshot) => {
        try {
          const shiftsList: Shift[] = [];
          if (snapshot.exists()) {
            const shiftsData = snapshot.val();
            Object.entries(shiftsData).forEach(([shiftId, shiftData]: [string, any]) => {
              if (
                !shiftData.userId ||
                !shiftData.username ||
                !shiftData.week ||
                !shiftData.shiftType ||
                !shiftData.startTime ||
                !shiftData.endTime ||
                !shiftData.date ||
                !shiftData.status
              ) {
                console.warn(`Invalid shift data for shiftId ${shiftId}:`, shiftData);
                return;
              }
              shiftsList.push({
                shiftId,
                userId: shiftData.userId,
                username: shiftData.username,
                week: shiftData.week,
                shiftType: shiftData.shiftType,
                startTime: shiftData.startTime,
                endTime: shiftData.endTime,
                date: shiftData.date,
                status: shiftData.status,
              });
            });
          }
          setShifts(shiftsList);
        } catch (err) {
          console.error("Error fetching shifts:", err);
          setNotification({ message: "Failed to load shifts", type: "error" });
        }
      },
      (err) => {
        console.error("Firebase shifts listener error:", err);
        setNotification({ message: "Failed to listen for shifts", type: "error" });
      }
    );
    return () => unsubscribe();
  }, [users]);

  // Fetch Shift Timings
  useEffect(() => {
    const timingsRef = ref(database, "shiftTimings");
    const unsubscribe = onValue(
      timingsRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const timingsData = snapshot.val();
            setTimings(timingsData);
          }
        } catch (err) {
          console.error("Error fetching timings:", err);
          setNotification({ message: "Failed to load timings", type: "error" });
        }
      },
      (err) => {
        console.error("Firebase timings listener error:", err);
        setNotification({ message: "Failed to listen for timings", type: "error" });
      }
    );
    return () => unsubscribe();
  }, []);

  // Clear Notification After 3 Seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleWeekSelect = (week: string) => {
    setSelectedWeek(week);
  };

  const handleToggleShift = async (userId: string, shiftType: ShiftTiming["shiftType"], date: string) => {
    const user = users.find((u) => u.empId === userId);
    if (!user) return;

    const existingShift = shifts.find((s) => s.userId === userId && s.date === date);
    const timing = timings.find((t) => t.shiftType === shiftType);

    try {
      if (existingShift) {
        // Remove shift
        await set(ref(database, `shifts/${existingShift.shiftId}`), null);
        setNotification({
          message: `${existingShift.shiftType} shift removed for ${user.username} on ${formatDisplayDate(date)}`,
          type: "success",
        });
      } else {
        // Check for conflicting shifts on the same date
        const conflictingShift = shifts.find((s) => s.userId === userId && s.date === date);
        if (conflictingShift) {
          setNotification({
            message: `${user.username} already has a ${conflictingShift.shiftType} shift on ${formatDisplayDate(date)}`,
            type: "error",
          });
          return;
        }

        // Add new shift
        const shift: Omit<Shift, "shiftId"> = {
          userId,
          username: user.username,
          week: selectedWeek,
          shiftType,
          startTime: timing!.startTime,
          endTime: timing!.endTime,
          date,
          status: "upcoming",
        };
        const newShiftRef = push(ref(database, "shifts"));
        await set(newShiftRef, shift);
        setNotification({
          message: `${shiftType} shift assigned to ${user.username} on ${formatDisplayDate(date)}`,
          type: "success",
        });
      }
    } catch (err) {
      console.error("Error toggling shift:", err);
      setNotification({ message: "Failed to toggle shift", type: "error" });
    }
  };

  const handleSaveTimings = async (newTimings: ShiftTiming[]) => {
    try {
      await set(ref(database, "shiftTimings"), newTimings);
      setTimings(newTimings);
      setNotification({ message: "Shift timings updated successfully", type: "success" });
    } catch (err) {
      console.error("Error saving timings:", err);
      setNotification({ message: "Failed to save timings", type: "error" });
    }
  };

  const handleSearch = () => {
    const user = users.find((u) => u.username.toLowerCase() === searchQuery.toLowerCase());
    if (!user) {
      setNotification({ message: "User not found", type: "error" });
      return;
    }

    const currentDate = format(currentTime, "yyyy-MM-dd");
    const userShift = shifts.find(
      (s) => s.userId === user.empId && s.date === currentDate && s.shiftType === getCurrentShiftType(timings, currentTime)
    );

    if (userShift) {
      setNotification({
        message: `${user.username} is currently on ${userShift.shiftType} shift (${formatTime(userShift.startTime)} - ${formatTime(userShift.endTime)})`,
        type: "info",
      });
    } else {
      setNotification({
        message: `${user.username} has no shift currently`,
        type: "info",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <svg className="animate-spin h-6 w-6 text-teal-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-4V1C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-lg font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pt-16">
      <header className="sticky top-4 z-20 bg-gradient-to-r from-teal-600 to-teal-800 rounded-2xl shadow-2xl mx-4 sm:mx-6 lg:mx-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-extrabold text-white tracking-tight animate-slide-down">
            Shift Management Dashboard
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => setIsTimingModalOpen(true)}
              className="flex items-center gap-2 bg-white text-teal-800 hover:bg-gray-100 rounded-lg shadow-md font-semibold px-4 py-2"
            >
              <Settings className="h-5 w-5" />
              Configure Timings
            </button>
            <button
              onClick={() => {
                setSelectedWeek(
                  `${getYear(new Date())}-W${getWeek(new Date(), { weekStartsOn: 1 }).toString().padStart(2, "0")}`
                );
                setSearchQuery("");
                setNotification({ message: "Filters reset", type: "success" });
              }}
              className="flex items-center gap-2 bg-white text-teal-800 hover:bg-gray-100 rounded-lg shadow-md font-semibold px-4 py-2"
            >
              <RefreshCw className="h-5 w-5" />
              Reset
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        <div className="flex-1 space-y-8">
          {notification && <Notification message={notification.message} type={notification.type} />}

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="w-full sm:w-64">
              <label htmlFor="week-select" className="text-sm font-medium text-gray-700 mb-1">
                Select Week
              </label>
              <select
                id="week-select"
                value={selectedWeek}
                onChange={(e) => handleWeekSelect(e.target.value)}
                className="rounded-lg border-gray-300 shadow-sm focus:ring-teal-500 bg-white p-2 w-full"
              >
                {getWeekYearOptions().map((week) => (
                  <option key={week} value={week}>
                    {week}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-64">
              <label htmlFor="search" className="text-sm font-medium text-gray-700 mb-1">
                Search Employee
              </label>
              <div className="relative">
                <input
                  id="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Enter username"
                  className="rounded-lg border-gray-300 shadow-sm focus:ring-teal-500 p-2 w-full pr-10"
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-teal-600"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <CurrentShiftMonitor users={users} shifts={shifts} timings={timings} currentTime={currentTime} />
          <WeeklyShiftGraph shifts={shifts} selectedWeek={selectedWeek} />
          <ShiftAssignmentTable
            users={users}
            shifts={shifts}
            selectedWeek={selectedWeek}
            timings={timings}
            onToggleShift={handleToggleShift}
            currentTime={currentTime}
          />
        </div>
      </main>

      <ShiftTimingModal
        isOpen={isTimingModalOpen}
        onClose={() => setIsTimingModalOpen(false)}
        timings={timings}
        onSave={handleSaveTimings}
      />

      <style jsx global>{`
        @keyframes slide-down {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes slide-up {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-down {
          animation: slide-down 0.6s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
        table thead tr th {
          background: linear-gradient(to bottom, #e6fffa, #ccfbf1);
        }
        table tbody tr:hover {
          transition: background-color 0.3s ease;
        }
        select, input {
          transition: all 0.2s ease;
        }
        select:focus, input:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.3);
        }
      `}</style>
    </div>
  );
};

export default ShiftManagementPage;
