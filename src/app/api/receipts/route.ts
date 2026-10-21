import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest, handleApiError } from "@/lib/api-response";
import { createReceiptSchema, createLineItemSchema, createPaymentDetailSchema } from "@/lib/validation/receipt";
import { z } from "zod";

// A receipt is normally created together with its line items (which
// installment(s) it pays) and payment details (cash/card/bank split), so
// POST accepts an optional nested payload and writes all three in one
// transaction — an all-or-nothing installment receipt, matching how the POS
// terminal itself would post a scheme receipt.
const createReceiptWithDetailsSchema = createReceiptSchema.extend({
  lineItems: z.array(createLineItemSchema).default([]),
  paymentDetails: z.array(createPaymentDetailSchema).default([]),
});

// GET /api/receipts?customerId=&branchId=&from=&to=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");
    const branchId = searchParams.get("branchId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (customerId && !/^\d+$/.test(customerId)) return badRequest("customerId must be numeric.");
    if (branchId && !/^\d+$/.test(branchId)) return badRequest("branchId must be numeric.");

    const receipts = await prisma.schemeReceipt.findMany({
      where: {
        isDeleted: false,
        ...(customerId ? { customerId: BigInt(customerId) } : {}),
        ...(branchId ? { branchId: BigInt(branchId) } : {}),
        ...(from || to
          ? {
              voucherDate: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      include: { lineItems: true, paymentDetails: true, customer: true },
      orderBy: { voucherDate: "desc" },
    });

    return ok(receipts);
  } catch (err) {
    return handleApiError(err);
  }
}

// POST /api/receipts
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Request body must be valid JSON.");
    }
    const { lineItems, paymentDetails, ...receiptInput } = createReceiptWithDetailsSchema.parse(body);

    const customer = await prisma.posCustomer.findFirst({
      where: { id: receiptInput.customerId, isDeleted: false },
    });
    if (!customer) return badRequest("customerId does not reference an existing customer.");

    const receipt = await prisma.$transaction(async (tx) => {
      const createdReceipt = await tx.schemeReceipt.create({
        data: { ...receiptInput, createdDate: new Date() },
      });

      if (lineItems.length > 0) {
        await tx.schemeReceiptLineItem.createMany({
          data: lineItems.map((li) => ({
            ...li,
            schemeReceiptId: createdReceipt.id,
            createdDate: new Date(),
          })),
        });
      }

      if (paymentDetails.length > 0) {
        await tx.schemeReceiptPaymentDetail.createMany({
          data: paymentDetails.map((pd) => ({
            ...pd,
            schemeReceiptId: createdReceipt.id,
            createdDate: new Date(),
          })),
        });
      }

      return tx.schemeReceipt.findUniqueOrThrow({
        where: { id: createdReceipt.id },
        include: { lineItems: true, paymentDetails: true },
      });
    });

    return created(receipt);
  } catch (err) {
    return handleApiError(err);
  }
}
