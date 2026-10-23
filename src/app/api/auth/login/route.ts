import { NextResponse } from "next/server";
import { loginSchema, sanitizeUser } from "@/lib/auth/validation";
import { findUserByEmail, updateUser } from "@/lib/db/user-store";
import { verifyPassword } from "@/lib/auth/password";
import { signSessionToken, SESSION_COOKIE_NAME, getSessionCookieOptions } from "@/lib/auth/session";
import { getRoleDashboardUrl } from "@/lib/auth/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate login body with Zod
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid credentials format";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { email, password, portal } = result.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Find user by normalized email
    const user = await findUserByEmail(normalizedEmail);

    // Timing-safe check: always perform a password verify even if user is not found to prevent timing attacks
    const dummyHash = "$2a$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstu";
    const passwordValid = user
      ? await verifyPassword(password, user.passwordHash)
      : await verifyPassword(password, dummyHash).catch(() => false);

    if (!user || !passwordValid) {
      // Generic error message: do not disclose whether user exists
      return NextResponse.json(
        { error: "Invalid email address or password. Please verify your credentials." },
        { status: 401 }
      );
    }

    // Portal-specific role authorization checks
    if (portal === "officer" && user.role !== "MUNICIPAL_OFFICER" && user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Access denied: Citizen accounts cannot access the Municipal Officer Portal. Please use the Citizen Sign In portal.",
        },
        { status: 403 }
      );
    }

    if (portal === "admin" && user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Access denied: PMC Command Center requires verified Administrator clearance. Field personnel should use the Municipal Officer Portal.",
        },
        { status: 403 }
      );
    }

    // Verify account status
    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        {
          error:
            "This account is currently suspended or inactive. Please contact municipal administration at contact@punesetu.gov.in.",
        },
        { status: 403 }
      );
    }

    // Update last login timestamp
    const now = new Date().toISOString();
    await updateUser(user.id, { lastLoginAt: now });

    // Sign session JWT
    const token = await signSessionToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      ward: user.ward,
      status: user.status,
    });

    const safeUser = sanitizeUser(user);
    const redirectUrl = getRoleDashboardUrl(user.role);

    const response = NextResponse.json({
      success: true,
      user: safeUser,
      redirectUrl,
    });

    // Set secure HTTP-only cookie
    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());

    return response;
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during sign-in. Please try again." },
      { status: 500 }
    );
  }
}
