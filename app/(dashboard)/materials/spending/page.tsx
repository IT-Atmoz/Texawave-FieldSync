"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import MaterialsSpending from "../MaterialsSpending";

const SpendingPage = () => {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [notification, setNotification] = useState<{ message: string; type: "error" | "success" } | null>(null);

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

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 font-roboto">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Materials Spending
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

        <div className="space-y-6">
          <MaterialsSpending />
        </div>
      </div>
    </div>
  );
};

export default SpendingPage;