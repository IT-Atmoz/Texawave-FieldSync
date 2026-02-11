"use client";

import { useSearchParams } from "next/navigation";
import { ManageUsers } from "./components/ManageUsers";
import TrackUserLocation from "./components/TrackUserLocation";
import { AllHistoryWorks } from "./components/AllHistoryWorks";
import { ChatAdmin } from "./components/ChatAdmin";

export default function EmployeesPage() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const userId = searchParams.get("userId");
  const userName = searchParams.get("userName");

  if (view === "track" && userId && userName) {
    return <TrackUserLocation userId={userId} userName={decodeURIComponent(userName)} />;
  } else if (view === "history" && userId && userName) {
    return <AllHistoryWorks userId={userId} userName={decodeURIComponent(userName)} />;
  } else if (view === "chat" && userId && userName) {
    return <ChatAdmin userId={userId} userName={decodeURIComponent(userName)} />;
  } else {
    return <ManageUsers />;
  }
}