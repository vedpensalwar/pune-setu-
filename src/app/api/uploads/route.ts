import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { getCurrentUser } from "@/lib/auth/server";
import { saveUploadedFile, MAX_FILE_SIZE_BYTES } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    // 1. Verify authentication server-side
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to upload evidence files." },
        { status: 401 }
      );
    }

    // 2. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "No file provided in the upload request." },
        { status: 400 }
      );
    }

    // 3. Size check before buffering
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `File size exceeds the 10MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(1)}MB`,
        },
        { status: 400 }
      );
    }

    // 4. Read buffer and save safely
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const originalFilename = file instanceof File ? file.name : "evidence-file";
    const declaredMimeType = file.type || "application/octet-stream";

    const storedFile = await saveUploadedFile(buffer, originalFilename, declaredMimeType);

    return NextResponse.json(
      {
        success: true,
        message: "File uploaded successfully.",
        file: storedFile,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process file upload." },
      { status: 400 }
    );
  }
}

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key") || searchParams.get("file") || searchParams.get("path");

    if (!key) {
      return NextResponse.json(
        { error: "Query parameter 'key' or 'file' is required." },
        { status: 400 }
      );
    }

    // Traversal check
    if (key.includes("..") || key.includes("\0")) {
      return NextResponse.json({ error: "Invalid path." }, { status: 400 });
    }

    const cleanPath = key.replace(/^\/+/, "");
    const publicDir = path.resolve(process.cwd(), "public");

    const candidates = [
      path.join(publicDir, "uploads", cleanPath),
      path.join(publicDir, "uploads", cleanPath.replace(/^uploads[/\\]?/, "")),
      path.join(publicDir, cleanPath),
      path.join(publicDir, "images", path.basename(cleanPath)),
      path.join(publicDir, "uploads", path.basename(cleanPath)),
    ];

    let foundPath: string | null = null;

    for (const candidate of candidates) {
      const resolved = path.resolve(candidate);
      if (!resolved.startsWith(publicDir)) continue;
      try {
        const stat = await fs.stat(resolved);
        if (stat.isFile()) {
          foundPath = resolved;
          break;
        }
      } catch {}
    }

    if (!foundPath) {
      return NextResponse.json(
        { error: "Evidence file not found or unavailable.", code: "PHOTO_UNAVAILABLE" },
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
    console.error("Upload retrieval error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

