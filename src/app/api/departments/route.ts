import { NextResponse } from "next/server";
import { listDepartments } from "@/lib/db/repository";

export async function GET() {
  try {
    const departments = await listDepartments();
    return NextResponse.json({
      success: true,
      departments,
    });
  } catch (error: any) {
    console.error("List departments error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve departments." },
      { status: 500 }
    );
  }
}
