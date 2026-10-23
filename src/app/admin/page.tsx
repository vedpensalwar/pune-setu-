import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";

export default async function AdminRootPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/admin/login");
  }
  redirect("/admin/dashboard");
}
