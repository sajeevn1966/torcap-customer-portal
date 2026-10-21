import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, handleApiError } from "@/lib/api-response";
import { updateCustomerSchema } from "@/lib/validation/customer";
import { parseBigIntParam, InvalidIdError } from "@/lib/params";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const id = parseBigIntParam(params.id);
    const customer = await prisma.posCustomer.findFirst({
      where: { id, isDeleted: false },
      include: {
        registrations: { where: { isDeleted: false }, include: { scheme: true } },
        receipts: { where: { isDeleted: false }, orderBy: { voucherDate: "desc" }, take: 20 },
      },
    });
    if (!customer) return notFound("Customer not found.");
    return ok(customer);
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
    const input = updateCustomerSchema.parse(body);

    const existing = await prisma.posCustomer.findFirst({ where: { id, isDeleted: false } });
    if (!existing) return notFound("Customer not found.");

    const customer = await prisma.posCustomer.update({
      where: { id },
      data: { ...input, lastModifiedDate: new Date() },
    });

    return ok(customer);
  } catch (err) {
    if (err instanceof InvalidIdError) return badRequest(err.message);
    return handleApiError(err);
  }
}

// Soft delete only — matches the DB's own is_deleted convention and the
// `check_references_before_soft_delete` trigger pattern already in use.
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const id = parseBigIntParam(params.id);
    const existing = await prisma.posCustomer.findFirst({ where: { id, isDeleted: false } });
    if (!existing) return notFound("Customer not found.");

    await prisma.posCustomer.update({
      where: { id },
      data: { isDeleted: true, lastModifiedDate: new Date() },
    });

    return ok({ id: id.toString(), deleted: true });
  } catch (err) {
    if (err instanceof InvalidIdError) return badRequest(err.message);
    return handleApiError(err);
  }
}
