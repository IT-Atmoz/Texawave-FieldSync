import React, { useState, useMemo, useEffect, useRef } from "react";
import { ref, onValue, off } from "firebase/database";
import { database } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { Check, Edit, Search, Calendar } from "lucide-react";
import { Button } from "./Button";

interface User {
  uid: string;
  name: string;
  username: string;
  role: string;
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
  attendanceDays: number;
}

interface UserSalary extends User {
  salary: SalaryRecord | null;
}

interface MaterialRequest {
  id: string;
  materialId: string;
  materialName: string;
  quantityRequested: number;
  requestedAt: number;
  respondedAt: number;
  responseMessage: string;
  status: string;
  userId: string;
  username: string;
}

interface Material {
  id: string;
  name: string;
  price: number;
}

interface SalaryTableProps {
  userSalaries: UserSalary[];
  searchQuery: string;
  onEdit: (user: User, salary: SalaryRecord | null) => void;
  onBulkMarkPaid: (userIds: string[]) => void;
}

const Checkbox: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
  <input
    type="checkbox"
    className={cn("h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500", className)}
    {...props}
  />
);

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

const SalaryTable: React.FC<SalaryTableProps> = ({
  userSalaries,
  searchQuery,
  onEdit,
  onBulkMarkPaid,
}) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sortField, setSortField] = useState<"name" | "netSalary" | "paymentStatus" | "materialSpent">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [usernameSearch, setUsernameSearch] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // Default to current month
  const isMounted = useRef(true);
  const materialRequestsRef = useRef(ref(database, "material_requests"));
  const materialsRef = useRef(ref(database, "materials"));

  // Ensure the mounted flag is updated correctly
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      off(materialRequestsRef.current);
      off(materialsRef.current);
    };
  }, []);

  // Fetch material requests from Firebase
  useEffect(() => {
    const handleValueChange = (snapshot: any) => {
      if (!isMounted.current) return;

      if (snapshot.exists()) {
        const requestsData = snapshot.val();
        const requestsList: MaterialRequest[] = Object.entries(requestsData).map(([id, data]: [string, any]) => ({
          id,
          materialId: data.materialId || "",
          materialName: data.materialName || "",
          quantityRequested: data.quantityRequested || 0,
          requestedAt: data.requestedAt || 0,
          respondedAt: data.respondedAt || 0,
          responseMessage: data.responseMessage || "",
          status: data.status || "",
          userId: data.userId || "",
          username: data.username || "",
        }));

        if (isMounted.current) {
          setMaterialRequests(requestsList);
        }
      } else {
        if (isMounted.current) {
          setMaterialRequests([]);
        }
      }
    };

    onValue(materialRequestsRef.current, handleValueChange, (error) => {
      console.error("Failed to fetch material requests:", error);
    });

    return () => {
      off(materialRequestsRef.current, "value", handleValueChange);
    };
  }, []);

  // Fetch materials from Firebase
  useEffect(() => {
    const handleMaterialsChange = (snapshot: any) => {
      if (!isMounted.current) return;

      if (snapshot.exists()) {
        const materialsData = snapshot.val();
        const materialsList: Material[] = Object.entries(materialsData).map(([id, data]: [string, any]) => ({
          id,
          name: data.name || "",
          price: data.price || 0,
        }));

        if (isMounted.current) {
          setMaterials(materialsList);
        }
      } else {
        if (isMounted.current) {
          setMaterials([]);
        }
      }
    };

    onValue(materialsRef.current, handleMaterialsChange, (error) => {
      console.error("Failed to fetch materials:", error);
    });

    return () => {
      off(materialsRef.current, "value", handleMaterialsChange);
    };
  }, []);

  // Create a mapping of materialId to price
  const materialPrices = useMemo(() => {
    const prices: { [materialId: string]: number } = {};
    materials.forEach((material) => {
      prices[material.id] = material.price;
    });
    return prices;
  }, [materials]);

  // Calculate total material cost per user based on filters
  const materialCostByUser = useMemo(() => {
    const cost: { [username: string]: number } = {};

    // Parse the selected month to get the start and end timestamps
    const [year, month] = selectedMonth.split("-").map(Number);
    const startOfMonth = new Date(year, month - 1, 1).getTime();
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).getTime();

    // Filter requests by status, username, and respondedAt date
    const filteredRequests = materialRequests.filter((request) => {
      const matchesStatus = request.status === "approved";
      const matchesUsername = usernameSearch
        ? request.username.toLowerCase().includes(usernameSearch.toLowerCase())
        : true;
      const matchesMonth =
        request.respondedAt >= startOfMonth && request.respondedAt <= endOfMonth;

      return matchesStatus && matchesUsername && matchesMonth;
    });

    // Calculate total cost per user
    filteredRequests.forEach((request) => {
      if (request.username && request.materialId) {
        const price = materialPrices[request.materialId] || 0;
        const requestCost = request.quantityRequested * price;
        cost[request.username] = (cost[request.username] || 0) + requestCost;
      }
    });

    return cost;
  }, [materialRequests, materialPrices, usernameSearch, selectedMonth]);

  const sortedUserSalaries = useMemo(() => {
    return [...userSalaries]
      .filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        let comparison = 0;
        if (sortField === "name") {
          comparison = a.name.localeCompare(b.name);
        } else if (sortField === "netSalary") {
          comparison = (a.salary?.netSalary || 0) - (b.salary?.netSalary || 0);
        } else if (sortField === "paymentStatus") {
          comparison = (a.salary?.paymentStatus || "pending").localeCompare(b.salary?.paymentStatus || "pending");
        } else if (sortField === "materialSpent") {
          const materialA = materialCostByUser[a.username] || 0;
          const materialB = materialCostByUser[b.username] || 0;
          comparison = materialA - materialB;
        }
        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [userSalaries, searchQuery, sortField, sortOrder, materialCostByUser]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-x-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedUsers.length === sortedUserSalaries.length}
            onChange={(e) => {
              setSelectedUsers(e.target.checked ? sortedUserSalaries.map((u) => u.uid) : []);
            }}
          />
          <span className="text-sm font-medium text-gray-700">
            Select All ({selectedUsers.length} selected)
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search by username..."
              className="pl-10"
              value={usernameSearch}
              onChange={(e) => setUsernameSearch(e.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-48">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        {selectedUsers.length > 0 && (
          <Button onClick={() => onBulkMarkPaid(selectedUsers)} variant="default" size="sm">
            Mark as Paid
          </Button>
        )}
      </div>
      <table className="w-full text-sm text-left text-gray-700">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 w-12"></th>
            <th
              className="p-3 cursor-pointer"
              onClick={() => {
                setSortField("name");
                setSortOrder(sortField === "name" && sortOrder === "asc" ? "desc" : "asc");
              }}
            >
              Name {sortField === "name" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="p-3">Role</th>
            <th className="p-3">Base Salary</th>
            <th
              className="p-3 cursor-pointer"
              onClick={() => {
                setSortField("netSalary");
                setSortOrder(sortField === "netSalary" && sortOrder === "asc" ? "desc" : "asc");
              }}
            >
              Net Salary {sortField === "netSalary" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="p-3 cursor-pointer"
              onClick={() => {
                setSortField("paymentStatus");
                setSortOrder(sortField === "paymentStatus" && sortOrder === "asc" ? "desc" : "asc");
              }}
            >
              Status {sortField === "paymentStatus" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="p-3 cursor-pointer"
              onClick={() => {
                setSortField("materialSpent");
                setSortOrder(sortField === "materialSpent" && sortOrder === "asc" ? "desc" : "asc");
              }}
            >
              Material Cost {sortField === "materialSpent" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedUserSalaries.map((user) => (
            <tr key={user.uid} className="border-b hover:bg-gray-50">
              <td className="p-3">
                <Checkbox
                  checked={selectedUsers.includes(user.uid)}
                  onChange={(e) => {
                    setSelectedUsers(
                      e.target.checked
                        ? [...selectedUsers, user.uid]
                        : selectedUsers.filter((id) => id !== user.uid)
                    );
                  }}
                />
              </td>
              <td className="p-3">{user.name}</td>
              <td className="p-3 capitalize">{user.role}</td>
              <td className="p-3">₹{user.salary?.baseSalary || 0}</td>
              <td className="p-3">₹{user.salary?.netSalary || 0}</td>
              <td
                className={cn(
                  "p-3",
                  user.salary?.paymentStatus === "paid" ? "text-green-600" :
                  user.salary?.paymentStatus === "disputed" ? "text-red-600" : "text-yellow-600"
                )}
              >
                {user.salary?.paymentStatus || "Pending"}
              </td>
              <td className="p-3">₹{materialCostByUser[user.username] || 0}</td>
              <td className="p-3 flex gap-2">
                <Button
                  onClick={() => onEdit(user, user.salary)}
                  variant="outline"
                  size="icon"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export { SalaryTable, Checkbox };
