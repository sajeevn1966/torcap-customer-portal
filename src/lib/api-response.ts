import "server-only";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

/**
 * Postgres `bigint` columns come back from Prisma as JS `BigInt`, which
 * `JSON.stringify` cannot serialize. We recursively convert BigInt -> string
 * before handing data to NextResponse.json so every route gets this for free
 * instead of reimplementing it per-endpoint.
 */
function serializeBigInts<T>(value: T): T {
  if (typeof value === "bigint") {
    return value.toString() as unknown as T;
  }
  if (value instanceof Date) {
    return value as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => serializeBigInts(item)) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      out[key] = serializeBigInts(val);
    }
    return out as T;
  }
  return value;
}

export function ok<T>(data: T, init?: { status?: number }) {
  return NextResponse.json(
    { success: true, data: serializeBigInts(data) },
    { status: init?.status ?? 200 }
  );
}

export function created<T>(data: T) {
  return ok(data, { status: 201 });
}

type ApiErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

function fail(status: number, code: string, message: string, details?: unknown) {
  const body: ApiErrorBody = { success: false, error: { code, message, details } };
  return NextResponse.json(body, { status });
}

/**
 * Central error handler for route handlers. Wrap the body of every route in
 * try/catch and call this in the catch block so database errors, validation
 * errors, and unexpected errors all produce a consistent, safe response
 * (no raw Postgres error text or stack traces leak to the client).
 */
export function handleApiError(err: unknown) {
  if (err instanceof ZodError) {
    return fail(422, "VALIDATION_ERROR", "The request body failed validation.", err.flatten());
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        return fail(
          409,
          "UNIQUE_CONSTRAINT_VIOLATION",
          `A record with this ${(err.meta?.target as string[] | undefined)?.join(", ") ?? "value"} already exists.`
        );
      case "P2003":
        return fail(
          409,
          "FOREIGN_KEY_VIOLATION",
          "This operation references a record that does not exist (e.g. an invalid customer, scheme, or receipt id)."
        );
      case "P2025":
        return fail(404, "NOT_FOUND", "The requested record was not found.");
      default:
        return fail(500, "DATABASE_ERROR", "A database error occurred.", { prismaCode: err.code });
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return fail(400, "INVALID_REQUEST", "The request could not be processed by the database layer.");
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    // DATABASE_URL misconfigured, DB unreachable, etc. Never leak the
    // connection string or host details to the client.
    return fail(503, "DATABASE_UNAVAILABLE", "The database is currently unavailable. Please try again shortly.");
  }

  console.error("Unhandled API error:", err);
  return fail(500, "INTERNAL_ERROR", "An unexpected error occurred.");
}

export function badRequest(message: string, details?: unknown) {
  return fail(400, "BAD_REQUEST", message, details);
}

export function notFound(message = "The requested record was not found.") {
  return fail(404, "NOT_FOUND", message);
}
