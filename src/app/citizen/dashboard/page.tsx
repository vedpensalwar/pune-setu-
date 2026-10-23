import React from "react";
import { getCurrentUser } from "@/lib/auth/server";
import { CitizenDashboardView } from "@/components/citizen/citizen-dashboard-view";

export default async function CitizenDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <CitizenDashboardView user={user} />
    </div>
  );
}
