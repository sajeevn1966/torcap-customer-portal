import "server-only";
import { createHash, createHmac, randomInt } from "crypto";
import { cookies } from "next/headers";

const PENDING_COOKIE = "torcap_pending_otp";
export const OTP_TTL_SECONDS = 5 * 60; // 5 minutes
const MAX_ATTEMPTS = 5;

/**
 * Signs the pending-OTP cookie so a customer can't just edit the cookie in
 * their browser's dev tools to swap in a different customerId and skip
 * straight past the code check. This is HMAC integrity only (the payload
 * itself isn't secret — it holds no more than a customer id, a hash of the
 * code, and a few counters), not full session security; see session.ts for
 * the same caveat on the main session cookie.
 */
function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Add a long random value for it in your .env file " +
        "(used to sign the temporary WhatsApp-OTP cookie)."
    );
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

type PendingOtp = {
  customerId: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
};

export function generateOtpCode(): string {
  // 6-digit numeric code, zero-padded.
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function setPendingOtp(customerId: string, code: string) {
  const payload: PendingOtp = {
    customerId,
    codeHash: hashCode(code),
    expiresAt: Date.now() + OTP_TTL_SECONDS * 1000,
    attempts: 0,
  };
  const json = JSON.stringify(payload);
  const signature = sign(json);
  const value = Buffer.from(json).toString("base64url") + "." + signature;

  cookies().set(PENDING_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: OTP_TTL_SECONDS,
  });
}

export function clearPendingOtp() {
  cookies().delete(PENDING_COOKIE);
}

function readPendingOtp(): PendingOtp | null {
  const raw = cookies().get(PENDING_COOKIE)?.value;
  if (!raw) return null;

  const [encoded, signature] = raw.split(".");
  if (!encoded || !signature) return null;

  let json: string;
  try {
    json = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }

  if (sign(json) !== signature) return null;

  try {
    const payload = JSON.parse(json) as PendingOtp;
    if (Date.now() > payload.expiresAt) return null;
    return payload;
  } catch {
    return null;
  }
}

export type VerifyOtpResult =
  | { ok: true; customerId: string }
  | { ok: false; reason: "no-pending-code" | "expired" | "too-many-attempts" | "incorrect-code" };

/**
 * Verifies a submitted code against the pending cookie set by
 * setPendingOtp(). On a wrong code, bumps the attempt counter (re-signed)
 * so a customer can't brute-force indefinitely; after MAX_ATTEMPTS wrong
 * tries the pending code is invalidated and they must request a new one.
 */
export function verifyPendingOtp(submittedCode: string): VerifyOtpResult {
  const pending = readPendingOtp();
  if (!pending) return { ok: false, reason: "no-pending-code" };

  if (pending.attempts >= MAX_ATTEMPTS) {
    clearPendingOtp();
    return { ok: false, reason: "too-many-attempts" };
  }

  if (hashCode(submittedCode.trim()) === pending.codeHash) {
    clearPendingOtp();
    return { ok: true, customerId: pending.customerId };
  }

  // Wrong code — persist the incremented attempt count and keep the same
  // expiry so the customer can still try again within the original window.
  const updated: PendingOtp = { ...pending, attempts: pending.attempts + 1 };
  const json = JSON.stringify(updated);
  const value = Buffer.from(json).toString("base64url") + "." + sign(json);
  cookies().set(PENDING_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.max(1, Math.floor((pending.expiresAt - Date.now()) / 1000)),
  });

  return { ok: false, reason: "incorrect-code" };
}
