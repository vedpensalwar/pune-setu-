import React from "react";
import { getCurrentUser } from "@/lib/auth/server";
import { OfficerWorkspace } from "@/components/officer/officer-workspace";

export default async function OfficerDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto py-2">
      <OfficerWorkspace user={user} />
    </div>
  );
}
