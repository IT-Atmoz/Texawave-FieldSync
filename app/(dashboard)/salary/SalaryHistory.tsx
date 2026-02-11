import React, { useState, useEffect, useMemo } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { Download, ChevronDown, ChevronUp, Search } from "lucide-react";
import { saveAs } from "file-saver";
import { Button } from "./Button";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "lucide-react";
interface User {
  uid: string;
  name: string;
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

interface SalaryHistoryProps {
  users: User[];
}

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

const SalaryHistory: React.FC<SalaryHistoryProps> = ({ users }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [salaryHistory, setSalaryHistory] = useState<SalaryRecord[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch salary history for the selected user
  useEffect(() => {
    if (!selectedUserId) {
      setSalaryHistory([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    const salaryRef = ref(database, `salaries/${selectedUserId}`);
    const unsubscribe = onValue(
      salaryRef,
      (snapshot) => {
        const data = snapshot.exists() ? snapshot.val() : {};
        const history: SalaryRecord[] = Object.keys(data).map((yearMonth) => ({
          yearMonth,
          baseSalary: data[yearMonth].baseSalary || 0,
          overtimeHours: data[yearMonth].overtimeHours || 0,
          overtimePay: data[yearMonth].overtimePay || 0,
          allowances: data[yearMonth].allowances || [],
          deductions: data[yearMonth].deductions || [],
          netSalary: data[yearMonth].netSalary || 0,
          paymentStatus: data[yearMonth].paymentStatus || "pending",
          calculatedAt: data[yearMonth].calculatedAt || 0,
          attendanceDays: data[yearMonth].attendanceDays || 0,
          compliance: {
            pf: data[yearMonth].compliance?.pf || 0,
            esi: data[yearMonth].compliance?.esi || 0,
            tds: data[yearMonth].compliance?.tds || 0,
          },
        }));
        setSalaryHistory(history);
        setIsLoading(false);
      },
      (error) => {
        console.error("Failed to fetch salary history:", error);
        setError("Failed to load salary history. Please try again.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedUserId]);

  // Filter users by search query
  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.uid.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  // Sort and filter history
  const filteredHistory = useMemo(() => {
    let result = [...salaryHistory];
    if (selectedMonth) {
      result = result.filter((record) => record.yearMonth === selectedMonth);
    }
    return result.sort((a, b) => {
      const comparison = a.yearMonth.localeCompare(b.yearMonth);
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [salaryHistory, selectedMonth, sortOrder]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredHistory.reduce(
      (acc, record) => ({
        netSalary: acc.netSalary + (record.netSalary || 0),
        pf: acc.pf + (record.compliance?.pf || 0),
        esi: acc.esi + (record.compliance?.esi || 0),
        attendanceDays: acc.attendanceDays + (record.attendanceDays || 0),
      }),
      { netSalary: 0, pf: 0, esi: 0, attendanceDays: 0 }
    );
  }, [filteredHistory]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Month",
      "Base Salary",
      "Overtime Hours",
      "Overtime Pay",
      "Allowances",
      "Deductions",
      "PF",
      "ESI",
      "Net Salary",
      "Payment Status",
      "Attendance Days",
    ];
    const rows = filteredHistory.map((record) => [
      record.yearMonth,
      record.baseSalary,
      record.overtimeHours,
      record.overtimePay,
      record.allowances.map((a) => `${a.name}: ${a.amount}`).join("; ") || "",
      record.deductions.map((d) => `${d.name}: ${d.amount}`).join("; ") || "",
      record.compliance.pf,
      record.compliance.esi,
      record.netSalary,
      record.paymentStatus,
      record.attendanceDays,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `salary_history_${selectedUserId}_${selectedMonth || "all"}.csv`);
  };

  // Toggle row expansion
  const toggleRow = (yearMonth: string) => {
    setExpandedRows((prev) =>
      prev.includes(yearMonth)
        ? prev.filter((id) => id !== yearMonth)
        : [...prev, yearMonth]
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Salary History</h2>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="relative flex-1">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Employee</option>
            {filteredUsers.map((user) => (
              <option key={user.uid} value={user.uid}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
        <div className="relative flex-1">
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            placeholder="Select Month"
            className="pl-10"
          />
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        <Button
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          variant="outline"
          size="sm"
        >
          Sort {sortOrder === "asc" ? "Ascending" : "Descending"}
        </Button>
        <Button onClick={handleExportCSV} variant="outline" size="sm" disabled={!selectedUserId}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
      {error && (
        <div className="text-center text-sm text-red-600 mb-4">{error}</div>
      )}
      {isLoading ? (
        <div className="text-center text-sm text-gray-500">Loading salary history...</div>
      ) : selectedUserId ? (
        filteredHistory.length > 0 ? (
          <>
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="text-sm font-medium text-blue-700">Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-2">
                <div>
                  <p className="text-xs text-gray-600">Total Net Salary</p>
                  <p className="text-sm font-medium text-gray-900">₹{totals.netSalary.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total PF</p>
                  <p className="text-sm font-medium text-gray-900">₹{totals.pf.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total ESI</p>
                  <p className="text-sm font-medium text-gray-900">₹{totals.esi.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Attendance</p>
                  <p className="text-sm font-medium text-gray-900">{totals.attendanceDays} days</p>
                </div>
              </div>
            </div>
            <AnimatePresence>
              {filteredHistory.map((record) => (
                <motion.div
                  key={record.yearMonth}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gray-50 rounded-lg shadow-sm transition-all duration-300 mb-4"
                >
                  <div
                    className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleRow(record.yearMonth)}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{record.yearMonth}</p>
                      <p className="text-xs text-gray-600">Net Salary: ₹{record.netSalary.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          record.paymentStatus === "paid" ? "text-green-600" :
                          record.paymentStatus === "disputed" ? "text-red-600" : "text-yellow-600"
                        )}
                      >
                        {record.paymentStatus.charAt(0).toUpperCase() + record.paymentStatus.slice(1)}
                      </span>
                      {expandedRows.includes(record.yearMonth) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                  {expandedRows.includes(record.yearMonth) && (
                    <div className="p-4 bg-white border-t">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Base Salary</p>
                          <p className="text-sm text-gray-600">₹{record.baseSalary.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Overtime</p>
                          <p className="text-sm text-gray-600">
                            {record.overtimeHours} hrs (₹{record.overtimePay.toLocaleString()})
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Allowances</p>
                          <p className="text-sm text-gray-600">
                            {record.allowances.length > 0
                              ? record.allowances.map((a) => `${a.name}: ₹${a.amount.toLocaleString()}`).join(", ")
                              : "None"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Deductions</p>
                          <p className="text-sm text-gray-600">
                            {record.deductions.length > 0
                              ? record.deductions.map((d) => `${d.name}: ₹${d.amount.toLocaleString()}`).join(", ")
                              : "None"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Compliance</p>
                          <p className="text-sm text-gray-600">
                            PF: ₹{record.compliance.pf.toLocaleString()}, ESI: ₹{record.compliance.esi.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Attendance</p>
                          <p className="text-sm text-gray-600">{record.attendanceDays} days</p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </>
        ) : (
          <p className="text-center text-sm text-gray-500">No salary records found for the selected criteria.</p>
        )
      ) : (
        <p className="text-center text-sm text-gray-500">Please select an employee to view their salary history.</p>
      )}
    </div>
  );
};

export default SalaryHistory;