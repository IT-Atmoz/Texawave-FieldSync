import React from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationProps {
  message: string;
  type: "success" | "error";
}

const Notification: React.FC<NotificationProps> = ({ message, type }) => {
  return (
    <div
      className={cn(
        "flex items-center gap-2 p-3 rounded-lg mb-6 transition-all duration-300 animate-slide-down w-full max-w-md mx-auto",
        type === "error" ? "bg-red-100 text-red-800 shadow-md" : "bg-green-100 text-green-800 shadow-md"
      )}
    >
      {type === "error" ? (
        <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5" />
      ) : (
        <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5" />
      )}
      <span className="text-xs sm:text-sm font-medium">{message}</span>
    </div>
  );
};

export default Notification;