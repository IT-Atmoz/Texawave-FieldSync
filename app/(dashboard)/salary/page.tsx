"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ref, onValue, set, get, query, limitToFirst } from "firebase/database";
import { database } from "@/lib/firebase";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveAs } from "file-saver";
import SalaryOverview from "./SalaryOverview";
import PayrollProcessing from "./PayrollProcessing";
import SalaryAnalytics from "./SalaryAnalytics";
import SalaryHistory from "./SalaryHistory";
import SalaryEditModal from "./SalaryEditModal";
import { Button } from "./Button";
import debounce from "lodash/debounce";

// Interface Definitions
interface User {
  uid: string;
  name: string;
  username: string;
  role: string;
  department: string;
}

interface Bonus {
  name: string;
  amount: number;
}

interface Deduction {
  name: string;
  amount: number;
  isStatutory: boolean;
}

interface SalaryRecord {
  yearMonth: string;
  baseSalary: number;
  overtimeHours: number;
  overtimePay: number;
  allowances: Bonus[];
  deductions: Deduction[];
  netSalary: number;
  paymentStatus: "pending" | "paid" | "disputed";
  calculatedAt: number;
  attendanceDays: number;
  compliance: { pf: number; esi: number; tds: number };
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

interface UserSalary extends User {
  salary: SalaryRecord | null;
  leaveDays: number;
  workingDays: number; // Added for total working days
}

// Input Component
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, type, ...props }) => (
  <input
    type={type}
    className={cn(
      "flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200",
      className
    )}
    {...props}
  />
);

