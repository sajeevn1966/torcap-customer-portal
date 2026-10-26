import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

// New cookie name on purpose: any old, unsigned "torcap_customer_id" cookie
// left in a browser from development is simply ignored (not trusted).
const SESSION_COOKIE = "torcap_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

/**
 * Signed session cookie.
 *
 * The cookie value is `<customerId>.<expiresAtMs>.<hmac>`. The HMAC is
 * computed with SESSION_SECRET, so a visitor cannot edit the customer id
 * in their browser to open someone else's account — a tampered or expired
 * cookie is rejected and treated as "not logged in".
 *
 * This is still a simple stateless session (no server-side revocation list):
 * logging out clears the cookie in that browser, and every session expires
 * on its own after 8 hours. Rotating SESSION_SECRET logs everyone out.
 */
function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or too short. Set it to a random value of at least 32 characters in your .env file."
    );
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function setSessionCustomerId(customerId: string) {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = `${customerId}.${expiresAt}`;
  cookies().set(SESSION_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === "true" : process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function getSessionCustomerId(): string | null {
  const raw = cookies().get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [customerId, expiresAtStr, signature] = parts;

  if (!/^\d+$/.test(customerId) || !/^\d+$/.test(expiresAtStr)) return null;

  const expected = sign(`${customerId}.${expiresAtStr}`);
  const a = Buffer.from(signature, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  if (Date.now() > Number(expiresAtStr)) return null;

  return customerId;
}

export function clearSession() {
  cookies().delete(SESSION_COOKIE);
}
