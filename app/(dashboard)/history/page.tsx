"use client";
import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase";
import {
  RefreshCw,
  Search,
  User,
  XCircle,
  CheckCircle,
  Clock,
  History,
  ArrowDown,
  ArrowUp,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { saveAs } from "file-saver";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Work {
  accepted: boolean;
  assignedAt: number;
  assignedDay: string;
  completedAt?: number;
  name: string;
  place: string;
  status: "completed" | "pending" | "in-progress";
}

interface User {
  key: string;
  username: string;
  name: string;
  password: string;
  works: Work[];
}

// Date Picker Input Component
const DateInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  label: string;
  min?: string;
  max?: string;
}> = ({ value, onChange, label, min, max }) => (
  <div className="relative flex items-center w-36">
    <Input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min={min}
      max={max}
      className="w-full pr-7 rounded-lg border-gray-200 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
      aria-label={label}
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange("")}
        aria-label={`Clear ${label}`}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700 text-lg bg-white"
      >
        ×
      </button>
    )}
  </div>
);

// Work Card Component
const WorkCard: React.FC<{ work: Work; index: number }> = ({ work }) => {
  const formatTimestamp = (timestamp: number) =>
    timestamp ? format(new Date(timestamp), "MMM dd, yyyy, h:mm a") : "N/A";

  return (
    <div className="relative pl-6 mb-6 group animate-fade-in">
      <div className="absolute left-0 top-0 h-full w-0.5 bg-gradient-to-b from-indigo-400 to-purple-300 group-hover:from-indigo-600 group-hover:to-purple-500 transition-colors"></div>
      <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-indigo-500 border-2 border-white shadow-md -translate-x-2 group-hover:bg-indigo-700 transition-colors"></div>
      <Card className="ml-4 bg-gradient-to-br from-white via-gray-50 to-indigo-50 shadow-xl hover:shadow-2xl transition-shadow rounded-2xl border border-indigo-100">
        <CardHeader className="border-b border-gray-100 py-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
            <CardTitle className="text-lg font-bold text-gray-900 tracking-tight">
              <span className="text-indigo-700">{work.name}</span>
              <span className="text-gray-500 font-normal"> – {work.place}</span>
            </CardTitle>
            <Badge
              className={`text-sm font-semibold px-4 py-1 rounded-full shadow ${
                work.status === "completed"
                  ? "bg-green-100 text-green-800"
                  : work.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {work.status.charAt(0).toUpperCase() + work.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-3 space-y-2 text-gray-700">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-indigo-500" />
            <span>
              <strong>Assigned:</strong> {formatTimestamp(work.assignedAt)}{" "}
              <span className="text-gray-400 font-normal">
                ({work.assignedDay})
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-green-600" />
            <span>
              <strong>Completed:</strong>{" "}
              {work.completedAt ? (
                formatTimestamp(work.completedAt)
              ) : (
                <span className="text-red-500">Not yet completed</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle
              className={`h-4 w-4 ${work.accepted ? "text-green-500" : "text-red-500"}`}
            />
            <span>
              <strong>Accepted:</strong>{" "}
              {work.accepted ? (
                <span className="text-green-700">Yes</span>
              ) : (
                <span className="text-red-500">No</span>
              )}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Work History Modal Component
const WorkHistoryModal: React.FC<{
  user: User | null;
  onClose: () => void;
  monthFilter: string;
  yearFilter: string;
  fromDate: string;
  toDate: string;
  searchQuery: string;
  setMonthFilter: (v: string) => void;
  setYearFilter: (v: string) => void;
  setFromDate: (v: string) => void;
  setToDate: (v: string) => void;
  setSearchQuery: (v: string) => void;
  sortField: "assignedAt" | "status";
  sortOrder: "asc" | "desc";
  setSortField: (field: "assignedAt" | "status") => void;
  setSortOrder: (order: "asc" | "desc") => void;
  exportWorkHistory: (user: User, filteredWorks: Work[]) => void;
}> = ({
  user,
  onClose,
  monthFilter,
  yearFilter,
  fromDate,
  toDate,
  searchQuery,
  setMonthFilter,
  setYearFilter,
  setFromDate,
  setToDate,
  setSearchQuery,
  sortField,
  sortOrder,
  setSortField,
  setSortOrder,
  exportWorkHistory,
}) => {
  const [filteredWorks, setFilteredWorks] = useState<Work[]>([]);

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString().padStart(2, "0"),
    label: new Date(0, i).toLocaleString("default", { month: "long" }),
  }));

  const years = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - 5 + i;
    return { value: year.toString(), label: year.toString() };
  });

  useEffect(() => {
    if (!user || !user.works) return setFilteredWorks([]);
    let filtered = [...user.works];
    if (fromDate)
      filtered = filtered.filter(
        (w) => w.assignedAt >= new Date(fromDate).setHours(0, 0, 0, 0)
      );
    if (toDate)
      filtered = filtered.filter(
        (w) => w.assignedAt <= new Date(toDate).setHours(23, 59, 59, 999)
      );
    if (monthFilter && monthFilter !== "all") {
      filtered = filtered.filter((work) => {
        const workDate = new Date(work.assignedAt);
        const workMonth = (workDate.getMonth() + 1).toString().padStart(2, "0");
        return workMonth === monthFilter;
      });
    }
    if (yearFilter && yearFilter !== "all") {
      filtered = filtered.filter((work) => {
        const workDate = new Date(work.assignedAt);
        const workYear = workDate.getFullYear().toString();
        return workYear === yearFilter;
      });
    }
    if (searchQuery) {
      filtered = filtered.filter(
        (w) =>
          w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.place.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    filtered.sort((a, b) =>
      sortField === "assignedAt"
        ? sortOrder === "asc"
          ? a.assignedAt - b.assignedAt
          : b.assignedAt - a.assignedAt
        : sortOrder === "asc"
        ? a.status.localeCompare(b.status)
        : b.status.localeCompare(a.status)
    );
    setFilteredWorks(filtered);
  }, [user, monthFilter, yearFilter, fromDate, toDate, searchQuery, sortField, sortOrder]);

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl p-4 sm:p-8 overflow-y-auto max-h-[92vh] relative">
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 rounded-full transition"
        >
          <XCircle className="h-7 w-7" />
        </button>
        <div className="mb-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-indigo-900 tracking-tight flex-1">
            <span className="block sm:inline">Work History for </span>
            <span className="text-purple-700">{user.name}</span>
            <span className="font-normal text-gray-500 ml-1">
              ({user.username})
            </span>
          </h2>
          <Button
            onClick={() => exportWorkHistory(user, filteredWorks)}
            className="inline-flex items-center gap-2 rounded-lg text-sm font-medium h-10 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow"
          >
            <Download className="h-4 w-4" />
            Export Work History
          </Button>
        </div>
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="flex flex-wrap gap-2 items-center">
            <DateInput
              value={fromDate}
              onChange={setFromDate}
              label="From Date"
              max={toDate || undefined}
            />
            <DateInput
              value={toDate}
              onChange={setToDate}
              label="To Date"
              min={fromDate || undefined}
            />
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y.value} value={y.value}>
                    {y.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Search */}
          <div className="relative flex-1 min-w-[140px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search work history..."
              className="pl-9 w-full rounded-lg border-gray-200 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Sorting */}
          <Button
            variant="outline"
            onClick={() => {
              setSortField("assignedAt");
              setSortOrder(
                sortField === "assignedAt" && sortOrder === "asc" ? "desc" : "asc"
              );
            }}
            className="flex items-center gap-2 px-3 py-1 text-xs h-9 border-gray-200"
          >
            Sort by Date{" "}
            {sortField === "assignedAt" &&
              (sortOrder === "asc" ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              ))}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSortField("status");
              setSortOrder(
                sortField === "status" && sortOrder === "asc" ? "desc" : "asc"
              );
            }}
            className="flex items-center gap-2 px-3 py-1 text-xs h-9 border-gray-200"
          >
            Sort by Status{" "}
            {sortField === "status" &&
              (sortOrder === "asc" ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              ))}
          </Button>
        </div>
        {/* Timeline */}
        <div className="space-y-8">
          {filteredWorks.length > 0 ? (
            filteredWorks.map((work, idx) => (
              <WorkCard key={idx} work={work} index={idx} />
            ))
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed bg-gray-50">
              <User className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No work history found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || monthFilter !== "all" || yearFilter !== "all" || fromDate || toDate
                  ? "Try adjusting your filters"
                  : "No work history available for this employee"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Notification Component
const Notification: React.FC<{ message: string; type: "success" | "error" }> = ({
  message,
  type,
}) => (
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

// Main Work History Page Component
const WorkHistoryPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<"assignedAt" | "status">(
    "assignedAt"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch Users from Firebase
  useEffect(() => {
    setIsLoading(true);
    const usersRef = ref(database, "users");
    const unsubscribe = onValue(
      usersRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const usersData = snapshot.val();
            const usersList: User[] = Object.keys(usersData)
              .map((key) => {
                const userData = usersData[key];
                const username = userData.username || key;
                return {
                  key,
                  username,
                  name: userData.name || username,
                  password: userData.password || "",
                  works: userData.works || [],
                };
              })
              .filter((user) => user.username.length <= 25);
            setUsers(usersList);
          } else {
            setUsers([]);
            setNotification({
              message:
                "No users found in the database. Please add users to the 'users' path.",
              type: "error",
            });
          }
          setIsLoading(false);
        } catch (err) {
          setNotification({
            message:
              "Failed to load users. Please check your database connection.",
            type: "error",
          });
          setIsLoading(false);
        }
      },
      (err) => {
        setNotification({
          message:
            "Failed to listen for users. Please check your database configuration.",
          type: "error",
        });
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleViewWorkHistory = (user: User) => setSelectedUser(user);

  const handleCloseModal = () => {
    setSelectedUser(null);
    setMonthFilter("all");
    setYearFilter("all");
    setFromDate("");
    setToDate("");
    setSearchQuery("");
    setSortField("assignedAt");
    setSortOrder("desc");
  };

  const exportWorkHistory = (user: User, filteredWorks: Work[]) => {
    const csvData = filteredWorks.map((work) => ({
      Name: work.name,
      Place: work.place,
      Status: work.status,
      Assigned: format(new Date(work.assignedAt), "MMM dd, yyyy, h:mm a"),
      AssignedDay: work.assignedDay,
      Completed: work.completedAt
        ? format(new Date(work.completedAt), "MMM dd, yyyy, h:mm a")
        : "Not yet completed",
      Accepted: work.accepted ? "Yes" : "No",
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${user.username}_work_history.csv`);
    setNotification({
      message: `Work history for ${user.username} exported successfully!`,
      type: "success",
    });
  };

  const exportAllWorkHistory = () => {
    let allWorks: Array<{
      Username: string;
      Name: string;
      WorkName: string;
      Place: string;
      Status: string;
      Assigned: string;
      AssignedDay: string;
      Completed: string;
      Accepted: string;
    }> = [];

    users.forEach((user) => {
      let filteredWorks = [...user.works];
      if (monthFilter !== "all") {
        filteredWorks = filteredWorks.filter((work) => {
          const workDate = new Date(work.assignedAt);
          const workMonth = (workDate.getMonth() + 1)
            .toString()
            .padStart(2, "0");
          return workMonth === monthFilter;
        });
      }
      if (yearFilter !== "all") {
        filteredWorks = filteredWorks.filter((work) => {
          const workDate = new Date(work.assignedAt);
          const workYear = workDate.getFullYear().toString();
          return workYear === yearFilter;
        });
      }
      if (fromDate)
        filteredWorks = filteredWorks.filter(
          (w) => w.assignedAt >= new Date(fromDate).setHours(0, 0, 0, 0)
        );
      if (toDate)
        filteredWorks = filteredWorks.filter(
          (w) => w.assignedAt <= new Date(toDate).setHours(23, 59, 59, 999)
        );

      const userWorks = filteredWorks.map((work) => ({
        Username: user.username,
        Name: user.name,
        WorkName: work.name,
        Place: work.place,
        Status: work.status,
        Assigned: format(new Date(work.assignedAt), "MMM dd, yyyy, h:mm a"),
        AssignedDay: work.assignedDay,
        Completed: work.completedAt
          ? format(new Date(work.completedAt), "MMM dd, yyyy, h:mm a")
          : "Not yet completed",
        Accepted: work.accepted ? "Yes" : "No",
      }));

      allWorks = [...allWorks, ...userWorks];
    });

    const csv = Papa.unparse(allWorks);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "all_users_work_history.csv");
    setNotification({
      message: "All users' work history exported successfully!",
      type: "success",
    });
  };

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 pt-20">
      <div className="bg-gradient-to-r from-indigo-700 to-purple-500 p-6 sm:p-8 rounded-b-3xl shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow-lg">
            Employee Work History
          </h1>
          <Button
            onClick={exportAllWorkHistory}
            className="inline-flex items-center gap-2 rounded-lg text-sm font-medium h-10 px-4 bg-white text-indigo-700 hover:bg-gray-100 shadow"
          >
            <Download className="h-4 w-4" />
            Export All Work History
          </Button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-8 -mt-8">
        {notification && (
          <Notification message={notification.message} type={notification.type} />
        )}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-5 sm:p-8 mb-8 mt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Employees</h2>
            <div className="flex gap-2 mt-4 sm:mt-0">
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => ({
                    value: (i + 1).toString().padStart(2, "0"),
                    label: new Date(0, i).toLocaleString("default", {
                      month: "long",
                    }),
                  })).map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() - 5 + i;
                    return { value: year.toString(), label: year.toString() };
                  }).map((y) => (
                    <SelectItem key={y.value} value={y.value}>
                      {y.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Username</TableHead>
                    <TableHead className="w-1/3">Name</TableHead>
                    <TableHead className="w-1/3">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow
                      key={user.key}
                      className="hover:bg-indigo-50 transition-colors text-base"
                    >
                      <TableCell className="font-bold text-indigo-900">
                        {user.username}
                      </TableCell>
                      <TableCell className="font-semibold text-gray-800">
                        {user.name}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleViewWorkHistory(user)}
                          className="inline-flex items-center gap-2 rounded-lg text-sm font-medium h-10 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow"
                        >
                          <History className="h-4 w-4" />
                          Work History
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed bg-gray-50">
              <User className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No employees found</h3>
              <p className="text-sm text-muted-foreground text-center">
                No employees with valid usernames available in the database.
                <br />
                Please ensure users are added under the 'users' path with a
                'username' field that is not longer than 25 characters.
              </p>
            </div>
          )}
        </div>
        {selectedUser && (
          <WorkHistoryModal
            user={selectedUser}
            onClose={handleCloseModal}
            monthFilter={monthFilter}
            yearFilter={yearFilter}
            fromDate={fromDate}
            toDate={toDate}
            searchQuery={searchQuery}
            setMonthFilter={setMonthFilter}
            setYearFilter={setYearFilter}
            setFromDate={setFromDate}
            setToDate={setToDate}
            setSearchQuery={setSearchQuery}
            sortField={sortField}
            sortOrder={sortOrder}
            setSortField={setSortField}
            setSortOrder={setSortOrder}
            exportWorkHistory={exportWorkHistory}
          />
        )}
      </div>
    </div>
  );
};

export default WorkHistoryPage;
