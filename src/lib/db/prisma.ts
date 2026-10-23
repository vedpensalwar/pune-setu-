import { PrismaClient } from "@prisma/client";

declare global {
  // Allow global `var` declarations in TypeScript
  var prisma: PrismaClient | undefined;
}

/**
 * Singleton pattern for PrismaClient in Next.js to prevent connection pool exhaustion during development HMR.
 */
export const prisma =
  globalThis.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;
