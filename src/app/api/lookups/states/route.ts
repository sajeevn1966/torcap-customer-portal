import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, handleApiError } from "@/lib/api-response";

// GET /api/lookups/states?countryId=123
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const countryId = searchParams.get("countryId");

    if (!countryId || !/^\d+$/.test(countryId)) {
      return badRequest("countryId query param is required and must be numeric.");
    }

    const states = await prisma.state.findMany({
      where: { countryId: BigInt(countryId), isDeleted: false },
      orderBy: { name: "asc" },
    });

    return ok(states);
  } catch (err) {
    return handleApiError(err);
  }
}
