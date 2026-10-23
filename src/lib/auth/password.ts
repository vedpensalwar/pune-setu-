import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Hash a plain password using bcrypt with 10 salt rounds.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a plain password against a stored bcrypt hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
}
