/**
 * Canonical URL resolver for stored evidence and complaint photographs.
 * Pure helper safe for both client and server components (no Node.js built-ins).
 */
export function getEvidenceUrl(storageKey?: string | null): string | null {
  if (!storageKey || typeof storageKey !== "string") return null;
  let clean = storageKey.trim().replace(/^\/+/, "");
  clean = clean.replace(/^(api\/)?uploads\//i, "");
  if (!clean) return null;
  return `/api/uploads/${clean}`;
}
