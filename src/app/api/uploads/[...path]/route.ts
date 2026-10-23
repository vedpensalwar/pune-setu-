import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".webm": "audio/webm",
  ".svg": "image/svg+xml",
};

/**
 * GET /api/uploads/[...path]
 * Securely retrieves and streams uploaded evidence photos and documents.
 * Protects against directory traversal and ensures files are served with
 * appropriate content-type and cache headers.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path: segments } = await context.params;

    if (!segments || segments.length === 0) {
      return NextResponse.json(
        { error: "Evidence file path is required." },
        { status: 400 }
      );
    }

    // Security: Strict directory traversal prevention
    for (const segment of segments) {
      if (
        segment === ".." ||
        segment === "." ||
        segment.includes("/") ||
        segment.includes("\\") ||
        segment.includes("\0")
      ) {
        return NextResponse.json(
          { error: "Invalid evidence file path." },
          { status: 400 }
        );
      }
    }

    const relativePath = segments.join("/");
    const publicDir = path.resolve(process.cwd(), "public");

    // Candidate lookup locations inside project storage
    const candidates = [
      path.join(publicDir, "uploads", relativePath),
      path.join(publicDir, "uploads", relativePath.replace(/^uploads[/\\]?/, "")),
      path.join(publicDir, relativePath),
      path.join(publicDir, "images", path.basename(relativePath)),
      path.join(publicDir, "uploads", path.basename(relativePath)),
    ];

    let foundPath: string | null = null;

    for (const candidate of candidates) {
      const resolved = path.resolve(candidate);
      // Ensure resolved candidate is strictly within publicDir
      if (!resolved.startsWith(publicDir)) continue;

      try {
        const stat = await fs.stat(resolved);
        if (stat.isFile()) {
          foundPath = resolved;
          break;
        }
      } catch {
        // Continue searching candidates
      }
    }

    if (!foundPath) {
      return NextResponse.json(
        {
          error: "Requested complaint photo was not found or is unavailable on disk.",
          code: "PHOTO_UNAVAILABLE",
        },
        { status: 404 }
      );
    }

    const ext = path.extname(foundPath).toLowerCase();
    const contentType = MIME_MAP[ext] || "application/octet-stream";
    const fileBuffer = await fs.readFile(foundPath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error: any) {
    console.error("Error retrieving evidence file:", error);
    return NextResponse.json(
      { error: "Failed to retrieve evidence file." },
      { status: 500 }
    );
  }
}
