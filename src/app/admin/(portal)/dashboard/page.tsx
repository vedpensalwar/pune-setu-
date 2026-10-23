import React from "react";
import { getCurrentUser } from "@/lib/auth/server";
import { AdminCommandCenter } from "@/components/admin/admin-command-center";

export default async function AdminDashboardPage() {
  const adminUser = await getCurrentUser();
  if (!adminUser) return null;

  return (
    <div className="max-w-7xl mx-auto py-2">
      <AdminCommandCenter user={adminUser} />
    </div>
  );
}
