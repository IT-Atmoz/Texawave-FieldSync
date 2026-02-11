"use client";
import React, { useState, useEffect } from "react";
import { ref, onValue, set, get, remove } from "firebase/database";
import { database } from "@/lib/firebase";
import { Clock, RefreshCw, AlertCircle, CheckCircle, Calendar, Users, BarChart2 } from "lucide-react";
import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Register Chart.js plugin for data labels
Chart.register(ChartDataLabels);

// Interface Definitions
interface User {
  name: string;
  username: string;
}

interface LeaveRequest {
  id: string;
  username: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  timestamp: number;
}

interface LeaveGraphData {
  username: string;
  acceptedLeaves: number;
}

interface LeaveReasonData {
  id: string;
  username: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: "approved" | "rejected";
}

interface LeaveRequestCardProps {
  request: LeaveRequest;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

interface LeaveReasonCardProps {
  reason: LeaveReasonData;
  onReconsiderApprove: (id: string) => void;
  onReconsiderReject: (id: string) => void;
}

interface NotificationProps {
  message: string;
  type: "success" | "error" | "info";
}

// Utility Functions
const formatDisplayDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
};

const getMonthYearOptions = () => {
  const options: string[] = [];
  const today = new Date();
  for (let i = -12; i <= 0; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
    options.push(date.toLocaleString("en-US", { month: "long", year: "numeric" }));
  }
  return options.reverse();
};

const calculateLeaveDaysByMonth = (requests: LeaveRequest[], selectedMonthYear: string, usernames: string[]): LeaveGraphData[] => {
  const [monthName, year] = selectedMonthYear.split(" ");
  const monthIndex = new Date(Date.parse(`${monthName} 1, ${year}`)).getMonth();
  const targetYear = parseInt(year);

  const leaveDaysMap: { [username: string]: number } = {};
  usernames.forEach((username) => (leaveDaysMap[username] = 0));

  requests.forEach((request) => {
    if (request.status !== "approved") return;

    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);
    const username = request.username;

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      if (currentDate.getMonth() === monthIndex && currentDate.getFullYear() === targetYear) {
        leaveDaysMap[username] = (leaveDaysMap[username] || 0) + 1;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
  });

  return Object.entries(leaveDaysMap)
    .map(([username, acceptedLeaves]) => ({ username, acceptedLeaves }))
    .filter((data) => data.acceptedLeaves > 0)
    .sort((a, b) => a.username.localeCompare(b.username));
};

const calculateLeaveReasonsByMonth = (requests: LeaveRequest[], selectedMonthYear: string): LeaveReasonData[] => {
  const [monthName, year] = selectedMonthYear.split(" ");
  const monthIndex = new Date(Date.parse(`${monthName} 1, ${year}`)).getMonth();
  const targetYear = parseInt(year);

  const leaveReasons: LeaveReasonData[] = [];

  requests.forEach((request) => {
    if (request.status !== "approved" && request.status !== "rejected") return;

    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);

    if (
      (startDate.getMonth() === monthIndex && startDate.getFullYear() === targetYear) ||
      (endDate.getMonth() === monthIndex && endDate.getFullYear() === targetYear) ||
      (startDate < new Date(targetYear, monthIndex, 1) && endDate >= new Date(targetYear, monthIndex + 1, 0))
    ) {
      leaveReasons.push({
        id: request.id,
        username: request.username,
        reason: request.reason,
        startDate: request.startDate,
        endDate: request.endDate,
        status: request.status,
      });
    }
  });

  return leaveReasons.sort((a, b) => a.username.localeCompare(b.username));
};

const calculateTotalLeaveDays = (graphData: LeaveGraphData[]): number => {
  return graphData.reduce((sum, data) => sum + data.acceptedLeaves, 0);
};

