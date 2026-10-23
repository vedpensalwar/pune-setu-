import { NextResponse } from "next/server";
import { STATUTORY_NOTIFIED_SERVICES, PUNESETU_SLA_BENCHMARKS } from "@/lib/civic/charter-data";

export async function GET() {
  return NextResponse.json({
    success: true,
    jurisdiction: "Pune Municipal Corporation & Maharashtra State",
    governingAct: "Maharashtra Right to Public Services Act, 2015",
    statutoryNotifiedServices: STATUTORY_NOTIFIED_SERVICES,
    puneSetuSLABenchmarks: PUNESETU_SLA_BENCHMARKS,
    legalDistinctionNote:
      "Statutory notified services possess legally binding time limits enforceable under MCRPS. Physical civic infrastructure complaints are handled through municipal engineering divisions under PuneSetu target SLAs.",
    provenance: "Maharashtra State Commission for Right to Public Services (aaplesarkar.mahaonline.gov.in) & PMC Citizen Charter (pmc.gov.in)",
    lastVerifiedDate: "2026-10-20",
  });
}
