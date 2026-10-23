import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, verifySessionToken, getSessionCookieOptions } from "./session";
import { Role, SafeUser, SessionPayload, User } from "./types";
import { findUserById } from "../db/user-store";
import { sanitizeUser } from "./validation";

/**
 * Retrieve the current session payload from the HTTP-only cookie.
 * Does not throw; returns null if unauthenticated or invalid.
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Retrieve the verified user record for the current session.
 * Fetches fresh record from persistent store to ensure user is still active.
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  const session = await getSession();
  if (!session?.sub) return null;

  const user = await findUserById(session.sub);
  if (!user || user.status !== "ACTIVE") {
    return null;
  }

  return sanitizeUser(user);
}

/**
 * Server-side authorization guard for pages and server actions.
 * Throws redirect if unauthenticated or if user lacks required role.
 *
 * @param allowedRoles - Optional list of allowed roles. If omitted, any authenticated user is allowed.
 * @param redirectPath - Path to redirect if unauthenticated (defaults to /login)
 */
export async function requireAuth(
  allowedRoles?: Role[],
  redirectPath = "/login"
): Promise<SafeUser> {
  const session = await getSession();

  if (!session) {
    redirect(redirectPath);
  }

  const user = await findUserById(session.sub);
  if (!user || user.status !== "ACTIVE") {
    // Invalidate invalid/suspended session
    redirect(redirectPath);
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect("/unauthorized");
  }

  return sanitizeUser(user);
}

export { getRoleDashboardUrl } from "./session";

/**
 * Set session cookie in server action or route handler.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  const options = getSessionCookieOptions();
  cookieStore.set(SESSION_COOKIE_NAME, token, options);
}

/**
 * Clear session cookie in server action or route handler.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });
}
