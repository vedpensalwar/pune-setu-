import { NextResponse } from "next/server";
import { registerSchema, sanitizeUser } from "@/lib/auth/validation";
import { findUserByEmail, createUser } from "@/lib/db/user-store";
import { hashPassword } from "@/lib/auth/password";
import { signSessionToken, SESSION_COOKIE_NAME, getSessionCookieOptions } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate registration body with Zod
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid registration data";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { name, email, password } = result.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Check for duplicate account
    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please sign in." },
        { status: 409 }
      );
    }

    // Hash the password securely with bcrypt
    const passwordHash = await hashPassword(password);

    // CRITICAL SECURITY RULE: Public registration strictly creates CITIZEN role.
    // Privileged roles (ADMIN, MUNICIPAL_OFFICER) can NEVER be self-assigned.
    const newUser = await createUser({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "CITIZEN",
      status: "ACTIVE",
    });

    // Create session token
    const token = await signSessionToken({
      sub: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      status: newUser.status,
    });

    const safeUser = sanitizeUser(newUser);

    const response = NextResponse.json(
      { success: true, user: safeUser, redirectUrl: "/citizen/dashboard" },
      { status: 201 }
    );

    // Set secure HTTP-only cookie
    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration. Please try again." },
      { status: 500 }
    );
  }
}
