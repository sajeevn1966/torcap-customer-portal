import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, handleApiError } from "@/lib/api-response";
import { getSessionCustomerId } from "@/lib/session";
import { updateProfileSchema } from "@/lib/validation/profile";

const profileInclude = {
  state: true,
  city: true,
  country: true,
  nationality: true,
  documentIssuingCountry: true,
} as const;

// GET /api/profile — the logged-in customer's own record only. There is no
// :id in this route on purpose: the customer id always comes from the
// session cookie, never from anything the client could tamper with, so
// there's no way to request another customer's profile through this route.
export async function GET() {
  try {
    const customerId = getSessionCustomerId();
    if (!customerId) return notFound("Not signed in.");

    const customer = await prisma.posCustomer.findFirst({
      where: { id: BigInt(customerId), isDeleted: false },
      include: profileInclude,
    });

    if (!customer) return notFound("Profile not found.");

    return ok(customer);
  } catch (err) {
    return handleApiError(err);
  }
}

// PATCH /api/profile — updates only the fields the customer is allowed to
// self-edit. `name` and `mobile` are enforced view-only here regardless of
// what a request sends, since updateProfileSchema doesn't include them —
// zod strips any unrecognized keys, so they can never reach the database
// write below even if a client tried to include them.
export async function PATCH(req: NextRequest) {
  try {
    const customerId = getSessionCustomerId();
    if (!customerId) return notFound("Not signed in.");

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Request body must be valid JSON.");
    }
    const input = updateProfileSchema.parse(body);

    const existing = await prisma.posCustomer.findFirst({
      where: { id: BigInt(customerId), isDeleted: false },
    });
    if (!existing) return notFound("Profile not found.");

    // country_code is derived, not directly editable — when countryId
    // changes, look up that country's own country_code and store that,
    // rather than trusting a client-supplied value for it (which isn't
    // even accepted by updateProfileSchema in the first place).
    let countryCode: string | null | undefined = undefined;
    if (input.countryId !== undefined) {
      if (input.countryId === null) {
        countryCode = null;
      } else {
        const country = await prisma.country.findFirst({ where: { id: input.countryId } });
        if (!country) return badRequest("countryId does not reference an existing country.");
        countryCode = country.countryCode;
      }
    }

    // A field the form actively submitted as an empty string means the
    // customer cleared it — that should persist as NULL in the database,
    // not be silently skipped. `undefined` (the field wasn't sent at all)
    // is the only case that leaves the existing value untouched.
    const emptyToNull = (v: string | undefined) => (v === undefined ? undefined : v === "" ? null : v);

    // last_modified_by is varchar(50) in the database, so this must stay
    // within that limit even for a long customer name — truncate rather
    // than risk a database error on save. Tagging it with "- Portal"
    // distinguishes a customer's own self-service edit here from an edit
    // made by staff in the POS/back-office system, which is what this
    // column is for.
    const lastModifiedBy = `${existing.name ?? "Customer"} - Portal`.slice(0, 50);

    const customer = await prisma.posCustomer.update({
      where: { id: BigInt(customerId) },
      data: {
        whatsappNumber: emptyToNull(input.whatsappNumber),
        email: emptyToNull(input.email),
        idCardType: emptyToNull(input.idCardType),
        idCardNumber: emptyToNull(input.idCardNumber),
        address: emptyToNull(input.address),
        zipcode: emptyToNull(input.zipcode),
        stateId: input.stateId,
        cityId: input.cityId,
        countryId: input.countryId,
        nationalityId: input.nationalityId,
        documentIssuingCountryId: input.documentIssuingCountryId,
        dateOfBirth: input.dateOfBirth,
        language: emptyToNull(input.language),
        ...(countryCode !== undefined ? { countryCode } : {}),
        lastModifiedBy,
        lastModifiedDate: new Date(),
      },
      include: profileInclude,
    });

    return ok(customer);
  } catch (err) {
    return handleApiError(err);
  }
}
