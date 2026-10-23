import { z } from "zod";
import { User, SafeUser } from "./types";

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters long.")
      .max(100, "Name cannot exceed 100 characters."),
    email: z
      .string()
      .trim()
      .email("Please provide a valid email address.")
      .max(255, "Email address is too long.")
      .toLowerCase(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long.")
      .max(128, "Password cannot exceed 128 characters.")
      .regex(/[A-Za-z]/, "Password must contain at least one letter.")
      .regex(/[0-9]/, "Password must contain at least one number."),
    confirmPassword: z.string().optional(),
    role: z.any().optional(),
  })
  .refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address.")
    .toLowerCase(),
  password: z.string().min(1, "Password is required."),
  portal: z.enum(["citizen", "officer", "admin"]).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Remove sensitive passwordHash from User object.
 */
export function sanitizeUser(user: User): SafeUser {
  const { passwordHash: _hash, ...safe } = user;
  return safe;
}

/**
 * Sanitize redirect parameter to prevent Open Redirect attacks.
 * Only allows relative paths starting with / followed by alphanumeric or permitted path characters.
 */
export function sanitizeRedirectUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed === "/") return "/";
  // Must start with a single slash, not followed by / or \
  if (!/^\/[^\/\\]/.test(trimmed)) return null;
  // Disallow control characters and newlines
  if (/[\x00-\x1F\x7F]/.test(trimmed)) return null;
  return trimmed;
}

