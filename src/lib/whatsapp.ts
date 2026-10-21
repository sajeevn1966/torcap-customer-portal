import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Sends WhatsApp OTP messages using the SAME credentials TORCAP's main ERP
 * already uses (table `company`, columns `whatsapp_*`) — confirmed via
 * `\d company` against the live DB, 2026-10-15. Nothing is hardcoded or
 * duplicated into a .env file: provider URL, username, password, sender
 * number, priority and timeout all come from that single-row settings
 * table, so this always matches whatever TORCAP itself is configured to
 * use (currently saudialert.com's "CONNECTIFY" WhatsApp gateway).
 *
 * The provider's Template Messages API is what this calls — a template
 * message, not a plain chat message, because it can be delivered at any
 * time rather than only inside an existing 24-hour WhatsApp conversation
 * window. See: https://saudialert.com/documentation/whatsapp/
 * whatsapp_api_documentation.php ("WhatsApp Template Messages API").
 *
 * The one thing `company` does NOT have a column for is a *login* OTP
 * template name (it only has whatsapp_pos_invoice_template and
 * whatsapp_scheme_receipt_template, for different purposes). Until you
 * tell me what template TORCAP already uses for its scheme-action OTPs
 * (scheme_registration_otp_required etc.), this falls back to the
 * WHATSAPP_OTP_TEMPLATE_NAME env var (default "otp", matching the
 * provider's own documentation example) — see .env.example.
 */

export class WhatsAppConfigError extends Error {}
export class WhatsAppSendError extends Error {}

/**
 * Saudi mobile numbers need a 966 country code with no leading 0 or +
 * for this API. Accepts any of the common stored forms:
 *   "0501234567" / "501234567" / "966501234567" / "+966501234567"
 */
function toSaudiInternational(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return null;

  if (digits.startsWith("966") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `966${digits.slice(1)}`;
  if (digits.length === 9) return `966${digits}`;

  // Already looks like a full international number in some other shape —
  // pass it through as-is rather than guessing further.
  return digits;
}

type SendResult = { trackId?: string; messageId?: string };

export async function sendWhatsAppOtp(whatsappNumber: string, code: string): Promise<SendResult> {
  const company = await prisma.company.findFirst({ where: { isDeleted: false } });

  if (!company) {
    throw new WhatsAppConfigError("Company settings record not found.");
  }
  if (!company.whatsappIntegrationEnabled) {
    throw new WhatsAppConfigError("WhatsApp integration is turned off in Company settings.");
  }
  if (!company.whatsappApiUrl || !company.whatsappUsername || !company.whatsappApiPassword || !company.whatsappSender) {
    throw new WhatsAppConfigError(
      "WhatsApp credentials are incomplete in Company settings (whatsapp_api_url / " +
        "whatsapp_username / whatsapp_api_password / whatsapp_sender)."
    );
  }

  const to = toSaudiInternational(whatsappNumber);
  if (!to) {
    throw new WhatsAppSendError("This account has no usable WhatsApp number on file.");
  }

  const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME || "otp";
  const timeoutMs = (company.whatsappTimeoutSeconds ?? 10) * 1000;

  const params = new URLSearchParams({
    username: company.whatsappUsername,
    api_password: company.whatsappApiPassword,
    jsonapi: "1",
    priority: company.whatsappPriority ?? "21",
    sender: company.whatsappSender,
    to,
    name: templateName,
    value1: code,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${company.whatsappApiUrl}?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new WhatsAppSendError("The WhatsApp Service Took Too Long To Respond. Please Try Again.");
    }
    throw new WhatsAppSendError("Could Not Reach The WhatsApp Service. Please Try Again.");
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new WhatsAppSendError(`WhatsApp Service Returned An Unexpected Response: ${text.slice(0, 200)}`);
  }

  const body = parsed as { status?: string; description?: unknown };
  if (body.status !== "success") {
    const message =
      typeof body.description === "string"
        ? body.description
        : "We Couldn't Send The WhatsApp Code. Please Try Again.";
    throw new WhatsAppSendError(message);
  }

  const description = body.description as { trackid?: string; msg?: { msgid?: string }[] } | undefined;
  return {
    trackId: description?.trackid,
    messageId: description?.msg?.[0]?.msgid,
  };
}
