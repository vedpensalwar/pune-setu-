import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";

export default async function OfficerRootPage() {
  const session = await getSession();
  if (!session || (session.role !== "MUNICIPAL_OFFICER" && session.role !== "ADMIN")) {
    redirect("/officer/login");
  }
  redirect("/officer/dashboard");
}
