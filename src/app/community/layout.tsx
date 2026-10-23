import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Feed — PuneSetu (पुणे सेतू)",
  description:
    "Explore civic issues across Pune's 15 wards. Search, filter, endorse, comment, and follow grievances reported by fellow citizens.",
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
