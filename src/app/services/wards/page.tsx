import { Metadata } from "next";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { WardDirectoryView } from "@/components/civic/ward-directory-view";

export const metadata: Metadata = {
  title: "15 Prabhag Wards Directory — PuneSetu (पुणे सेतू)",
  description:
    "Verified administrative ward offices, contact phone numbers, office hours, and jurisdictional localities across Pune Municipal Corporation.",
};

export default function WardDirectoryPage() {
  return (
    <>
      <PublicHeader />
      <main id="main-content">
        <WardDirectoryView />
      </main>
      <PublicFooter />
    </>
  );
}
