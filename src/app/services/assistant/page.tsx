import { Metadata } from "next";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { CivicAssistantView } from "@/components/civic/civic-assistant-view";

export const metadata: Metadata = {
  title: "Civic Knowledge Assistant — PuneSetu (पुणे सेतू)",
  description:
    "Grounded civic assistant providing verified answers regarding reporting grievances, finding ward offices, emergency helplines, and Maharashtra RTS rights in Pune.",
};

export default function CivicAssistantPage() {
  return (
    <>
      <PublicHeader />
      <main id="main-content">
        <CivicAssistantView />
      </main>
      <PublicFooter />
    </>
  );
}
