import { NextRequest, NextResponse } from "next/server";
import { queryCivicAssistant } from "@/lib/civic/assistant-engine";
import type { Language } from "@/lib/i18n";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = body?.query?.trim() || "";
    const lang = (body?.language || "en") as Language;

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Query cannot be empty" },
        { status: 400 }
      );
    }

    if (query.length > 500) {
      return NextResponse.json(
        { success: false, error: "Query exceeds 500 character limit" },
        { status: 400 }
      );
    }

    const response = await queryCivicAssistant(query, lang);

    return NextResponse.json({
      success: true,
      query,
      answer: response.answer,
      sources: response.sources,
      suggestedFollowups: response.suggestedFollowups,
      mode: response.mode,
      safetyDisclaimer:
        "Information is retrieved deterministically from verified PuneSetu, PMC, and Maharashtra RTS documentation. The assistant cannot execute administrative actions or submit complaints directly without citizen verification.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process civic query" },
      { status: 500 }
    );
  }
}
