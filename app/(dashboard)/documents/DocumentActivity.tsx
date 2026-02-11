import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

export default function DocumentActivity({ activity = [] }: { activity: any[] }) {
  if (!activity?.length) return null;
  return (
    <div className="mt-3 border-t pt-2">
      <div className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
        <Clock className="h-3 w-3" /> Activity Log
      </div>
      <ul className="space-y-1 text-xs">
        {activity
          .sort((a, b) => b.at - a.at)
          .map((a, i) => (
            <li key={i} className="flex gap-2 items-center text-gray-700">
              <Badge className="px-2 py-0.5 bg-indigo-50 text-indigo-700">{a.action}</Badge>
              <span className="text-gray-400">{new Date(a.at).toLocaleString()}</span>
              <span className="text-gray-500">{a.by}</span>
              <span className="text-gray-700">{a.note}</span>
            </li>
          ))}
      </ul>
    </div>
  );
}
