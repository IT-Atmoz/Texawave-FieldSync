"use client";
import React, { useState, useEffect, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase";
import {
  RefreshCw,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
} from "lucide-react";
import Chart from "chart.js/auto";
import { format } from "date-fns";
import { saveAs } from "file-saver";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReportCard from "./ReportCard";
import Notification from "./Notification";

interface User {
  name: string;
  username: string;
}

interface Report {
  id: string;
  type: string;
  content: string;
  photoUrl?: string;
  timestamp: number;
  date: string;
}

const getDateKey = (date: Date) => date.toISOString().split("T")[0];

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const DailyReportsPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsername, setSelectedUsername] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userSubmissionStatus, setUserSubmissionStatus] = useState<{
    [username: string]: boolean;
  }>({});
  const [submittedCount, setSubmittedCount] = useState(0);

  // Chart.js reference
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const doughnutChartRef = useRef<any>(null);

  // Fetch users
  useEffect(() => {
    const usersRef = ref(database, "users");
    const unsubscribe = onValue(
      usersRef,
      (snapshot) => {
        const usersData = snapshot.val();
        const usersList = Object.keys(usersData || {})
          .map((uid) => ({
            name: usersData[uid].name || usersData[uid].username || uid,
            username: usersData[uid].username || uid,
          }))
          .filter((user) => user.name && user.username);
        setUsers(usersList);
        // Select "rohit" by default if available
        if (usersList.some((u) => u.username === "rohit")) {
          setSelectedUsername("rohit");
        }
        setIsLoading(false);
      },
      () => {
        setNotification({ message: "Failed to load users", type: "error" });
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Initialize date range to today
  useEffect(() => {
    if (!dateFrom && !dateTo) {
      const today = new Date();
      setDateFrom(today);
      setDateTo(today);
    }
  }, [dateFrom, dateTo]);

  // Submission status for all users in date range
  useEffect(() => {
    if (!users.length || !dateFrom || !dateTo) return;

    const dates: string[] = [];
    let d = new Date(dateFrom);
    while (d <= dateTo) {
      dates.push(getDateKey(d));
      d = addDays(d, 1);
    }

    let status: { [username: string]: boolean } = {};
    let completed = 0;
    let submittedUsers = 0;

    users.forEach((user) => {
      let hasReport = false;
      let checkedDates = 0;
      dates.forEach((dateKey) => {
        const reportsRef = ref(
          database,
          `dailyReports/${user.username}/${dateKey}`
        );
        onValue(
          reportsRef,
          (snapshot) => {
            checkedDates++;
            if (snapshot.exists()) hasReport = true;
            if (checkedDates === dates.length) {
              status[user.username] = hasReport;
              if (hasReport) submittedUsers++;
              completed++;
              if (completed === users.length) {
                setUserSubmissionStatus(status);
                setSubmittedCount(submittedUsers);
              }
            }
          },
          { onlyOnce: true }
        );
      });
    });
  }, [users, dateFrom, dateTo]);

  // Fetch reports for selected user and date range
  useEffect(() => {
    if (!selectedUsername || !dateFrom || !dateTo) {
      setReports([]);
      return;
    }

    const dates: string[] = [];
    let d = new Date(dateFrom);
    while (d <= dateTo) {
      dates.push(getDateKey(d));
      d = addDays(d, 1);
    }

    let collected: Report[] = [];
    let fetched = 0;
    dates.forEach((dateKey) => {
      const reportsRef = ref(
        database,
        `dailyReports/${selectedUsername}/${dateKey}`
      );
      onValue(
        reportsRef,
        (snapshot) => {
          const reportsData = snapshot.val();
          if (reportsData) {
            Object.entries(reportsData).forEach(([id, r]: any) => {
              collected.push({
                id,
                type: r.type,
                content: r.content,
                photoUrl: r.photoUrl,
                timestamp: r.timestamp,
                date: dateKey,
              });
            });
          }
          fetched++;
          if (fetched === dates.length) {
            collected.sort((a, b) => b.timestamp - a.timestamp);
            setReports(collected);
          }
        },
        { onlyOnce: true }
      );
    });
  }, [selectedUsername, dateFrom, dateTo]);

  // Chart
  useEffect(() => {
    if (!chartRef.current) return;
    if (doughnutChartRef.current) doughnutChartRef.current.destroy();
    const total = users.length;
    const submitted = submittedCount;
    doughnutChartRef.current = new Chart(chartRef.current, {
      type: "doughnut",
      data: {
        labels: ["Submitted", "Pending"],
        datasets: [
          {
            data: [submitted, Math.max(0, total - submitted)],
            backgroundColor: ["#22d3ee", "#e5e7eb"],
            borderWidth: 0,
            hoverOffset: 10,
          },
        ],
      },
      options: {
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true },
        },
        cutout: "75%",
        maintainAspectRatio: false,
      },
      plugins: [
        {
          id: "centerText",
          afterDraw: (chart: any) => {
            const { ctx, chartArea } = chart;
            ctx.save();
            ctx.font = "bold 2rem Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#0e7490";
            ctx.fillText(
              total ? `${Math.round((submitted / total) * 100)}%` : "0%",
              chart.width / 2,
              chart.height / 2
            );
          },
        },
      ],
    });
  }, [users.length, submittedCount]);

  // Handlers
  const handleUserSelect = (value: string) => setSelectedUsername(value);
  const handleDateFrom = (e: React.ChangeEvent<HTMLInputElement>) =>
    setDateFrom(e.target.value ? new Date(e.target.value) : null);
  const handleDateTo = (e: React.ChangeEvent<HTMLInputElement>) =>
    setDateTo(e.target.value ? new Date(e.target.value) : null);

  // Export individual user reports
  const exportUserReports = () => {
    if (!selectedUsername || !reports.length) {
      setNotification({
        message: "No reports available to export for the selected user.",
        type: "error",
      });
      return;
    }

    const csvData = reports.map((report) => ({
      Date: report.date,
      Type: report.type,
      Content: report.content,
      Timestamp: format(new Date(report.timestamp), "MMM dd, yyyy, h:mm a"),
      PhotoUrl: report.photoUrl || "N/A",
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${selectedUsername}_daily_reports.csv`);
    setNotification({
      message: `Reports for ${selectedUsername} exported successfully!`,
      type: "success",
    });
  };

  // Export all users' reports
  const exportAllReports = () => {
    if (!users.length || !dateFrom || !dateTo) {
      setNotification({
        message: "No data available to export.",
        type: "error",
      });
      return;
    }

    const dates: string[] = [];
    let d = new Date(dateFrom);
    while (d <= dateTo) {
      dates.push(getDateKey(d));
      d = addDays(d, 1);
    }

    let allReports: Array<{
      Username: string;
      Name: string;
      Date: string;
      Type: string;
      Content: string;
      Timestamp: string;
      PhotoUrl: string;
    }> = [];
    let completedUsers = 0;

    users.forEach((user) => {
      let fetchedDates = 0;
      dates.forEach((dateKey) => {
        const reportsRef = ref(
          database,
          `dailyReports/${user.username}/${dateKey}`
        );
        onValue(
          reportsRef,
          (snapshot) => {
            const reportsData = snapshot.val();
            if (reportsData) {
              Object.entries(reportsData).forEach(([id, r]: any) => {
                allReports.push({
                  Username: user.username,
                  Name: user.name,
                  Date: dateKey,
                  Type: r.type,
                  Content: r.content,
                  Timestamp: format(
                    new Date(r.timestamp),
                    "MMM dd, yyyy, h:mm a"
                  ),
                  PhotoUrl: r.photoUrl || "N/A",
                });
              });
            }
            fetchedDates++;
            if (fetchedDates === dates.length) {
              completedUsers++;
              if (completedUsers === users.length) {
                const csv = Papa.unparse(allReports);
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                saveAs(blob, "all_users_daily_reports.csv");
                setNotification({
                  message: "All users' reports exported successfully!",
                  type: "success",
                });
              }
            }
          },
          { onlyOnce: true }
        );
      });
    });
  };

  // Range display
  let rangeString = "";
  if (dateFrom && dateTo) {
    rangeString = `${getDateKey(dateFrom)} to ${getDateKey(dateTo)}`;
  }

  // User status lists
  const submittedUsersList = users.filter((u) => userSubmissionStatus[u.username]);
  const pendingUsersList = users.filter(
    (u) => !userSubmissionStatus[u.username]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 sm:py-8 flex flex-col items-center">
        <div className="flex items-center gap-2 text-gray-600">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-indigo-100 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 space-y-6">
        <div className="bg-gradient-to-r from-cyan-700 to-indigo-600 p-6 sm:p-8 rounded-b-3xl shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow-lg">
              Employee Daily Reports
            </h1>
            <div className="flex gap-2">
              <Button
                onClick={() => location.reload()}
                className="inline-flex items-center gap-2 rounded-lg text-sm font-medium h-10 px-4 bg-white text-cyan-700 hover:bg-gray-100 shadow"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                onClick={exportAllReports}
                className="inline-flex items-center gap-2 rounded-lg text-sm font-medium h-10 px-4 bg-white text-cyan-700 hover:bg-gray-100 shadow"
              >
                <Download className="h-4 w-4" />
                Export All Reports
              </Button>
            </div>
          </div>
        </div>
        {notification && (
          <Notification message={notification.message} type={notification.type} />
        )}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel */}
          <div className="space-y-6">
            {/* Employee Select */}
            <div className="bg-white p-5 rounded-2xl shadow-xl border border-cyan-100">
              <h2 className="text-base font-semibold mb-2 text-gray-700">
                Select Employee
              </h2>
              <Select value={selectedUsername} onValueChange={handleUserSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select an employee</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.username} value={u.username}>
                      {u.name} ({u.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Date Range */}
            <div className="bg-white p-5 rounded-2xl shadow-xl border border-cyan-100 flex flex-col gap-4">
              <h2 className="text-base font-semibold mb-2 text-gray-700">
                Select Date Range
              </h2>
              <div className="flex gap-3">
                <Input
                  type="date"
                  value={dateFrom ? getDateKey(dateFrom) : ""}
                  onChange={handleDateFrom}
                  className="rounded-lg border-gray-200 shadow-sm focus:ring-cyan-500 focus:border-cyan-500 w-1/2"
                  max={dateTo ? getDateKey(dateTo) : ""}
                />
                <Input
                  type="date"
                  value={dateTo ? getDateKey(dateTo) : ""}
                  onChange={handleDateTo}
                  className="rounded-lg border-gray-200 shadow-sm focus:ring-cyan-500 focus:border-cyan-500 w-1/2"
                  min={dateFrom ? getDateKey(dateFrom) : ""}
                />
              </div>
              {dateFrom && dateTo && (
                <div className="text-xs text-gray-500 text-center">
                  Range: {rangeString}
                </div>
              )}
            </div>
            {/* Chart and User List */}
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-cyan-100 flex flex-col items-center">
              <h2 className="text-base font-semibold mb-4 text-gray-700">
                Submission Chart
              </h2>
              <div
                className="flex-1 w-full flex items-center justify-center mb-2"
                style={{ minHeight: 180 }}
              >
                <canvas
                  ref={chartRef}
                  style={{ maxHeight: 180, maxWidth: "100%" }}
                />
              </div>
              <p className="text-center text-base font-semibold mb-2 mt-1 text-cyan-600">
                {submittedCount} / {users.length} submitted
              </p>
              <div className="w-full mt-2">
                {submittedUsersList.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-cyan-800 mb-1 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />{" "}
                      Submitted:
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {submittedUsersList.map((u) => (
                        <span
                          key={u.username}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 shadow-sm border border-green-200"
                        >
                          <Users className="h-3 w-3" /> {u.name}{" "}
                          <span className="text-xs opacity-60">
                            ({u.username})
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {pendingUsersList.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                      <Clock className="h-4 w-4 text-amber-500" /> Pending:
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {pendingUsersList.map((u) => (
                        <span
                          key={u.username}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800 shadow-sm border border-amber-200"
                        >
                          <AlertCircle className="h-3 w-3" /> {u.name}{" "}
                          <span className="text-xs opacity-60">
                            ({u.username})
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {submittedUsersList.length === 0 &&
                  pendingUsersList.length === 0 && (
                    <div className="text-sm text-gray-400 text-center">
                      No users found for the range.
                    </div>
                  )}
              </div>
            </div>
          </div>
          {/* Right Panel */}
          <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-xl border border-cyan-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-cyan-800">
                {selectedUsername
                  ? `${
                      users.find((u) => u.username === selectedUsername)?.name ||
                      selectedUsername
                    }'s Reports${rangeString ? ` (${rangeString})` : ""}`
                  : "Select an employee to view reports"}
              </h2>
              {selectedUsername && reports.length > 0 && (
                <Button
                  onClick={exportUserReports}
                  className="inline-flex items-center gap-2 rounded-lg text-sm font-medium h-10 px-4 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:from-cyan-600 hover:to-indigo-700 shadow"
                >
                  <Download className="h-4 w-4" />
                  Export Reports
                </Button>
              )}
            </div>
            {reports.length > 0 ? (
              <div className="space-y-4">
                {reports.map((r) => (
                  <ReportCard key={r.id + r.date} report={r} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <Clock className="w-10 h-10 mb-2" />
                <p>No reports found for this range.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyReportsPage;
