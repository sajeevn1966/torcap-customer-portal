/**
 * A currency SIGN (₹, $, ⃁, etc.) — as opposed to `formatCurrency`'s use of
 * the currency CODE (SAR, AED) — for compact places like an icon badge
 * where a full code doesn't fit or reads worse than a symbol.
 *
 * Resolution order:
 *   1. `currency.symbol` from the database — this is the business's own
 *      configured symbol and should win if they've set one.
 *   2. For SAR specifically, the official Unicode Saudi Riyal sign
 *      (U+20C1) — approved Feb 2025, encoded in Unicode 17.0 (Sept 2025).
 *      NOTE: font support for this brand-new code point is still rolling
 *      out industry-wide as of this writing; on a system whose fonts
 *      (including this app's Manrope) don't yet include the glyph, it can
 *      render as a blank/missing-glyph box instead of the actual symbol.
 *      If that happens, populate `currency.symbol` in the database with
 *      whatever renders correctly for you instead of relying on this
 *      fallback.
 *   3. The currency code itself (e.g. "SAR") — always renders correctly,
 *      the safe fallback when nothing else is available.
 */
export function currencySign(currency?: { code?: string | null; symbol?: string | null } | null): string | undefined {
  if (!currency) return undefined;
  const symbol = currency.symbol?.trim();
  if (symbol) return symbol;
  if (currency.code === "SAR") return "\u20C1";
  return currency.code ?? undefined;
}

/**
 * No currency is hardcoded here on purpose — every branch in the database
 * has its own currency (branch.currency_id -> currency.code, e.g. "SAR",
 * "AED", "USD"), so the caller must resolve and pass the actual code for
 * whichever branch the amount belongs to. Passing `null`/`undefined` renders
 * the number with no currency label rather than silently guessing one.
 */
export function formatCurrency(value: number | null | undefined, currencyCode?: string | null) {
  const amount = (value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
  return currencyCode ? `${currencyCode} ${amount}` : amount;
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function formatWeight(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} g`;
}

export function formatPieces(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  const n = Math.round(value);
  return `${n} pc${n === 1 ? "" : "s"}`;
}

export function daysUntil(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return null;
  const ms = d.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/**
 * The scheme_customer_registration table stores when the FIRST installment
 * was PAID and how many have been paid since — not a literal "next due
 * date" column. `firstInstallmentDate` is the date of installment #1's
 * payment, not a pre-scheme start date, so:
 *   - installment #1's due date IS firstInstallmentDate
 *   - installment #2 is due 1 month after that
 *   - installment #(paid+1) — the next unpaid one — is due `paid` months
 *     after firstInstallmentDate
 * (finalInstallmentDueDate is a different thing — the date the whole
 * scheme closes — and shouldn't be used as a stand-in for this.)
 *
 * `totalInstallments` is required so this can return null once every
 * installment is already paid — otherwise it keeps projecting a "next"
 * date past the end of the plan (e.g. a 12/12 fully-paid scheme would
 * otherwise show a bogus 13th installment due a month later). A
 * registration's `status` column isn't relied on for this, since a
 * fully-paid registration can still be sitting at status "ACTIVE" in the
 * source data until someone manually closes it out.
 */
export function nextInstallmentDueDate(
  firstInstallmentDate: Date | string | null | undefined,
  installmentsPaid: number | null | undefined,
  totalInstallments: number
): Date | null {
  const paid = installmentsPaid ?? 0;
  if (paid >= totalInstallments) return null;
  if (!firstInstallmentDate) return null;
  const base = typeof firstInstallmentDate === "string" ? new Date(firstInstallmentDate) : firstInstallmentDate;
  if (Number.isNaN(base.getTime())) return null;
  const next = new Date(base);
  next.setMonth(next.getMonth() + paid);
  return next;
}
