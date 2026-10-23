import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_PER_GRIEVANCE = 5;

export const PERMITTED_MIME_TYPES: Record<string, { ext: string; type: "PHOTO" | "DOCUMENT" | "VIDEO" }> = {
  "image/jpeg": { ext: ".jpg", type: "PHOTO" },
  "image/png": { ext: ".png", type: "PHOTO" },
  "image/webp": { ext: ".webp", type: "PHOTO" },
  "application/pdf": { ext: ".pdf", type: "DOCUMENT" },
  "video/mp4": { ext: ".mp4", type: "VIDEO" },
  "audio/mpeg": { ext: ".mp3", type: "DOCUMENT" },
  "audio/wav": { ext: ".wav", type: "DOCUMENT" },
  "audio/ogg": { ext: ".ogg", type: "DOCUMENT" },
  "audio/webm": { ext: ".webm", type: "DOCUMENT" },
};

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export interface StoredFile {
  id: string;
  storageKey: string;
  url: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  evidenceType: "PHOTO" | "DOCUMENT" | "VIDEO";
}

/**
 * Initializes the upload storage directory safely.
 */
export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export { getEvidenceUrl } from "../civic/evidence-url";

/**
 * Validates and saves an uploaded file buffer with strict security checks:
 * 1. File size limit (10MB)
 * 2. MIME type whitelisting
 * 3. Safe UUID filename generation to prevent path traversal & script execution
 */
export async function saveUploadedFile(
  buffer: Buffer,
  originalFilename: string,
  declaredMimeType: string
): Promise<StoredFile> {
  // 1. Validate file size and non-empty content
  if (buffer.length === 0) {
    throw new Error("Uploaded file cannot be empty (0 bytes).");
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File size (${(buffer.length / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum allowed limit of 10MB.`
    );
  }

  // 2. Validate MIME type
  const normalizedMime = declaredMimeType.trim().toLowerCase();
  const mimeConfig = PERMITTED_MIME_TYPES[normalizedMime];
  if (!mimeConfig) {
    throw new Error(
      `File format "${declaredMimeType}" is not permitted. Allowed formats: JPEG, PNG, WebP, PDF, MP4, MP3/WAV.`
    );
  }

  // 3. Inspect actual binary file signatures / magic bytes where practical
  if (buffer.length >= 4) {
    if (normalizedMime === "image/jpeg") {
      const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
      if (!isJpeg) {
        throw new Error("File content does not match the declared JPEG image format.");
      }
    } else if (normalizedMime === "image/png") {
      const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
      if (!isPng) {
        throw new Error("File content does not match the declared PNG image format.");
      }
    } else if (normalizedMime === "application/pdf") {
      const isPdf = buffer.toString("utf8", 0, 4) === "%PDF";
      if (!isPdf) {
        throw new Error("File content does not match the declared PDF document format.");
      }
    } else if (normalizedMime === "image/webp") {
      const isWebp =
        buffer.length >= 12 &&
        buffer.toString("utf8", 0, 4) === "RIFF" &&
        buffer.toString("utf8", 8, 12) === "WEBP";
      if (!isWebp) {
        throw new Error("File content does not match the declared WebP image format.");
      }
    } else if (normalizedMime === "video/mp4") {
      const isMp4 = buffer.length >= 8 && buffer.toString("utf8", 4, 8) === "ftyp";
      if (!isMp4) {
        throw new Error("File content does not match the declared MP4 video format.");
      }
    }
  }

  // 3. Generate safe cryptographic filename
  await ensureUploadDir();
  const fileId = `evd_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`;
  const safeFilename = `${fileId}${mimeConfig.ext}`;
  const filePath = path.join(UPLOAD_DIR, safeFilename);

  // 4. Atomic write
  const tempPath = `${filePath}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(tempPath, buffer);
  await fs.rename(tempPath, filePath);

  // Clean original filename for display (strip path chars)
  const sanitizedOriginalName = path.basename(originalFilename).substring(0, 255);

  return {
    id: fileId,
    storageKey: `uploads/${safeFilename}`,
    url: `/uploads/${safeFilename}`,
    originalFilename: sanitizedOriginalName,
    mimeType: normalizedMime,
    sizeBytes: buffer.length,
    evidenceType: mimeConfig.type,
  };
}
