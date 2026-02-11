import * as React from "react";
import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase";
import { CardComponent, CardContentComponent } from "../utils/ui-components";
import { Work } from "../utils/types";

interface AllHistoryWorksProps {
  userId: string;
  userName: string;
}

export const AllHistoryWorks = ({ userId, userName }: AllHistoryWorksProps) => {
  const [works, setWorks] = useState<Work[]>([]);

  useEffect(() => {
    const worksRef = ref(database, `users/${userId}/works`);
    const unsubscribe = onValue(worksRef, (snapshot) => {
      if (snapshot.exists()) {
        const worksData = snapshot.val();
        const worksList = Object.values(worksData).map((work: any, index: number) => ({
          workId: index,
          ...work,
        })) as Work[];
        setWorks(worksList);
      } else {
        setWorks([]);
        alert(`No work history found for ${userName}`);
      }
    });

    return () => unsubscribe();
  }, [userId, userName]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex flex-col items-center">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-8 text-center">{userName}'s Work History</h1>
        <div className="space-y-6">
          {works.map((work) => (
            <CardComponent key={work.workId} className="p-6 shadow-lg hover:shadow-xl transition-all">
              <h3 className="text-xl font-semibold text-gray-800">{work.name}</h3>
              <CardContentComponent>
                <p className="text-gray-600 mt-2">Place: {work.place}</p>
                <p className="text-gray-600">
                  Assigned: {work.assignedAt ? new Date(work.assignedAt).toLocaleString() : "N/A"} ({work.assignedDay || "N/A"})
                </p>
                <p className={`text-gray-600 ${work.accepted ? "text-green-500" : "text-red-500"}`}>
                  Accepted: {work.accepted ? "Yes" : "No"}
                </p>
                <p className={`text-gray-600 ${work.status === "completed" ? "text-green-500" : "text-red-500"}`}>
                  Status: {work.status === "completed" ? `Completed on ${work.completedAt ? new Date(work.completedAt).toLocaleString() : "N/A"}` : work.status}
                </p>
              </CardContentComponent>
            </CardComponent>
          ))}
        </div>
      </div>
    </div>
  );
};