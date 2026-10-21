import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest, handleApiError } from "@/lib/api-response";
import { createRegistrationSchema } from "@/lib/validation/registration";

// GET /api/registrations?customerId=&schemeId=&status=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");
    const schemeId = searchParams.get("schemeId");
    const status = searchParams.get("status");

    if (customerId && !/^\d+$/.test(customerId)) return badRequest("customerId must be numeric.");
    if (schemeId && !/^\d+$/.test(schemeId)) return badRequest("schemeId must be numeric.");

    const registrations = await prisma.schemeCustomerRegistration.findMany({
      where: {
        isDeleted: false,
        ...(customerId ? { customerId: BigInt(customerId) } : {}),
        ...(schemeId ? { schemeId: BigInt(schemeId) } : {}),
        ...(status ? { status } : {}),
      },
      include: { scheme: true, customer: true },
      orderBy: { registrationDate: "desc" },
    });

    return ok(registrations);
  } catch (err) {
    return handleApiError(err);
  }
}

// POST /api/registrations
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Request body must be valid JSON.");
    }
    const input = createRegistrationSchema.parse(body);

    // Confirm the referenced customer and scheme exist before insert, so we
    // return a clean 404 instead of a raw foreign-key violation.
    const [customer, scheme] = await Promise.all([
      prisma.posCustomer.findFirst({ where: { id: input.customerId, isDeleted: false } }),
      prisma.scheme.findFirst({ where: { id: input.schemeId, isDeleted: false } }),
    ]);
    if (!customer) return badRequest("customerId does not reference an existing customer.");
    if (!scheme) return badRequest("schemeId does not reference an existing scheme.");

    const registration = await prisma.schemeCustomerRegistration.create({
      data: { ...input, createdDate: new Date() },
    });

    return created(registration);
  } catch (err) {
    return handleApiError(err);
  }
}
