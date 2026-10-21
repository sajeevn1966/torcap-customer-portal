import { prisma } from "@/lib/prisma";
import { ok, handleApiError } from "@/lib/api-response";

// GET /api/lookups/countries
export async function GET() {
  try {
    const countries = await prisma.country.findMany({
      where: { isDeleted: false },
      orderBy: { name: "asc" },
    });
    return ok(countries);
  } catch (err) {
    return handleApiError(err);
  }
}
