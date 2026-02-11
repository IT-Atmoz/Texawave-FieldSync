"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as React from "react";
import { useState, useEffect } from "react";
import { ref, onValue, set, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { Search, Calendar, AlertCircle, CheckCircle, History, User, ChevronDown, Check, XCircle } from "lucide-react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Inline Button Component
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md",
        destructive: "bg-red-600 text-white hover:bg-red-700 shadow-md",
        outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm",
        secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200 shadow-sm",
        ghost: "hover:bg-gray-100 hover:text-gray-900",
        link: "text-indigo-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? "span" : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

// Inline Card Component
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-white shadow-md transition-all hover:shadow-lg hover:-translate-y-1 w-full",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-4 sm:p-5", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-base sm:text-lg font-semibold text-gray-900 truncate", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs sm:text-sm text-gray-600 truncate", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 sm:p-5 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-4 sm:p-5 pt-0 border-t bg-gray-50", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// Inline Input Component
const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 sm:px-4 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-all duration-200",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

// Inline Select Components
const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 sm:px-4 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton ref={ref} className={cn("flex cursor-default items-center justify-center py-1", className)} {...props}>
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton ref={ref} className={cn("flex cursor-default items-center justify-center py-1", className)} {...props}>
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-white text-gray-900 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-indigo-50 focus:text-indigo-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-gray-200", className)} {...props} />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

interface User {
  uid: string;
  name: string;
  username: string;
  password: string;
  loggedIn: boolean;
  gpsActive: boolean | null;
  role: string;
  joinDate: string;
  photo: string;
}

interface AttendanceRecord {
  status: "present" | "absent" | "on_leave" | "not_marked";
  markedAt?: number;
}

interface UserAttendance extends User {
  attendance: AttendanceRecord;
}

interface AttendanceHistoryRecord {
  date: string;
  status: "present" | "absent" | "on_leave" | "not_marked";
  markedAt?: number;
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

interface MonthlySummary {
  uid: string;
  name: string;
  username: string;
  role: string;
  present: number;
  absent: number;
  onLeave: number;
}

const AttendancePage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [userAttendance, setUserAttendance] = useState<UserAttendance[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [selectedUserHistory, setSelectedUserHistory] = useState<User | null>(null);
  const [historyStartDate, setHistoryStartDate] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [historyEndDate, setHistoryEndDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceHistoryRecord[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary[]>([]);

  // Realtime clock for India time (IST)
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
      const formattedTime = now.toLocaleString("en-IN", options);
      setCurrentTime(formattedTime);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch users from Firebase
  useEffect(() => {
    const usersRef = ref(database, "users");
    const unsubscribe = onValue(
      usersRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const usersData = snapshot.val();
          const usersList = Object.keys(usersData)
            .map((uid) => ({
              uid,
              name: usersData[uid].name || "",
              username: usersData[uid].username || "",
              password: usersData[uid].password || "",
              loggedIn: usersData[uid].loggedIn || false,
              gpsActive: usersData[uid].location?.gpsActive ?? null,
              role: usersData[uid].role || "worker",
              joinDate: usersData[uid].joinDate || new Date().toISOString(),
              photo: usersData[uid].photo || "/placeholder.svg",
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
          setIsLoading(false);
        } else {
          setUsers([]);
          setIsLoading(false);
          setNotification({ message: "No users found", type: "error" });
        }
      },
      (error) => {
        setNotification({ message: "Failed to fetch users: " + error.message, type: "error" });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Fetch all leave requests
  useEffect(() => {
    const leaveRequestsRef = ref(database, `leaveRequests`);
    const unsubscribe = onValue(
      leaveRequestsRef,
      (snapshot) => {
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
          setLeaveRequests(allRequests);
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
  }, []);

  // Fetch and sync attendance data with approved leaves
  useEffect(() => {
    const fetchAndSyncAttendance = async () => {
      if (!selectedDate || !users.length || !leaveRequests.length) {
        console.log("Skipping attendance sync: missing data", { selectedDate, usersLength: users.length, leaveRequestsLength: leaveRequests.length });
        return;
      }

      try {
        const attendanceRef = ref(database, `attendance/${selectedDate}`);
        const snapshot = await get(attendanceRef);
        const attendanceData = snapshot.exists() ? snapshot.val() : {};

        const updatedUserAttendance = users.map((user) => {
          let userAttendance = attendanceData[user.uid] || { status: "not_marked" };

          // Check for approved leave for this user on the selected date
          const hasApprovedLeave = leaveRequests.some((leave) => {
            if (leave.status !== "approved" || leave.username !== user.username) return false;
            const leaveStart = leave.startDate;
            const leaveEnd = leave.endDate;
            const selected = selectedDate;
            return selected >= leaveStart && selected <= leaveEnd;
          });

          // If user has an approved leave and attendance is not already marked, mark as on_leave
          if (hasApprovedLeave && userAttendance.status === "not_marked") {
            userAttendance = {
              status: "on_leave",
              markedAt: Date.now(),
            };
            const userAttendanceRef = ref(database, `attendance/${selectedDate}/${user.uid}`);
            set(userAttendanceRef, userAttendance).catch((err) => {
              console.error("Error updating attendance:", err);
              setNotification({ message: "Failed to sync leave status", type: "error" });
            });
          }

          return {
            ...user,
            attendance: userAttendance,
          };
        });

        setUserAttendance(updatedUserAttendance);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
        setNotification({ message: "Failed to fetch attendance data", type: "error" });
      }
    };

    fetchAndSyncAttendance();
  }, [users, selectedDate, leaveRequests]);

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Handle marking attendance for a user
  const handleMarkAttendance = async (uid: string, status: "present" | "absent" | "on_leave") => {
    try {
      const attendanceRef = ref(database, `attendance/${selectedDate}/${uid}`);
      const attendanceData = {
        status,
        markedAt: Date.now(),
      };
      await set(attendanceRef, attendanceData);

      setUserAttendance((prev) =>
        prev.map((user) =>
          user.uid === uid ? { ...user, attendance: attendanceData } : user
        )
      );
      setNotification({ message: "Attendance marked successfully", type: "success" });
    } catch (error) {
      setNotification({ message: "Failed to mark attendance", type: "error" });
    }
  };

  // Handle marking attendance for all users
  const handleMarkAll = async (status: "present" | "absent" | "on_leave") => {
    try {
      const updates: { [key: string]: AttendanceRecord } = {};
      filteredUserAttendance.forEach((user) => {
        // Only update users who are not_marked
        if (user.attendance.status === "not_marked") {
          updates[`attendance/${selectedDate}/${user.uid}`] = {
            status,
            markedAt: Date.now(),
          };
        }
      });

      if (Object.keys(updates).length === 0) {
        setNotification({ message: "No unmarked users to update", type: "error" });
        return;
      }

      await Promise.all(
        Object.entries(updates).map(([path, data]) => set(ref(database, path), data))
      );

      setUserAttendance((prev) =>
        prev.map((user) => {
          if (
            filteredUserAttendance.some((filteredUser) => filteredUser.uid === user.uid) &&
            user.attendance.status === "not_marked"
          ) {
            return {
              ...user,
              attendance: {
                status,
                markedAt: Date.now(),
              },
            };
          }
          return user;
        })
      );
      setNotification({ message: `Marked unmarked users as ${status.replace("_", " ")}`, type: "success" });
    } catch (error) {
      setNotification({ message: "Failed to mark all attendance", type: "error" });
    }
  };

  // Handle viewing attendance history for a user
  const handleViewHistory = (user: User) => {
    setSelectedUserHistory(user);
    setShowHistoryModal(true);
    fetchAttendanceHistory(user.uid);
  };

  // Fetch attendance history for a user within a date range
  const fetchAttendanceHistory = async (uid: string) => {
    if (!historyStartDate || !historyEndDate) return;

    const start = new Date(historyStartDate);
    const end = new Date(historyEndDate);
    if (start > end) {
      setNotification({ message: "Start date cannot be after end date", type: "error" });
      return;
    }

    try {
      const historyRecords: AttendanceHistoryRecord[] = [];
      let currentDate = new Date(start);
      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const attendanceRef = ref(database, `attendance/${dateStr}/${uid}`);
        const snapshot = await get(attendanceRef);
        const record = snapshot.exists()
          ? snapshot.val()
          : { status: "not_marked" };

        historyRecords.push({
          date: dateStr,
          status: record.status || "not_marked",
          markedAt: record.markedAt,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setAttendanceHistory(historyRecords);
    } catch (error) {
      setNotification({ message: "Failed to fetch attendance history", type: "error" });
    }
  };

  // Fetch monthly attendance summary
  const fetchMonthlySummary = async () => {
    if (!selectedMonth || !users.length) return;

    try {
      const [year, month] = selectedMonth.split("-").map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const summaries: MonthlySummary[] = users.map((user) => ({
        uid: user.uid,
        name: user.name,
        username: user.username,
        role: user.role,
        present: 0,
        absent: 0,
        onLeave: 0,
      }));

      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const attendanceRef = ref(database, `attendance/${dateStr}`);
        const snapshot = await get(attendanceRef);
        const attendanceData = snapshot.exists() ? snapshot.val() : {};

        summaries.forEach((summary) => {
          const userAttendance = attendanceData[summary.uid] || { status: "not_marked" };
          if (userAttendance.status === "present") summary.present += 1;
          else if (userAttendance.status === "absent") summary.absent += 1;
          else if (userAttendance.status === "on_leave") summary.onLeave += 1;
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      setMonthlySummaries(summaries);
    } catch (error) {
      console.error("Error fetching monthly summary:", error);
      setNotification({ message: "Failed to fetch monthly summary", type: "error" });
    }
  };

  useEffect(() => {
    fetchMonthlySummary();
  }, [selectedMonth, users]);

  // Compute attendance summary for the selected date
  const attendanceSummary = {
    present: userAttendance.filter((user) => user.attendance.status === "present").length,
    absent: userAttendance.filter((user) => user.attendance.status === "absent").length,
    onLeave: userAttendance.filter((user) => user.attendance.status === "on_leave").length,
    notMarked: userAttendance.filter((user) => user.attendance.status === "not_marked").length,
  };

  const filteredUserAttendance = userAttendance.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Chart data for Monthly Summary
  const chartData = {
    labels: monthlySummaries.map((summary) => summary.name),
    datasets: [
      {
        label: "Present",
        data: monthlySummaries.map((summary) => summary.present),
        backgroundColor: "rgba(34, 197, 94, 0.6)",
        borderColor: "rgba(34, 197, 94, 1)",
        borderWidth: 1,
      },
      {
        label: "Absent",
        data: monthlySummaries.map((summary) => summary.absent),
        backgroundColor: "rgba(239, 68, 68, 0.6)",
        borderColor: "rgba(239, 68, 68, 1)",
        borderWidth: 1,
      },
      {
        label: "On Leave",
        data: monthlySummaries.map((summary) => summary.onLeave),
        backgroundColor: "rgba(234, 179, 8, 0.6)",
        borderColor: "rgba(234, 179, 8, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: {
            size: 12,
          },
          color: "#1f2937",
        },
      },
      title: {
        display: true,
        text: `Attendance Summary for ${new Date(selectedMonth + "-01").toLocaleString("en-IN", { month: "long", year: "numeric" })}`,
        font: {
          size: 16,
        },
        color: "#1f2937",
      },
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        titleColor: "#1f2937",
        bodyColor: "#1f2937",
        borderColor: "#d1d5db",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => {
            const datasetLabel = context.dataset.label;
            const value = context.raw;
            const username = monthlySummaries[context.dataIndex].username;
            return `${username}: ${value} ${datasetLabel}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#1f2937",
          font: {
            size: 12,
          },
          maxRotation: 45,
          minRotation: 45,
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: "#1f2937",
          font: {
            size: 12,
          },
          stepSize: 1,
        },
        grid: {
          color: "#e5e7eb",
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 mt-10">
      <div className="max-w-7xl mx-auto">
        <style jsx global>{`
          @keyframes slide-in {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slide-up {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-slide-in {
            animation: slide-in 0.3s ease-out;
          }
          .animate-slide-up {
            animation: slide-up 0.4s ease-out;
          }
          .animate-fade-in {
            animation: fade-in 0.5s ease-out;
          }
        `}</style>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight animate-fade-in">
            Attendance Dashboard
          </h1>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm text-sm sm:text-base font-medium text-gray-800 animate-fade-in">
            {currentTime} IST
          </div>
        </div>

        {notification && (
          <div
            className={cn(
              "flex items-center gap-2 p-3 rounded-lg mb-6 transition-all duration-300 w-full max-w-md mx-auto animate-slide-in",
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

        <Tabs defaultValue="daily" className="space-y-4 sm:space-y-6">
          <TabsList className="flex justify-center sm:justify-start bg-gray-200 p-1 rounded-lg">
            <TabsTrigger
              value="daily"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2"
            >
              Daily Attendance
            </TabsTrigger>
            <TabsTrigger
              value="monthly"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2"
            >
              Monthly Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Input
                  type="search"
                  placeholder="Search users by name or username..."
                  className="w-full pl-14 pr-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative w-full sm:w-48">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 sm:gap-4 mb-6 justify-center sm:justify-start">
              <div className="bg-green-100 text-green-800 px-3 sm:px-4 py-2 rounded-lg shadow-sm">
                <span className="text-xs sm:text-sm font-medium">Present: {attendanceSummary.present}</span>
              </div>
              <div className="bg-red-100 text-red-800 px-3 sm:px-4 py-2 rounded-lg shadow-sm">
                <span className="text-xs sm:text-sm font-medium">Absent: {attendanceSummary.absent}</span>
              </div>
              <div className="bg-yellow-100 text-yellow-800 px-3 sm:px-4 py-2 rounded-lg shadow-sm">
                <span className="text-xs sm:text-sm font-medium">On Leave: {attendanceSummary.onLeave}</span>
              </div>
              <div className="bg-gray-100 text-gray-800 px-3 sm:px-4 py-2 rounded-lg shadow-sm">
                <span className="text-xs sm:text-sm font-medium">Not Marked: {attendanceSummary.notMarked}</span>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="flex justify-end gap-2 p-4 border-b bg-gray-50">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAll("present")}
                    title="Mark all unmarked as Present"
                  >
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    All Present
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAll("absent")}
                    title="Mark all unmarked as Absent"
                  >
                    <XCircle className="h-4 w-4 text-red-600" />
                    All Absent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAll("on_leave")}
                    title="Mark all unmarked as On Leave"
                  >
                    <User className="h-4 w-4 text-yellow-600" />
                    All On Leave
                  </Button>
                </div>
                <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
                  <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3 text-center">Present</th>
                        <th className="px-4 py-3 text-center">Absent</th>
                        <th className="px-4 py-3 text-center">On Leave</th>
                        <th className="px-4 py-3 text-center">History</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                          <tr key={i} className="animate-pulse border-b">
                            <td className="px-4 py-3">
                              <div className="h-4 w-32 bg-gray-200 rounded"></div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="h-4 w-24 bg-gray-200 rounded"></div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="h-4 w-4 mx-auto bg-gray-200 rounded"></div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="h-4 w-4 mx-auto bg-gray-200 rounded"></div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="h-4 w-4 mx-auto bg-gray-200 rounded"></div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="h-4 w-4 mx-auto bg-gray-200 rounded"></div>
                            </td>
                          </tr>
                        ))
                      ) : filteredUserAttendance.length > 0 ? (
                        filteredUserAttendance.map((user, index) => (
                          <tr
                            key={user.uid}
                            className={cn(
                              "border-b hover:bg-gray-50 transition-colors",
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            )}
                          >
                            <td className="px-4 py-3 flex items-center gap-2">
                              <img
                                src={user.photo}
                                alt={user.name}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                              <div>
                                <div className="font-medium text-gray-900">{user.name}</div>
                                <div className="text-xs text-gray-500">{user.username}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3 capitalize">{user.role}</td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={user.attendance.status === "present"}
                                onChange={() => handleMarkAttendance(user.uid, "present")}
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={user.attendance.status === "absent"}
                                onChange={() => handleMarkAttendance(user.uid, "absent")}
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={user.attendance.status === "on_leave"}
                                onChange={() => handleMarkAttendance(user.uid, "on_leave")}
                                className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewHistory(user)}
                                title="View Attendance History"
                              >
                                <History className="h-4 w-4 text-gray-600" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-3 text-center text-gray-500">
                            No users found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative w-full sm:w-48">
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Attendance Overview</CardTitle>
                <CardDescription>Monthly attendance statistics for all employees</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detailed Summary</CardTitle>
                <CardDescription>Breakdown of attendance by employee</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
                  <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3 text-center">Present</th>
                        <th className="px-4 py-3 text-center">Absent</th>
                        <th className="px-4 py-3 text-center">On Leave</th>
                        <th className="px-4 py-3 text-center">History</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                          <tr key={i} className="animate-pulse border-b">
                            <td className="px-4 py-3">
                              <div className="h-4 w-32 bg-gray-200 rounded"></div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="h-4 w-24 bg-gray-200 rounded"></div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="h-4 w-12 mx-auto bg-gray-200 rounded"></div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="h-4 w-12 mx-auto bg-gray-200 rounded"></div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="h-4 w-12 mx-auto bg-gray-200 rounded"></div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="h-4 w-4 mx-auto bg-gray-200 rounded"></div>
                            </td>
                          </tr>
                        ))
                      ) : monthlySummaries.length > 0 ? (
                        monthlySummaries.map((summary, index) => (
                          <tr
                            key={summary.uid}
                            className={cn(
                              "border-b hover:bg-gray-50 transition-colors",
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            )}
                          >
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{summary.name}</div>
                              <div className="text-xs text-gray-500">{summary.username}</div>
                            </td>
                            <td className="px-4 py-3 capitalize">{summary.role}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {summary.present}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {summary.absent}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                {summary.onLeave}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const user = users.find((u) => u.uid === summary.uid);
                                  if (user) handleViewHistory(user);
                                }}
                                title="View Attendance History"
                              >
                                <History className="h-4 w-4 text-gray-600" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-3 text-center text-gray-500">
                            No attendance data available for the selected month
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {showHistoryModal && selectedUserHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-6 animate-fade-in">
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 text-center">
                Attendance History: {selectedUserHistory.name}
              </h2>
              <div className="space-y-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="date"
                      value={historyStartDate}
                      onChange={(e) => setHistoryStartDate(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="relative flex-1">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="date"
                      value={historyEndDate}
                      onChange={(e) => setHistoryEndDate(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => fetchAttendanceHistory(selectedUserHistory.uid)}
                  variant="default"
                  size="sm"
                  className="w-full"
                >
                  Update History
                </Button>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {attendanceHistory.length > 0 ? (
                  attendanceHistory.map((record) => (
                    <div
                      key={record.date}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg shadow-sm"
                    >
                      <span className="text-sm text-gray-700">{record.date}</span>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          record.status === "present" && "text-green-600",
                          record.status === "absent" && "text-red-600",
                          record.status === "on_leave" && "text-yellow-600",
                          record.status === "not_marked" && "text-gray-600"
                        )}
                      >
                        {record.status
                          .replace("_", " ")
                          .split(" ")
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(" ")}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-gray-500">No attendance records found for this period.</p>
                )}
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={() => setShowHistoryModal(false)} variant="outline" size="sm">
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;
