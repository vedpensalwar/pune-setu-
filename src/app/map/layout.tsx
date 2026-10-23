import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interactive Civic Map — PuneSetu (पुणे सेतू)",
  description:
    "Geospatial visualization of civic grievances across Pune's 15 Prabhag Wards with category and status filtering.",
};

export default function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