// LeaveRequestCard Component
const LeaveRequestCard: React.FC<LeaveRequestCardProps> = ({ request, onApprove, onReject }) => {
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 transform transition-all duration-300 hover:shadow-2xl border border-gray-100 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-4 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{request.username}</h3>
          <p className="text-sm text-gray-500 mt-1">{formatDateRange(request.startDate, request.endDate)}</p>
        </div>
        <span
          className={cn(
            "text-xs font-medium px-3 py-1 rounded-full",
            request.status === "approved" && "bg-teal-100 text-teal-800",
            request.status === "rejected" && "bg-red-100 text-red-800",
            request.status === "pending" && "bg-amber-100 text-amber-800"
          )}
        >
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </span>
      </div>
      <div className="space-y-3">
        <p className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">Reason:</span> {request.reason}
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4 text-gray-400" />
          <span>{formatTimestamp(request.timestamp)}</span>
        </div>
      </div>
      {request.status === "pending" && (
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
          <button
            onClick={() => onApprove(request.id)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            <CheckCircle className="h-4 w-4" />
            Approve
          </button>
          <button
            onClick={() => onReject(request.id)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <AlertCircle className="h-4 w-4" />
            Reject
          </button>
        </div>
      )}
    </div>
  );
};

// LeaveReasonCard Component
const LeaveReasonCard: React.FC<LeaveReasonCardProps> = ({ reason, onReconsiderApprove, onReconsiderReject }) => {
  const formatDateRange = (startDate: string, endDate: string) => {
    return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
  };

  return (
    <div className="bg-white rounded-lg p-4 mb-4 transform transition-all duration-300 hover:shadow-md border border-gray-100 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-3 gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{reason.username}</h3>
          <p className="text-xs text-gray-500 mt-1">{formatDateRange(reason.startDate, reason.endDate)}</p>
        </div>
        <span
          className={cn(
            "text-xs font-medium px-3 py-1 rounded-full",
            reason.status === "approved" && "bg-teal-100 text-teal-800",
            reason.status === "rejected" && "bg-red-100 text-red-800"
          )}
        >
          {reason.status.charAt(0).toUpperCase() + reason.status.slice(1)}
        </span>
      </div>
      <p className="text-xs text-gray-700 mb-3">
        <span className="font-medium text-gray-900">Reason:</span> {reason.reason}
      </p>
      <div className="flex flex-col sm:flex-row justify-end gap-2">
        <button
          onClick={() => onReconsiderApprove(reason.id)}
          className={cn(
            "w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2",
            reason.status === "approved"
              ? "bg-gray-200 text-gray-600 cursor-not-allowed"
              : "bg-teal-600 text-white hover:bg-teal-700"
          )}
          disabled={reason.status === "approved"}
        >
          <CheckCircle className="h-3 w-3" />
          Approve
        </button>
        <button
          onClick={() => onReconsiderReject(reason.id)}
          className={cn(
            "w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
            reason.status === "rejected"
              ? "bg-gray-200 text-gray-600 cursor-not-allowed"
              : "bg-red-600 text-white hover:bg-red-700"
          )}
          disabled={reason.status === "rejected"}
        >
          <AlertCircle className="h-3 w-3" />
          Reject
        </button>
      </div>
    </div>
  );
};

// Notification Component
const Notification: React.FC<NotificationProps> = ({ message, type }) => {
  return (
    <div
      className={cn(
        "fixed top-6 right-6 z-50 flex items-center gap-2 p-3 rounded-lg shadow-xl transition-transform duration-500 animate-in slide-in-from-top-4 w-[90%] sm:w-auto max-w-md",
        type === "error" && "bg-red-50 text-red-800 border-l-4 border-red-600",
        type === "success" && "bg-teal-50 text-teal-800 border-l-4 border-teal-600",
        type === "info" && "bg-blue-50 text-blue-800 border-l-4 border-blue-600"
      )}
      role="alert"
      aria-live="assertive"
    >
      {type === "error" ? (
        <AlertCircle className="h-5 w-5" />
      ) : type === "success" ? (
        <CheckCircle className="h-5 w-5" />
      ) : (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      )}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

// LeavesPage Component
const LeavesPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [usernames, setUsernames] = useState<string[]>([]);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [allLeaveRequests, setAllLeaveRequests] = useState<LeaveRequest[]>([]);
  const [graphData, setGraphData] = useState<LeaveGraphData[]>([]);
  const [leaveReasons, setLeaveReasons] = useState<LeaveReasonData[]>([]);
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(
    new Date().toLocaleString("en-US", { month: "long", year: "numeric" })
  );
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
                uid,
                name: usersData[uid].name || "",
                username: usersData[uid].username || "",
              }))
              .filter((user) => user.name && user.name.trim() !== "" && user.username && user.username.trim() !== "");

            const uniqueUsers: User[] = [];
            const seenUsernames = new Set<string>();
            usersList.forEach((user) => {
              if (!seenUsernames.has(user.username)) {
                seenUsernames.add(user.username);
                uniqueUsers.push(user);
              }
            });

            setUsers(uniqueUsers);
            setUsernames(uniqueUsers.map((user) => user.username) || []);
            setIsLoading(false);
          } else {
            setUsers([]);
            setUsernames([]);
            setSelectedUsername(null);
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

  // Fetch All Leave Requests
  useEffect(() => {
    const leaveRequestsRef = ref(database, `leaveRequests`);
    const unsubscribe = onValue(leaveRequestsRef, (snapshot) => {
      try {
        const allRequests: LeaveRequest[] = [];
        if (snapshot.exists()) {
          const allUsersData = snapshot.val();
          Object.entries(allUsersData).forEach(([username, userRequests]) => {
            Object.entries(userRequests).forEach(([id, request]: [string, any]) => {
              if (
                !request.reason ||
                !request.status ||
                !request.timestamp ||
                !request.startDate ||
                !request.endDate ||
                !request.username
              ) {
                console.warn(`Invalid leave request data for ID ${id}:`, request);
                return;
              }
              allRequests.push({
                id,
                username: request.username,
                startDate: request.startDate,
                endDate: request.endDate,
                reason: request.reason,
                status: request.status,
                timestamp: request.timestamp,
              });
            });
          });
        }
        setAllLeaveRequests(allRequests);
      } catch (err) {
        console.error("Error fetching all leave requests:", err);
        setNotification({ message: "Failed to load leave requests", type: "error" });
      }
    }, (err) => {
      console.error("Firebase leave requests listener error:", err);
      setNotification({ message: "Failed to listen for leave requests", type: "error" });
    });
    return () => unsubscribe();
  }, []);

  // Fetch Leave Requests for Selected User
  useEffect(() => {
    if (!selectedUsername) {
      setLeaveRequests([]);
      return;
    }

    const leaveRequestsRef = ref(database, `leaveRequests/${selectedUsername}`);
    const unsubscribe = onValue(
      leaveRequestsRef,
      (snapshot) => {
        try {
          const allRequests: LeaveRequest[] = [];
          if (snapshot.exists()) {
            const requestsData = snapshot.val();
            Object.entries(requestsData).forEach(([id, request]: [string, any]) => {
              if (
                !request.reason ||
                !request.status ||
                !request.timestamp ||
                !request.startDate ||
                !request.endDate ||
                !request.username
              ) {
                console.warn(`Invalid leave request data for ID ${id}:`, request);
                return;
              }
              allRequests.push({
                id,
                username: request.username,
                startDate: request.startDate,
                endDate: request.endDate,
                reason: request.reason,
                status: request.status,
                timestamp: request.timestamp,
              });
            });
          }
          setLeaveRequests(allRequests.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()));
          if (allRequests.length === 0) {
            setNotification({ message: `No leave requests found for ${selectedUsername}`, type: "info" });
          }
        } catch (err) {
          console.error("Error fetching leave requests:", err);
          setNotification({ message: "Failed to load leave requests", type: "error" });
        }
      },
      (err) => {
        console.error("Firebase leave requests listener error:", err);
        setNotification({ message: "Failed to listen for leave requests", type: "error" });
      }
    );
    return () => unsubscribe();
  }, [selectedUsername]);

  // Update Graph Data and Leave Reasons
  useEffect(() => {
    const newGraphData = calculateLeaveDaysByMonth(allLeaveRequests, selectedMonthYear, usernames);
    setGraphData(newGraphData);
    const newLeaveReasons = calculateLeaveReasonsByMonth(allLeaveRequests, selectedMonthYear);
    setLeaveReasons(newLeaveReasons);
  }, [allLeaveRequests, selectedMonthYear, usernames]);

  // Initialize Accepted Leaves Bar Chart
  useEffect(() => {
    const ctx = document.getElementById("acceptedLeavesChart") as HTMLCanvasElement;
    if (!ctx) return;

    const context = ctx.getContext("2d");
    const gradient = context!.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "#14B8A6");
    gradient.addColorStop(1, "#2DD4BF");

    const maxLeaveDays = Math.max(...graphData.map((data) => data.acceptedLeaves), 10) + 5;

    const chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: graphData.map((data) => data.username),
        datasets: [
          {
            label: "Approved Leave Days",
            data: graphData.map((data) => data.acceptedLeaves),
            backgroundColor: gradient,
            borderColor: "#14B8A6",
            borderWidth: 1,
            borderRadius: 8,
            borderSkipped: false,
            barPercentage: 0.85,
            categoryPercentage: 0.9,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: maxLeaveDays,
            title: {
              display: true,
              text: "Leave Days",
              font: { size: 16, family: "'Inter', sans-serif", weight: "600" },
              color: "#111827",
            },
            ticks: {
              stepSize: 1,
              font: { size: 12, family: "'Inter', sans-serif" },
              color: "#6B7280",
            },
            grid: {
              color: "rgba(0, 0, 0, 0.05)",
            },
          },
          x: {
            title: {
              display: true,
              text: "Employee",
              font: { size: 16, family: "'Inter', sans-serif", weight: "600" },
              color: "#111827",
            },
            ticks: {
              font: { size: 12, family: "'Inter', sans-serif" },
              color: "#6B7280",
              maxRotation: 45,
              minRotation: 45,
            },
            grid: {
              display: false,
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              font: { size: 14, family: "'Inter', sans-serif", weight: "600" },
              color: "#111827",
              padding: 20,
            },
          },
          tooltip: {
            backgroundColor: "rgba(17, 24, 39, 0.9)",
            titleFont: { size: 14, family: "'Inter', sans-serif", weight: "600" },
            bodyFont: { size: 12, family: "'Inter', sans-serif" },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => `${context.parsed.y} days`,
            },
          },
          datalabels: {
            anchor: "end",
            align: "top",
            color: "#111827",
            font: {
              size: 12,
              family: "'Inter', sans-serif",
              weight: "600",
            },
            formatter: (value: number) => value || "",
            padding: 8,
          },
        },
        animation: {
          duration: 1500,
          easing: "easeOutQuart",
        },
        layout: {
          padding: {
            top: 40,
            bottom: 20,
            left: 10,
            right: 10,
          },
        },
      },
    });

    return () => chart.destroy();
  }, [graphData]);

  // Initialize Leave Reasons Bar Chart
  useEffect(() => {
    const ctx = document.getElementById("leaveReasonsChart") as HTMLCanvasElement;
    if (!ctx) return;

    const context = ctx.getContext("2d");
    const gradient = context!.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "#3B82F6");
    gradient.addColorStop(1, "#60A5FA");

    const maxLeaveDays = Math.max(...graphData.map((data) => data.acceptedLeaves), 10) + 5;

    const chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: graphData.map((data) => data.username),
        datasets: [
          {
            label: "Approved Leave Days",
            data: graphData.map((data) => data.acceptedLeaves),
            backgroundColor: gradient,
            borderColor: "#3B82F6",
            borderWidth: 1,
            borderRadius: 8,
            borderSkipped: false,
            barPercentage: 0.85,
            categoryPercentage: 0.9,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: maxLeaveDays,
            title: {
              display: true,
              text: "Leave Days",
              font: { size: 16, family: "'Inter', sans-serif", weight: "600" },
              color: "#111827",
            },
            ticks: {
              stepSize: 1,
              font: { size: 12, family: "'Inter', sans-serif" },
              color: "#6B7280",
            },
            grid: {
              color: "rgba(0, 0, 0, 0.05)",
            },
          },
          x: {
            title: {
              display: true,
              text: "Employee",
              font: { size: 16, family: "'Inter', sans-serif", weight: "600" },
              color: "#111827",
            },
            ticks: {
              font: { size: 12, family: "'Inter', sans-serif" },
              color: "#6B7280",
              maxRotation: 45,
              minRotation: 45,
            },
            grid: {
              display: false,
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              font: { size: 14, family: "'Inter', sans-serif", weight: "600" },
              color: "#111827",
              padding: 20,
            },
          },
          tooltip: {
            backgroundColor: "rgba(17, 24, 39, 0.9)",
            titleFont: { size: 14, family: "'Inter', sans-serif", weight: "600" },
            bodyFont: { size: 12, family: "'Inter', sans-serif" },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => `${context.parsed.y} days`,
            },
          },
          datalabels: {
            anchor: "end",
            align: "top",
            color: "#111827",
            font: {
              size: 12,
              family: "'Inter', sans-serif",
              weight: "600",
            },
            formatter: (value: number) => value || "",
            padding: 8,
          },
        },
        animation: {
          duration: 1500,
          easing: "easeOutQuart",
        },
        layout: {
          padding: {
            top: 40,
            bottom: 20,
            left: 10,
            right: 10,
          },
        },
      },
    });

    return () => chart.destroy();
  }, [graphData]);

  // Clear Notification After 3 Seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleUserSelect = (username: string) => {
    setSelectedUsername(username === "" ? null : username);
  };

  const handleMonthSelect = (monthYear: string) => {
    setSelectedMonthYear(monthYear);
  };

  const handleApproveRequest = async (requestId: string) => {
    const request = leaveRequests.find((req) => req.id === requestId);
    if (!request) return;

    const requestRef = ref(database, `leaveRequests/${request.username}/${requestId}`);
    try {
      await set(requestRef, { ...request, status: "approved" });

      const start = new Date(request.startDate);
      const end = new Date(request.endDate);
      let currentDate = new Date(start.toISOString().split('T')[0]); // Normalize to midnight of the start date

      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const attendanceRef = ref(database, `attendance/${dateStr}/${request.username}`);
        const snapshot = await get(attendanceRef);
        if (!snapshot.exists() || snapshot.val()?.status === "not_marked") {
          await set(attendanceRef, {
            status: "on_leave",
            markedAt: Date.now(),
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setNotification({ message: "Leave request approved", type: "success" });
    } catch (err) {
      console.error("Error processing leave approval:", err);
      setNotification({ message: "Failed to approve leave request", type: "error" });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const request = leaveRequests.find((req) => req.id === requestId);
    if (!request) return;

    const requestRef = ref(database, `leaveRequests/${request.username}/${requestId}`);
    try {
      await set(requestRef, { ...request, status: "rejected" });

      const start = new Date(request.startDate);
      const end = new Date(request.endDate);
      let currentDate = new Date(start.toISOString().split('T')[0]);

      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const attendanceRef = ref(database, `attendance/${dateStr}/${request.username}`);
        const snapshot = await get(attendanceRef);
        if (snapshot.exists() && snapshot.val()?.status === "on_leave") {
          await set(attendanceRef, {
            status: "not_marked",
            markedAt: Date.now(),
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setNotification({ message: "Leave request rejected", type: "success" });
    } catch (err) {
      console.error("Error rejecting leave request:", err);
      setNotification({ message: "Failed to reject leave request", type: "error" });
    }
  };

  const handleReconsiderApprove = async (requestId: string) => {
    const reason = leaveReasons.find((r) => r.id === requestId);
    if (!reason) return;

    const request = allLeaveRequests.find((req) => req.id === requestId && req.username === reason.username);
    if (!request) return;

    const requestRef = ref(database, `leaveRequests/${reason.username}/${requestId}`);
    try {
      await set(requestRef, { ...request, status: "approved" });

      const start = new Date(reason.startDate);
      const end = new Date(reason.endDate);
      let currentDate = new Date(start.toISOString().split('T')[0]);

      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const attendanceRef = ref(database, `attendance/${dateStr}/${reason.username}`);
        const snapshot = await get(attendanceRef);
        if (!snapshot.exists() || snapshot.val()?.status === "not_marked") {
          await set(attendanceRef, {
            status: "on_leave",
            markedAt: Date.now(),
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setNotification({ message: "Leave request re-approved", type: "success" });
    } catch (err) {
      console.error("Error processing leave re-approval:", err);
      setNotification({ message: "Failed to re-approve leave request", type: "error" });
    }
  };

  const handleReconsiderReject = async (requestId: string) => {
    const reason = leaveReasons.find((r) => r.id === requestId);
    if (!reason) return;

    const request = allLeaveRequests.find((req) => req.id === requestId && req.username === reason.username);
    if (!request) return;

    const requestRef = ref(database, `leaveRequests/${reason.username}/${requestId}`);
    try {
      await set(requestRef, { ...request, status: "rejected" });

      const start = new Date(reason.startDate);
      const end = new Date(reason.endDate);
      let currentDate = new Date(start.toISOString().split('T')[0]);

      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const attendanceRef = ref(database, `attendance/${dateStr}/${reason.username}`);
        await remove(attendanceRef); // Delete the attendance record for the date
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setNotification({ message: "Leave request re-rejected and attendance records deleted", type: "success" });
    } catch (err) {
      console.error("Error rejecting leave request:", err);
      setNotification({ message: "Failed to re-reject leave request or delete attendance records", type: "error" });
    }
  };

  const handleRefresh = () => {
    setSelectedUsername(null);
    setSelectedMonthYear(new Date().toLocaleString("en-US", { month: "long", year: "numeric" }));
    setLeaveRequests([]);
    setNotification({ message: "Filters reset", type: "success" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-50 pt-16">
      <header className="sticky top-4 z-20 bg-gradient-to-r from-teal-700 to-teal-500 rounded-xl shadow-lg mx-4 sm:mx-6 lg:mx-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight animate-slide-down">
            Leave Management Dashboard
          </h1>
          <button
            onClick={handleRefresh}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white text-teal-800 text-sm font-medium rounded-lg hover:bg-gray-100 transition-all focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Reset Filters
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {notification && <Notification message={notification.message} type={notification.type} />}

        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="flex justify-center sm:justify-start bg-gray-100 p-1 rounded-lg shadow-sm">
            <TabsTrigger
              value="requests"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm font-medium"
            >
              Leave Requests
            </TabsTrigger>
            <TabsTrigger
              value="reasons"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm font-medium"
            >
              Leave Reasons
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6 animate-slide-up">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="w-full sm:w-64">
                  <label htmlFor="employee-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Employee
                  </label>
                  <div className="relative">
                    <select
                      id="employee-select"
                      value={selectedUsername || ""}
                      onChange={(e) => handleUserSelect(e.target.value)}
                      className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-150"
                    >
                      <option value="">All Employees</option>
                      {usernames.map((username) => (
                        <option key={username} value={username}>
                          {username}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <svg className="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="w-full sm:w-64">
                  <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Month
                  </label>
                  <div className="relative">
                    <select
                      id="month-select"
                      value={selectedMonthYear}
                      onChange={(e) => handleMonthSelect(e.target.value)}
                      className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-150"
                    >
                      {getMonthYearOptions().map((monthYear) => (
                        <option key={monthYear} value={monthYear}>
                          {monthYear}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 animate-slide-up">
              <div className="flex items-center gap-4">
                <Users className="h-10 w-10 text-teal-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Leave Summary</h3>
                  <p className="text-2xl font-bold text-teal-600">{calculateTotalLeaveDays(graphData)} days</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Approved leaves for {graphData.length} employees in {selectedMonthYear}
                  </p>
                </div>
              </div>
            </div>

            <section aria-labelledby="leave-stats-heading" className="mb-6">
              <h2 id="leave-stats-heading" className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart2 className="h-6 w-6 text-teal-600" />
                Approved Leaves by Employee ({selectedMonthYear})
              </h2>
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
                <div className="h-80 sm:h-96">
                  <canvas id="acceptedLeavesChart"></canvas>
                </div>
              </div>
            </section>

            <section aria-labelledby="leave-requests-heading">
              <h2 id="leave-requests-heading" className="text-2xl font-semibold text-gray-900 mb-4">
                {selectedUsername ? `Leave Requests for ${selectedUsername}` : "Leave Requests"}
              </h2>
              {selectedUsername ? (
                leaveRequests.length > 0 ? (
                  <div className="grid gap-4">
                    {leaveRequests.map((request) => (
                      <LeaveRequestCard
                        key={request.id}
                        request={request}
                        onApprove={handleApproveRequest}
                        onReject={handleRejectRequest}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl shadow-lg border border-gray-100 animate-slide-up">
                    <Clock className="h-10 w-10 text-gray-400" />
                    <h3 className="mt-3 text-lg font-medium text-gray-900">No Leave Requests</h3>
                    <p className="mt-1 text-sm text-gray-500 text-center px-4">
                      No leave requests found for {selectedUsername}.
                    </p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl shadow-lg border border-gray-100 animate-slide-up">
                  <Clock className="h-10 w-10 text-gray-400" />
                  <h3 className="mt-3 text-lg font-medium text-gray-900">Select an Employee</h3>
                  <p className="mt-1 text-sm text-gray-500 text-center px-4">
                    Please select an employee to view their leave requests.
                  </p>
                </div>
              )}
            </section>
          </TabsContent>

          <TabsContent value="reasons" className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6 animate-slide-up">
              <div className="w-full sm:w-64">
                <label htmlFor="month-select-reasons" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Month
                </label>
                <div className="relative">
                  <select
                    id="month-select-reasons"
                    value={selectedMonthYear}
                    onChange={(e) => handleMonthSelect(e.target.value)}
                    className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-150"
                  >
                    {getMonthYearOptions().map((monthYear) => (
                      <option key={monthYear} value={monthYear}>
                        {monthYear}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            <section aria-labelledby="leave-reasons-heading">
              <h2 id="leave-reasons-heading" className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart2 className="h-6 w-6 text-teal-600" />
                Leave Reasons ({selectedMonthYear})
              </h2>
             
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                {leaveReasons.length > 0 ? (
                  <div className="grid gap-4">
                    {leaveReasons.map((reason) => (
                      <LeaveReasonCard
                        key={reason.id}
                        reason={reason}
                        onReconsiderApprove={handleReconsiderApprove}
                        onReconsiderReject={handleReconsiderReject}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64">
                    <Clock className="h-10 w-10 text-gray-400" />
                    <h3 className="mt-3 text-lg font-medium text-gray-900">No Leave Reasons</h3>
                    <p className="mt-1 text-sm text-gray-500 text-center px-4">
                      No approved or rejected leave requests found for {selectedMonthYear}.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </main>
      <style jsx global>{`
        @keyframes slide-down {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-down {
          animation: slide-down 0.5s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LeavesPage;
