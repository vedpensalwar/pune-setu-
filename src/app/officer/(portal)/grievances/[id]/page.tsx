import { redirect } from "next/navigation";
import { getGrievanceByTrackingToken } from "@/lib/db/repository";

export default async function OfficerGrievanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const grievance = await getGrievanceByTrackingToken(id);
  if (grievance) {
    redirect(`/track/${grievance.trackingToken}`);
  }
  redirect(`/track/${id}`);
}
