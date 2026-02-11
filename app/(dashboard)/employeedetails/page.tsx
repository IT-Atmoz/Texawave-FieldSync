"use client";
import React, { useState, useEffect } from "react";
import { ref, onValue, set, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { User as UserIcon, Edit, Save, X, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveAs } from "file-saver";
import Papa from "papaparse";

interface User {
  uid: string;
  username: string;
  name?: string;
  phoneNo?: string;
  workRole?: string;
  email?: string;
  address?: string;
  bankAccountNo?: string;
  ifscCode?: string;
  branchName?: string;
}

const EmployeeDetailsPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<User>({
    uid: "",
    username: "",
    name: "",
    phoneNo: "",
    workRole: "",
    email: "",
    address: "",
    bankAccountNo: "",
    ifscCode: "",
    branchName: "",
  });
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const usersRef = ref(database, "users");
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const usersList: User[] = Object.keys(usersData).map((uid) => ({
          uid,
          username: usersData[uid].username || "",
          name: usersData[uid].name || "",
          workRole: usersData[uid].workRole || "",
        }));
        setUsers(usersList.filter((u) => u.username));
      } else {
        setUsers([]);
        setNotification({ message: "No users found", type: "error" });
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      const empRef = ref(database, `employeedetails/${selectedUser.uid}`);
      onValue(empRef, (snap) => {
        if (snap.exists()) {
          const data = snap.val();
          setFormData({
            uid: selectedUser.uid,
            username: selectedUser.username,
            name: data.name || "",
            phoneNo: data.phoneNo || "",
            workRole: data.workRole || "",
            email: data.email || "",
            address: data.address || "",
            bankAccountNo: data.bankAccountNo || "",
            ifscCode: data.ifscCode || "",
            branchName: data.branchName || "",
          });
        }
      });
    }
  }, [selectedUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = () => setEditMode(true);

  const handleCancel = () => {
    setEditMode(false);
    if (selectedUser) setSelectedUser({ ...selectedUser }); // Re-trigger useEffect
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    try {
      const empRef = ref(database, `employeedetails/${selectedUser.uid}`);
      const userRef = ref(database, `users/${selectedUser.uid}`);

      await set(empRef, formData);
      await update(userRef, {
        name: formData.name,
        workRole: formData.workRole || "worker",
      });

      setEditMode(false);
      setNotification({ message: "Saved successfully", type: "success" });
    } catch (error) {
      console.error(error);
      setNotification({ message: "Save failed", type: "error" });
    }
  };

  const exportSingleEmployee = () => {
    if (!selectedUser) return;
    const csv = Papa.unparse([formData]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${formData.username}_details.csv`);
  };

  const exportAllEmployees = async () => {
    const data: User[] = [];
    for (const user of users) {
      const snap = await new Promise<any>((resolve) =>
        onValue(ref(database, `employeedetails/${user.uid}`), resolve, { onlyOnce: true })
      );
      const details = snap.exists() ? snap.val() : {};
      data.push({
        uid: user.uid,
        username: user.username,
        name: details.name || "",
        phoneNo: details.phoneNo || "",
        workRole: details.workRole || "",
        email: details.email || "",
        address: details.address || "",
        bankAccountNo: details.bankAccountNo || "",
        ifscCode: details.ifscCode || "",
        branchName: details.branchName || "",
      });
    }
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "all_employees.csv");
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <div className="min-h-screen px-6 py-10 bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-blue-800 flex justify-center items-center gap-3">
            <UserIcon className="w-8 h-8" />
            Employee CRM Portal
          </h1>
          <p className="text-gray-500 text-lg">Manage employee details, update records, and export data</p>
        </div>

        {/* Selection + Count + Export */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <select
              onChange={(e) => {
                const user = users.find((u) => u.uid === e.target.value) || null;
                setSelectedUser(user);
                setEditMode(false);
              }}
              value={selectedUser?.uid || ""}
              className="w-full sm:w-1/2 px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an employee</option>
              {users.map((user) => (
                <option key={user.uid} value={user.uid}>
                  {user.username} ({user.name})
                </option>
              ))}
            </select>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <span className="bg-blue-600 text-white px-4 py-2 rounded-full font-medium shadow-md">
                Total: {users.length}
              </span>
              <button
                onClick={exportAllEmployees}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl shadow-md hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                Export All
              </button>
              {selectedUser && (
                <button
                  onClick={exportSingleEmployee}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-xl shadow-md hover:bg-yellow-700"
                >
                  <Download className="w-4 h-4" />
                  Export This
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Employee Form */}
        {selectedUser && (
          <div className="bg-white rounded-3xl shadow-2xl p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between">
              <h2 className="text-2xl font-semibold text-blue-700">Employee: {formData.username}</h2>
              <div className="flex gap-2">
                {!editMode ? (
                  <button
                    onClick={handleEdit}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow-md hover:bg-blue-700"
                  >
                    <Edit className="w-4 h-4 inline-block" /> Edit
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow-md hover:bg-blue-700"
                    >
                      <Save className="w-4 h-4 inline-block" /> Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-red-600 text-white px-4 py-2 rounded-xl shadow-md hover:bg-red-700"
                    >
                      <X className="w-4 h-4 inline-block" /> Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: "Full Name", name: "name" },
                { label: "Phone", name: "phoneNo" },
                { label: "Work Role", name: "workRole" },
                { label: "Email", name: "email" },
                { label: "Address", name: "address" },
                { label: "Bank Account", name: "bankAccountNo" },
                { label: "IFSC", name: "ifscCode" },
                { label: "Branch Name", name: "branchName" },
              ].map(({ label, name }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type="text"
                    name={name}
                    value={formData[name as keyof User] || ""}
                    onChange={handleChange}
                    disabled={!editMode}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500",
                      !editMode && "bg-gray-100 cursor-not-allowed"
                    )}
                    placeholder={`Enter ${label}`}
                  />
                </div>
              ))}
            </div>

            {notification && (
              <div
                className={cn(
                  "mt-4 px-4 py-3 rounded-xl text-white font-semibold",
                  notification.type === "success" ? "bg-green-600" : "bg-red-600"
                )}
              >
                {notification.message}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDetailsPage;
