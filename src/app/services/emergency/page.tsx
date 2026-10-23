import { Metadata } from "next";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { EmergencyDirectoryView } from "@/components/civic/emergency-directory-view";

export const metadata: Metadata = {
  title: "Verified Emergency Contacts — PuneSetu (पुणे सेतू)",
  description:
    "Government-verified emergency telephone lines for disaster, medical, fire, police, and civic crises in Pune, Maharashtra.",
};

export default function EmergencyDirectoryPage() {
  return (
    <>
      <PublicHeader />
      <main id="main-content">
        <EmergencyDirectoryView />
      </main>
      <PublicFooter />
    </>
  );
}
