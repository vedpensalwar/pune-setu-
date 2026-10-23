import { Metadata } from "next";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { ETapaalTrackerView } from "@/components/civic/etapaal-tracker-view";

export const metadata: Metadata = {
  title: "E-Tapaal File Movement Tracker — PuneSetu (पुणे सेतू)",
  description:
    "Track municipal correspondence, inward applications, and administrative file movements across Pune Municipal Corporation departments.",
};

export default function ETapaalPage() {
  return (
    <>
      <PublicHeader />
      <main id="main-content">
        <ETapaalTrackerView />
      </main>
      <PublicFooter />
    </>
  );
}
