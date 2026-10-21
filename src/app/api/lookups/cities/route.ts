import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, handleApiError } from "@/lib/api-response";

// GET /api/lookups/cities?stateId=123
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const stateId = searchParams.get("stateId");

    if (!stateId || !/^\d+$/.test(stateId)) {
      return badRequest("stateId query param is required and must be numeric.");
    }

    const cities = await prisma.city.findMany({
      where: { stateId: BigInt(stateId), isDeleted: false },
      orderBy: { name: "asc" },
    });

    return ok(cities);
  } catch (err) {
    return handleApiError(err);
  }
}