// SalaryTable Component
const SalaryTable: React.FC<{
  userSalaries: UserSalary[];
  searchQuery: string;
  onEdit: (user: User, salary: SalaryRecord | null) => void;
  onBulkMarkPaid: (userIds: string[]) => void;
}> = ({ userSalaries, searchQuery, onEdit, onBulkMarkPaid }) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const handleSelectUser = (uid: string) => {
    setSelectedUsers((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === userSalaries.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(userSalaries.map((user) => user.uid));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => onBulkMarkPaid(selectedUsers)}
          disabled={selectedUsers.length === 0}
          className={cn(
            "px-4 py-2 rounded-lg",
            selectedUsers.length === 0 ? "bg-gray-300" : "bg-teal-600 text-white hover:bg-teal-700"
          )}
        >
          Mark Selected as Paid
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === userSalaries.length && userSalaries.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Working Days</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Salary</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Salary</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Days</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {userSalaries.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-4 text-center text-sm text-gray-500">
                  No records found
                </td>
              </tr>
            ) : (
              userSalaries.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.uid)}
                      onChange={() => handleSelectUser(user.uid)}
                    />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{user.username}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{user.department}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{user.workingDays}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{user.salary?.baseSalary.toLocaleString() || 0}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{user.salary?.netSalary.toLocaleString() || 0}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{user.leaveDays}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={cn(
                        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                        user.salary?.paymentStatus === "paid" && "bg-green-100 text-green-800",
                        user.salary?.paymentStatus === "pending" && "bg-yellow-100 text-yellow-800",
                        user.salary?.paymentStatus === "disputed" && "bg-red-100 text-red-800"
                      )}
                    >
                      {user.salary?.paymentStatus || "pending"}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      onClick={() => onEdit(user, user.salary)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Main SalaryPage Component
const SalaryPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [userSalaries, setUserSalaries] = useState<UserSalary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("overview");

  const [editSalary, setEditSalary] = useState<{
    baseSalary: string;
    overtimeHours: string;
    overtimePay: string;
    allowances: Bonus[];
    deductions: Deduction[];
    paymentStatus: "pending" | "paid" | "disputed";
  }>({
    baseSalary: "0",
    overtimeHours: "0",
    overtimePay: "0",
    allowances: [],
    deductions: [],
    paymentStatus: "pending",
  });

  // Realtime clock for IST
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour12: false,
      };
      setCurrentTime(now.toLocaleString("en-IN", options));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch users
  useEffect(() => {
    const usersRef = query(ref(database, "users"), limitToFirst(100));
    const unsubscribe = onValue(
      usersRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const usersData = snapshot.val();
          const usersList = Object.keys(usersData)
            .map((uid) => ({
              uid: usersData[uid].username, // Use username as uid to match attendance table
              name: usersData[uid].name || "",
              username: usersData[uid].username || "",
              role: usersData[uid].role || "worker",
              department: usersData[uid].department || "General",
            }))
            .filter(
              (user) =>
                user.name &&
                user.name.trim() !== "" &&
                user.username &&
                user.username.trim() !== ""
            );
          const uniqueUsers: User[] = [];
          const seenUsernames = new Set<string>();
          usersList.forEach((user) => {
            if (!seenUsernames.has(user.username)) {
              seenUsernames.add(user.username);
              uniqueUsers.push(user);
            }
          });
          setUsers(uniqueUsers);
        } else {
          setUsers([]);
          setNotification({ message: "No employees found", type: "error" });
        }
        setIsLoading(false);
      },
      (error) => {
        setNotification({ message: "Failed to fetch employees: " + error.message, type: "error" });
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch salary, attendance, and leave data
  useEffect(() => {
    if (!users.length) {
      setUserSalaries([]);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch salary data
        const salaryRef = ref(database, "salaries");
        const salarySnapshot = await get(salaryRef);
        const salaryData = salarySnapshot.exists() ? salarySnapshot.val() : {};

        // Fetch attendance data
        const [year, month] = selectedMonth.split("-").map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();
        const attendancePromises = [];
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${selectedMonth}-${day.toString().padStart(2, "0")}`;
          const attendanceRef = ref(database, `attendance/${dateStr}`);
          attendancePromises.push(get(attendanceRef));
        }
        const attendanceSnapshots = await Promise.all(attendancePromises);
        const attendanceData: { [date: string]: { [username: string]: { status: string } } } = {};
        attendanceSnapshots.forEach((snapshot, index) => {
          if (snapshot.exists()) {
            const dateStr = `${selectedMonth}-${(index + 1).toString().padStart(2, "0")}`;
            attendanceData[dateStr] = snapshot.val();
          }
        });

        // Fetch leave requests
        const leaveRequestsRef = ref(database, "leaveRequests");
        const leaveSnapshot = await get(leaveRequestsRef);
        const leaveData = leaveSnapshot.exists() ? leaveSnapshot.val() : {};

        // Calculate leave days and working days for each user
        const leaveDaysMap: { [username: string]: number } = {};
        const workingDaysMap: { [username: string]: number } = {};
        users.forEach((user) => {
          leaveDaysMap[user.username] = 0;
          workingDaysMap[user.username] = 0;
        });

        // Calculate leave days
        Object.entries(leaveData).forEach(([username, userRequests]) => {
          Object.entries(userRequests as { [id: string]: LeaveRequest }).forEach(([_, request]) => {
            if (request.status !== "approved") return;
            const startDate = new Date(request.startDate);
            const endDate = new Date(request.endDate);
            const monthStart = new Date(year, month - 1, 1);
            const monthEnd = new Date(year, month, 0);
            let currentDate = new Date(Math.max(startDate.getTime(), monthStart.getTime()));
            const end = new Date(Math.min(endDate.getTime(), monthEnd.getTime()));
            while (currentDate <= end) {
              leaveDaysMap[username] = (leaveDaysMap[username] || 0) + 1;
              currentDate.setDate(currentDate.getDate() + 1);
            }
          });
        });

        // Calculate working days from attendance
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${selectedMonth}-${day.toString().padStart(2, "0")}`;
          if (attendanceData[dateStr]) {
            Object.keys(attendanceData[dateStr]).forEach((username) => {
              if (attendanceData[dateStr][username].status === "present") {
                workingDaysMap[username] = (workingDaysMap[username] || 0) + 1;
              }
            });
          }
        }

        // Combine data
        const updatedUserSalaries = users.map((user) => {
          const userSalary = salaryData[user.username]?.[selectedMonth] || null;
          return {
            ...user,
            salary: userSalary || {
              yearMonth: selectedMonth,
              baseSalary: 0,
              overtimeHours: 0,
              overtimePay: 0,
              allowances: [],
              deductions: [],
              netSalary: 0,
              paymentStatus: "pending",
              calculatedAt: 0,
              attendanceDays: workingDaysMap[user.username] || 0,
              compliance: { pf: 0, esi: 0, tds: 0 },
            },
            leaveDays: leaveDaysMap[user.username] || 0,
            workingDays: workingDaysMap[user.username] || 0,
          };
        });

        setUserSalaries(updatedUserSalaries);
        setIsLoading(false);
      } catch (error) {
        setNotification({ message: "Failed to fetch data: " + error.message, type: "error" });
        setIsLoading(false);
      }
    };

    fetchData();
  }, [users, selectedMonth]);

  // Clear notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Debounced search handler
  const debouncedSetSearchQuery = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
    }, 300),
    []
  );

  // Handle edit salary
  const handleEditSalary = useCallback((user: User, salary: SalaryRecord | null) => {
    setSelectedUser(user);
    setEditSalary({
      baseSalary: salary ? salary.baseSalary.toString() : "0",
      overtimeHours: salary ? salary.overtimeHours.toString() : "0",
      overtimePay: salary ? salary.overtimePay.toString() : "0",
      allowances: salary ? salary.allowances : [],
      deductions: salary ? salary.deductions : [],
      paymentStatus: salary ? salary.paymentStatus : "pending",
    });
    setShowEditModal(true);
  }, []);

  // Save salary
  const handleSaveSalary = async () => {
    if (!selectedUser) return;
    const baseSalary = parseFloat(editSalary.baseSalary);
    const overtimeHours = parseFloat(editSalary.overtimeHours);
    const overtimePay = parseFloat(editSalary.overtimePay);
    if (
      isNaN(baseSalary) ||
      baseSalary < 0 ||
      isNaN(overtimeHours) ||
      overtimeHours < 0 ||
      isNaN(overtimePay) ||
      overtimePay < 0
    ) {
      setNotification({ message: "Invalid salary or overtime values", type: "error" });
      return;
    }
    const pf = baseSalary * 0.12;
    const esi = baseSalary <= 21000 ? baseSalary * 0.0325 : 0;
    const netSalary =
      baseSalary +
      overtimePay +
      editSalary.allowances.reduce((sum, a) => sum + a.amount, 0) -
      editSalary.deductions.reduce((sum, d) => sum + d.amount, 0) -
      pf -
      esi;
    if (netSalary < 0) {
      setNotification({ message: "Net salary cannot be negative", type: "error" });
      return;
    }
    try {
      const salaryRef = ref(database, `salaries/${selectedUser.username}/${selectedMonth}`);
      const salaryData: SalaryRecord = {
        yearMonth: selectedMonth,
        baseSalary,
        overtimeHours,
        overtimePay,
        allowances: editSalary.allowances,
        deductions: editSalary.deductions,
        netSalary,
        paymentStatus: editSalary.paymentStatus,
        calculatedAt: Date.now(),
        attendanceDays: userSalaries.find((u) => u.uid === selectedUser.uid)?.workingDays || 0,
        compliance: { pf, esi, tds: 0 },
      };
      await set(salaryRef, salaryData);
      setUserSalaries((prev) =>
        prev.map((u) =>
          u.uid === selectedUser.uid
            ? { ...u, salary: salaryData, leaveDays: u.leaveDays, workingDays: u.workingDays }
            : u
        )
      );
      setShowEditModal(false);
      setNotification({ message: "Salary updated successfully", type: "success" });
    } catch (error) {
      setNotification({ message: "Failed to update salary", type: "error" });
    }
  };

  // Bulk mark as paid
  const handleBulkMarkPaid = async (userIds: string[]) => {
    try {
      const updates: { [key: string]: SalaryRecord } = {};
      for (const uid of userIds) {
        const userSalary = userSalaries.find((u) => u.uid === uid)?.salary;
        if (!userSalary) continue;
        updates[`salaries/${uid}/${selectedMonth}`] = {
          ...userSalary,
          paymentStatus: "paid",
          calculatedAt: Date.now(),
        };
      }
      await Promise.all(
        Object.entries(updates).map(([path, data]) => set(ref(database, path), data))
      );
      setUserSalaries((prev) =>
        prev.map((u) =>
          userIds.includes(u.uid) && u.salary
            ? { ...u, salary: { ...u.salary, paymentStatus: "paid", calculatedAt: Date.now() } }
            : u
        )
      );
      setNotification({ message: "Selected salaries marked as paid", type: "success" });
    } catch (error) {
      setNotification({ message: "Failed to mark salaries as paid", type: "error" });
    }
  };

  // Export CSV
  const handleExportCSV = useCallback(() => {
    const headers = [
      "Name",
      "Username",
      "Role",
      "Department",
      "Working Days",
      "Base Salary",
      "Overtime Pay",
      "Allowances",
      "Deductions",
      "PF",
      "ESI",
      "Net Salary",
      "Payment Status",
      "Attendance Days",
      "Leave Days",
    ];
    const rows = userSalaries.map((user) => [
      user.name,
      user.username,
      user.role,
      user.department,
      user.workingDays,
      user.salary?.baseSalary || 0,
      user.salary?.overtimePay || 0,
      user.salary?.allowances.map((a) => `${a.name}: ${a.amount}`).join("; ") || "",
      user.salary?.deductions.map((d) => `${d.name}: ${d.amount}`).join("; ") || "",
      user.salary?.compliance?.pf || 0,
      user.salary?.compliance?.esi || 0,
      user.salary?.netSalary || 0,
      user.salary?.paymentStatus || "pending",
      user.salary?.attendanceDays || 0,
      user.leaveDays,
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `salaries_${selectedMonth}.csv`);
  }, [userSalaries, selectedMonth]);

  // Generate payslips
  const handleGeneratePayslips = useCallback(() => {
    setNotification({ message: "Payslips generation started", type: "success" });
    // Implement PDF generation logic here
  }, []);

  // Department salary analytics
  const departmentSalaries = useMemo(() => {
    if (!userSalaries.length) return [];
    const departments: { [key: string]: number } = {};
    userSalaries.forEach((user) => {
      const salary = user.salary?.netSalary || 0;
      departments[user.department] = (departments[user.department] || 0) + salary;
    });
    return Object.keys(departments).map((department) => ({
      department,
      totalSalary: departments[department],
    }));
  }, [userSalaries]);

  // Memoized filtered salaries
  const filteredUserSalaries = useMemo(() => {
    if (!searchQuery) return userSalaries;
    const lowerQuery = searchQuery.toLowerCase();
    return userSalaries.filter(
      (user) =>
        user.name.toLowerCase().includes(lowerQuery) ||
        user.username.toLowerCase().includes(lowerQuery) ||
        user.department.toLowerCase().includes(lowerQuery)
    );
  }, [userSalaries, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 font-roboto">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Salary Management
          </h1>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm text-sm sm:text-base font-medium text-gray-800">
            {currentTime} IST
          </div>
        </div>
        {notification && (
          <div
            className={cn(
              "flex items-center gap-2 p-3 rounded-lg mb-6 w-full max-w-md mx-auto",
              notification.type === "error" ? "bg-red-100 text-red-800 shadow-md" : "bg-green-100 text-green-800 shadow-md"
            )}
          >
            {notification.type === "error" ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        )}
        {isLoading ? (
          <div className="text-center text-gray-600">Loading...</div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
            <TabsList className="flex justify-center sm:justify-start bg-gray-200 p-1 rounded-lg">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="salaries"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2"
              >
                Employee Salaries
              </TabsTrigger>
{/*               <TabsTrigger
                value="processing"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2"
              >
                Payroll Processing
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2"
              >
                Analytics
              </TabsTrigger> */}
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2"
              >
                History
              </TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <SalaryOverview
                totalPayroll={userSalaries.reduce((sum, u) => sum + (u.salary?.netSalary || 0), 0)}
                paidCount={userSalaries.filter((u) => u.salary?.paymentStatus === "paid").length}
                pendingCount={userSalaries.filter((u) => u.salary?.paymentStatus === "pending").length}
                disputedCount={userSalaries.filter((u) => u.salary?.paymentStatus === "disputed").length}
              />
            </TabsContent>
            <TabsContent value="salaries" className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by name, username, or department"
                    onChange={(e) => debouncedSetSearchQuery(e.target.value)}
                    className="pl-10 mb-4 flex-1"
                  />
                </div>
                <div className="w-full sm:w-48">
                  <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Month
                  </label>
                  <div className="relative">
                    <Input
                      id="month-select"
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
              <SalaryTable
                userSalaries={filteredUserSalaries}
                searchQuery={searchQuery}
                onEdit={handleEditSalary}
                onBulkMarkPaid={handleBulkMarkPaid}
              />
            </TabsContent>
{/*             <TabsContent value="processing" className="space-y-4">
              <PayrollProcessing
                onGeneratePayslips={handleGeneratePayslips}
                onExportCSV={handleExportCSV}
              />
            </TabsContent> */}
{/*             <TabsContent value="analytics" className="space-y-4">
              <SalaryAnalytics departmentSalaries={departmentSalaries} />
            </TabsContent> */}
            <TabsContent value="history" className="space-y-4">
              {activeTab === "history" && <SalaryHistory users={users} />}
            </TabsContent>
          </Tabs>
        )}
        {showEditModal && selectedUser && (
          <SalaryEditModal
            user={selectedUser}
            salary={editSalary}
            onChange={(field, value) => {
              if (field.startsWith("allowances") || field.startsWith("deductions")) {
                const [key, index, subKey] = field.match(/(\w+)\[(\d+)\]\.(\w+)/)?.slice(1) || [];
                if (key && index && subKey) {
                  const newArray = [...editSalary[key as keyof typeof editSalary]];
                  newArray[parseInt(index)][subKey as keyof Bonus] = value;
                  setEditSalary({ ...editSalary, [key]: newArray });
                }
              } else {
                setEditSalary({ ...editSalary, [field]: value });
              }
            }}
            onAddBonus={() =>
              setEditSalary({
                ...editSalary,
                allowances: [...editSalary.allowances, { name: "", amount: 0 }],
              })
            }
            onRemoveBonus={(index) => {
              const newAllowances = editSalary.allowances.filter((_, i) => i !== index);
              setEditSalary({ ...editSalary, allowances: newAllowances });
            }}
            onAddDeduction={() =>
              setEditSalary({
                ...editSalary,
                deductions: [...editSalary.deductions, { name: "", amount: 0, isStatutory: false }],
              })
            }
            onRemoveDeduction={(index) => {
              const newDeductions = editSalary.deductions.filter((_, i) => i !== index);
              setEditSalary({ ...editSalary, deductions: newDeductions });
            }}
            onSave={handleSaveSalary}
            onClose={() => setShowEditModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default SalaryPage;
