import "server-only";
import { PrismaClient } from "@prisma/client";

// Prevents exhausting the Postgres connection pool from Next.js hot-reload
// creating a new PrismaClient on every module reload in dev.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
