import { redirect } from "next/navigation";

export default function EmergencyRedirect() {
  redirect("/services/emergency");
}
