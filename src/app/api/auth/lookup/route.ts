import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, handleApiError } from "@/lib/api-response";
import { generateOtpCode, setPendingOtp, OTP_TTL_SECONDS } from "@/lib/otp";
import { sendWhatsAppOtp, WhatsAppConfigError, WhatsAppSendError } from "@/lib/whatsapp";
import { setSessionCustomerId } from "@/lib/session";

const lookupSchema = z.object({
  // Email address OR National/Iqama ID number (pos_customer.email /
  // pos_customer.id_card_number) — whichever the customer has on file.
  identifier: z.string().min(3).max(255),
  mobile: z.string().min(5).max(255),
});

// Saudi mobile numbers are 9 digits after stripping any leading 0 or
// country code (966 / +966). The same customer's number can be stored in
// the database in any of several equivalent forms — "0536715037",
// "536715037", "966536715037", "+966536715037" — depending on which
// system/branch originally entered it. Comparing on the last 9 digits
// instead of an exact string match means the login doesn't fail just
// because of formatting differences, as long as the number itself matches.
function last9Digits(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.slice(-9);
}

function maskWhatsapp(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.length > 4 ? `••••${digits.slice(-4)}` : "••••";
}

// POST /api/auth/lookup
//
// Step 1 of login — a two-factor lookup against pos_customer:
//   1. Find the customer whose EMAIL or ID CARD NUMBER matches the
//      submitted identifier.
//   2. Confirm the submitted number belongs to that SAME customer record
//      (not just any customer in the table). Which number depends on the
//      Company setting `whatsapp_integration_enabled`:
//        ON  -> the customer's WhatsApp number (pos_customer.whatsapp_number)
//        OFF -> the customer's mobile number (pos_customer.mobile)
//
// What happens next depends on the same setting:
//   - ON (the normal case): generate a 6-digit code, store it (signed,
//     short-lived) against that customer id, and send it via WhatsApp.
//     The session only starts once that code is verified — see
//     /api/auth/verify-otp. Response: { otpRequired: true, whatsappMasked }.
//   - OFF: WhatsApp sign-in is intentionally disabled company-wide, so
//     login completes right here on the Step 1/2 match alone (the same
//     behavior the portal had before WhatsApp OTP was added) rather than
//     blocking customers from signing in at all. Response:
//     { otpRequired: false, id, name }.
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Request body must be valid JSON.");
    }
    const { identifier, mobile } = lookupSchema.parse(body);

    const trimmedIdentifier = identifier.trim();
    const suffix = last9Digits(mobile);

    if (suffix.length < 9) {
      return badRequest("Please Enter A Valid Mobile Number.");
    }

    // Is WhatsApp sign-in switched on? Decided first because it also decides
    // WHICH phone number the customer must enter:
    //   - ON:  the customer's WhatsApp number (the code is sent there)
    //   - OFF: the customer's mobile number (no code; login completes here)
    const company = await prisma.company.findFirst({ where: { isDeleted: false } });
    const whatsappOn = company?.whatsappIntegrationEnabled ?? false;

    // Step 1 — find the customer by email OR ID card number.
    const customer = await prisma.posCustomer.findFirst({
      where: {
        isDeleted: false,
        OR: [
          { email: { equals: trimmedIdentifier, mode: "insensitive" } },
          { idCardNumber: trimmedIdentifier },
        ],
      },
    });

    if (!customer) {
      return notFound("No Account Found For That Email Or ID Number.");
    }

    // Step 2 — the number entered must belong to THIS SAME customer record.
    const storedNumber = whatsappOn ? customer.whatsappNumber : customer.mobile;
    const storedSuffix = storedNumber ? last9Digits(storedNumber) : "";

    if (whatsappOn && storedSuffix.length < 9) {
      return badRequest("No WhatsApp Number Is On File For This Account. Please Contact Us.");
    }
    if (!storedSuffix || storedSuffix !== suffix) {
      return notFound(
        whatsappOn
          ? "WhatsApp Number Does Not Match Our Records For That Account."
          : "Mobile Number Does Not Match Our Records For That Account."
      );
    }

    if (!whatsappOn) {
      setSessionCustomerId(customer.id.toString());
      return ok({ otpRequired: false, id: customer.id.toString(), name: customer.name });
    }

    // Verified above: WhatsApp is on and this number matched the customer.
    const whatsappNumber = customer.whatsappNumber ?? "";
    const code = generateOtpCode();

    try {
      await sendWhatsAppOtp(whatsappNumber, code);
    } catch (err) {
      if (err instanceof WhatsAppConfigError) {
        console.error("[auth/lookup] WhatsApp not configured:", err.message);
        return badRequest("WhatsApp Sign-In Isn't Set Up Yet. Please Contact Support.");
      }
      if (err instanceof WhatsAppSendError) {
        return badRequest(err.message);
      }
      throw err;
    }

    setPendingOtp(customer.id.toString(), code);

    return ok({
      otpRequired: true,
      whatsappMasked: maskWhatsapp(whatsappNumber),
      expiresInSeconds: OTP_TTL_SECONDS,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
