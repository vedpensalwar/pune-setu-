import { Metadata } from "next";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { CitizenCharterView } from "@/components/civic/citizen-charter-view";

export const metadata: Metadata = {
  title: "Citizen Charter & Civic Rights — PuneSetu (पुणे सेतू)",
  description:
    "Official Maharashtra Right to Public Services Act (RTS 2015) statutory timelines, designated officers, and PuneSetu municipal resolution targets.",
};

export default function CitizenCharterPage() {
  return (
    <>
      <PublicHeader />
      <main id="main-content">
        <CitizenCharterView />
      </main>
      <PublicFooter />
    </>
  );
}
