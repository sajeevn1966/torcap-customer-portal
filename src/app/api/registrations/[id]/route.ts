import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, handleApiError } from "@/lib/api-response";
import { updateRegistrationSchema } from "@/lib/validation/registration";
import { parseBigIntParam, InvalidIdError } from "@/lib/params";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const id = parseBigIntParam(params.id);
    const registration = await prisma.schemeCustomerRegistration.findFirst({
      where: { id, isDeleted: false },
      include: {
        scheme: true,
        customer: true,
        lineItems: { orderBy: { createdDate: "desc" } },
      },
    });
    if (!registration) return notFound("Registration not found.");
    return ok(registration);
  } catch (err) {
    if (err instanceof InvalidIdError) return badRequest(err.message);
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const id = parseBigIntParam(params.id);
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Request body must be valid JSON.");
    }
    const input = updateRegistrationSchema.parse(body);

    const existing = await prisma.schemeCustomerRegistration.findFirst({ where: { id, isDeleted: false } });
    if (!existing) return notFound("Registration not found.");

    const registration = await prisma.schemeCustomerRegistration.update({
      where: { id },
      data: { ...input, lastModifiedDate: new Date() },
    });

    return ok(registration);
  } catch (err) {
    if (err instanceof InvalidIdError) return badRequest(err.message);
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const id = parseBigIntParam(params.id);
    const existing = await prisma.schemeCustomerRegistration.findFirst({ where: { id, isDeleted: false } });
    if (!existing) return notFound("Registration not found.");

    await prisma.schemeCustomerRegistration.update({
      where: { id },
      data: { isDeleted: true, lastModifiedDate: new Date() },
    });

    return ok({ id: id.toString(), deleted: true });
  } catch (err) {
    if (err instanceof InvalidIdError) return badRequest(err.message);
    return handleApiError(err);
  }
}
