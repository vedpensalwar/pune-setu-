export const TRACKING_TOKEN_REGEX = /^PS-PUN-\d{4}-[A-Z0-9]{6}$/;

/**
 * Generate a cryptographically secure PuneSetu grievance tracking token.
 * Format: PS-PUN-YYYY-XXXXXX
 * Example: PS-PUN-2026-894215
 */
export function generateTrackingToken(year?: number): string {
  const currentYear = year || new Date().getFullYear();
  // 6-digit cryptographically secure random integer [100000, 999999] using Web Standard crypto
  let randomSuffix: string;
  if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    const array = new Uint32Array(1);
    globalThis.crypto.getRandomValues(array);
    const num = 100000 + (array[0] % 900000);
    randomSuffix = num.toString();
  } else {
    randomSuffix = Math.floor(100000 + Math.random() * 900000).toString();
  }
  return `PS-PUN-${currentYear}-${randomSuffix}`;
}

/**
 * Validate tracking token string format.
 */
export function isValidTrackingToken(token: string): boolean {
  if (!token || typeof token !== "string") return false;
  return TRACKING_TOKEN_REGEX.test(token.trim().toUpperCase());
}
