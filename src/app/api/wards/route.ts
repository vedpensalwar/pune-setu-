import { NextResponse } from "next/server";
import { listWards } from "@/lib/db/repository";

export async function GET() {
  try {
    const wards = await listWards();
    return NextResponse.json({
      success: true,
      wards,
    });
  } catch (error: any) {
    console.error("List wards error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve wards." },
      { status: 500 }
    );
  }
}
