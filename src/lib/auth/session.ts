import { SignJWT, jwtVerify } from "jose";
import { SessionPayload } from "./types";

export const SESSION_COOKIE_NAME = "punesetu_session";

// 7 days expiration in seconds
export const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60;

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET || "punesetu-default-dev-session-secret-change-in-production-min-32-chars";
  return new TextEncoder().encode(secret);
}

/**
 * Sign a session payload into a cryptographically secure JWT using HMAC-SHA256.
 */
export async function signSessionToken(payload: SessionPayload): Promise<string> {
  const secret = getSessionSecret();
  return new SignJWT({
    email: payload.email,
    name: payload.name,
    role: payload.role,
    department: payload.department,
    ward: payload.ward,
    status: payload.status,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secret);
}

/**
 * Verify and decode an encrypted session token.
 * Returns null if signature is invalid or token has expired.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const secret = getSessionSecret();
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub || !payload.role || !payload.email) {
      return null;
    }
    return {
      sub: payload.sub,
      email: payload.email as string,
      name: (payload.name as string) || "",
      role: payload.role as SessionPayload["role"],
      department: payload.department as string | undefined,
      ward: payload.ward as string | undefined,
      status: (payload.status as SessionPayload["status"]) || "ACTIVE",
    };
  } catch {
    // Signature verification failure or expired token
    return null;
  }
}

/**
 * Standard cookie configuration for session cookie.
 */
export function getSessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}

/**
 * Determine default portal URL based on user role.
 */
export function getRoleDashboardUrl(role: SessionPayload["role"]): string {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "MUNICIPAL_OFFICER":
      return "/officer/dashboard";
    case "CITIZEN":
    default:
      return "/citizen/dashboard";
  }
}

