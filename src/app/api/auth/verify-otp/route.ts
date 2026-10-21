import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, badRequest, notFound, handleApiError } from "@/lib/api-response";
import { verifyPendingOtp } from "@/lib/otp";
import { setSessionCustomerId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const verifySchema = z.object({
  code: z.string().min(4).max(10),
});

const REASON_MESSAGES: Record<string, string> = {
  "no-pending-code": "Your Code Has Expired. Please Start Over.",
  expired: "Your Code Has Expired. Please Start Over.",
  "too-many-attempts": "Too Many Incorrect Attempts. Please Start Over.",
  "incorrect-code": "That Code Is Incorrect. Please Try Again.",
};

// POST /api/auth/verify-otp
//
// Step 2 of login — checks the code the customer typed against the
// signed, short-lived pending-OTP cookie set by /api/auth/lookup. Only on
// a correct match does the real session cookie get set.
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Request body must be valid JSON.");
    }
    const { code } = verifySchema.parse(body);

    const result = verifyPendingOtp(code);
    if (!result.ok) {
      return notFound(REASON_MESSAGES[result.reason] ?? "We Couldn't Verify That Code.");
    }

    const customer = await prisma.posCustomer.findFirst({
      where: { id: BigInt(result.customerId), isDeleted: false },
    });
    if (!customer) {
      return notFound("We Couldn't Verify That Code.");
    }

    setSessionCustomerId(customer.id.toString());

    return ok({ id: customer.id.toString(), name: customer.name });
  } catch (err) {
    return handleApiError(err);
  }
}
