import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, handleApiError } from "@/lib/api-response";
import { updateReceiptSchema } from "@/lib/validation/receipt";
import { parseBigIntParam, InvalidIdError } from "@/lib/params";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const id = parseBigIntParam(params.id);
    const receipt = await prisma.schemeReceipt.findFirst({
      where: { id, isDeleted: false },
      include: {
        customer: true,
        lineItems: { include: { scheme: true, registration: true } },
        paymentDetails: true,
      },
    });
    if (!receipt) return notFound("Receipt not found.");
    return ok(receipt);
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
    const input = updateReceiptSchema.parse(body);

    const existing = await prisma.schemeReceipt.findFirst({ where: { id, isDeleted: false } });
    if (!existing) return notFound("Receipt not found.");

    const receipt = await prisma.schemeReceipt.update({
      where: { id },
      data: { ...input, lastModifiedDate: new Date() },
    });

    return ok(receipt);
  } catch (err) {
    if (err instanceof InvalidIdError) return badRequest(err.message);
    return handleApiError(err);
  }
}

// Soft delete a receipt. Line items and payment details are left in place
// (they carry their own is_deleted flag) so the audit trail is preserved —
// mirrors the existing check_references_before_soft_delete trigger pattern.
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const id = parseBigIntParam(params.id);
    const existing = await prisma.schemeReceipt.findFirst({ where: { id, isDeleted: false } });
    if (!existing) return notFound("Receipt not found.");

    await prisma.schemeReceipt.update({
      where: { id },
      data: { isDeleted: true, lastModifiedDate: new Date() },
    });

    return ok({ id: id.toString(), deleted: true });
  } catch (err) {
    if (err instanceof InvalidIdError) return badRequest(err.message);
    return handleApiError(err);
  }
}
