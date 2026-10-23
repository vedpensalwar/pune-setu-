import { NextRequest, NextResponse } from "next/server";
import { lookupETapaalRecord, DEMO_ETAPAAL_RECORDS } from "@/lib/civic/etapaal-data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token")?.trim() || "";

  if (!token) {
    return NextResponse.json({
      success: true,
      mode: "DEMONSTRATION",
      disclaimer: "Operating in Demonstration Mode. Not connected to PMC live internal file intranet.",
      availableSampleTokens: DEMO_ETAPAAL_RECORDS.map((r) => r.inwardNumber),
    });
  }

  const record = lookupETapaalRecord(token);

  if (!record) {
    return NextResponse.json(
      {
        success: false,
        error: "Record not found",
        message: `No E-Tapaal file movement record exists for inward token '${token}'. In demonstration mode, only configured sample records can be retrieved.`,
        mode: "DEMONSTRATION",
        availableSampleTokens: DEMO_ETAPAAL_RECORDS.map((r) => r.inwardNumber),
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    record,
    mode: "DEMONSTRATION",
    disclaimer: "Operating in Demonstration Mode. Illustrates official PMC correspondence file movement.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = body?.token?.trim() || "";

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Tapaal token is required" },
        { status: 400 }
      );
    }

    const record = lookupETapaalRecord(token);

    if (!record) {
      return NextResponse.json(
        {
          success: false,
          error: "Record not found",
          message: `No E-Tapaal file movement record exists for inward token '${token}'.`,
          mode: "DEMONSTRATION",
          availableSampleTokens: DEMO_ETAPAAL_RECORDS.map((r) => r.inwardNumber),
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      record,
      mode: "DEMONSTRATION",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }
}
