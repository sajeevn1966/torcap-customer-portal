import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest, notFound, handleApiError } from "@/lib/api-response";
import { createLineItemSchema } from "@/lib/validation/receipt";
import { parseBigIntParam, InvalidIdError } from "@/lib/params";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const receiptId = parseBigIntParam(params.id);
    const receipt = await prisma.schemeReceipt.findFirst({ where: { id: receiptId, isDeleted: false } });
    if (!receipt) return notFound("Receipt not found.");

    const lineItems = await prisma.schemeReceiptLineItem.findMany({
      where: { schemeReceiptId: receiptId },
      include: { scheme: true, registration: true },
      orderBy: { createdDate: "asc" },
    });

    return ok(lineItems);
  } catch (err) {
    if (err instanceof InvalidIdError) return badRequest(err.message);
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const receiptId = parseBigIntParam(params.id);
    const receipt = await prisma.schemeReceipt.findFirst({ where: { id: receiptId, isDeleted: false } });
    if (!receipt) return notFound("Receipt not found.");

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Request body must be valid JSON.");
    }
    const input = createLineItemSchema.parse(body);

    const lineItem = await prisma.schemeReceiptLineItem.create({
      data: { ...input, schemeReceiptId: receiptId, createdDate: new Date() },
    });

    return created(lineItem);
  } catch (err) {
    if (err instanceof InvalidIdError) return badRequest(err.message);
    return handleApiError(err);
  }
}
