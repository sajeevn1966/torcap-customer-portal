import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest, handleApiError } from "@/lib/api-response";
import { createSchemeSchema } from "@/lib/validation/scheme";

// GET /api/schemes?activeOnly=true
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    const schemes = await prisma.scheme.findMany({
      where: {
        isDeleted: false,
        ...(activeOnly ? { isActive: true } : {}),
      },
      orderBy: { name: "asc" },
    });

    return ok(schemes);
  } catch (err) {
    return handleApiError(err);
  }
}

// POST /api/schemes
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Request body must be valid JSON.");
    }
    const input = createSchemeSchema.parse(body);

    const scheme = await prisma.scheme.create({
      data: { ...input, createdDate: new Date() },
    });

    return created(scheme);
  } catch (err) {
    return handleApiError(err);
  }
}
