import { NextRequest, NextResponse } from "next/server";
import { PMC_PRABHAG_WARDS } from "@/lib/civic/ward-directory-data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.toLowerCase().trim() || "";
  const zone = searchParams.get("zone")?.trim() || "";

  let results = [...PMC_PRABHAG_WARDS];

  if (zone && zone !== "ALL") {
    results = results.filter((w) => w.zone.toLowerCase().includes(zone.toLowerCase()));
  }

  if (search) {
    results = results.filter(
      (w) =>
        w.name.toLowerCase().includes(search) ||
        w.nameMr.toLowerCase().includes(search) ||
        w.nameHi.toLowerCase().includes(search) ||
        w.officeAddress.toLowerCase().includes(search) ||
        w.wardNumber.toString() === search ||
        w.jurisdictionAreas.some((area) => area.toLowerCase().includes(search)) ||
        w.jurisdictionAreasMr.some((area) => area.toLowerCase().includes(search)) ||
        w.jurisdictionAreasHi.some((area) => area.toLowerCase().includes(search))
    );
  }

  return NextResponse.json({
    success: true,
    total: results.length,
    jurisdiction: "Pune Municipal Corporation (15 Prabhag Wards)",
    pcmcNote: "Pimpri-Chinchwad Municipal Corporation is managed separately under 8 administrative zones (A to H).",
    wards: results,
    lastVerifiedDate: "2026-10-20",
    provenance: "PMC Official Administrative Ward Master (pmc.gov.in)",
  });
}
