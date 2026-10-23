import { NextRequest, NextResponse } from "next/server";
import { EMERGENCY_CONTACTS } from "@/lib/civic/emergency-data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category")?.toUpperCase().trim() || "";

  let contacts = [...EMERGENCY_CONTACTS];

  if (category && category !== "ALL") {
    contacts = contacts.filter((c) => c.category === category);
  }

  return NextResponse.json({
    success: true,
    total: contacts.length,
    contacts,
    notice: "For life-threatening emergencies, dial 112 immediately.",
    provenance: "Verified from Maharashtra Police, National ERSS, PMC Disaster Cell, and MEMS 108.",
    lastVerifiedDate: "2026-10-20",
  });
}
