export type SchemeLifecycleStatus = "ACTIVE" | "MATURED" | "REDEEMED" | "CANCELLED";

type RegistrationForStatus = {
  status: string;
  isCancelled?: boolean | null;
  redeemedOn?: Date | string | null;
  noOfInstallmentsPaid?: number | null;
  finalInstallmentDueDate?: Date | string | null;
  scheme: { noOfInstallments: number };
};

/**
 * The `scheme_customer_registration.status` column is meant to track a
 * registration's lifecycle (ACTIVE / MATURED / REDEEMED / CANCELLED), but in
 * practice it isn't always updated the moment the last installment clears —
 * a registration can sit at "ACTIVE" in the database indefinitely even after
 * every installment has been paid. Rather than surface that stale value
 * directly, this derives the real state from the underlying facts:
 *
 *   - cancelled (isCancelled, or status already says so) wins outright
 *   - redeemed (redeemedOn is set, or status already says so) wins next
 *   - MATURED / ready to redeem requires BOTH:
 *       (a) fully paid (installmentsPaid >= scheme's total installments), AND
 *       (b) today's date has reached final_installment_due_date
 *     Being fully paid alone isn't enough — a customer who pays off a
 *     12-month scheme in 8 months hasn't reached maturity yet; the scheme
 *     still matures on its actual final due date. If final_installment_due_date
 *     isn't set on the record, this falls back to treating "fully paid" alone
 *     as sufficient, since there's no due date left to wait on.
 *   - otherwise it's still ACTIVE
 *
 * Every page that classifies or counts registrations by lifecycle state
 * (Overview's stat tiles, My Schemes badges, Notifications) should use this
 * instead of reading `registration.status` directly.
 */
export function deriveSchemeStatus(r: RegistrationForStatus): SchemeLifecycleStatus {
  if (r.isCancelled || r.status === "CANCELLED") return "CANCELLED";
  if (r.redeemedOn || r.status === "REDEEMED") return "REDEEMED";

  const paid = r.noOfInstallmentsPaid ?? 0;
  const total = r.scheme.noOfInstallments;
  const fullyPaid = paid >= total;

  const finalDue = r.finalInstallmentDueDate ? new Date(r.finalInstallmentDueDate) : null;
  const validFinalDue = finalDue && !Number.isNaN(finalDue.getTime()) ? finalDue : null;
  const reachedFinalDue = validFinalDue ? Date.now() >= validFinalDue.getTime() : true;

  if (r.status === "MATURED" || (fullyPaid && reachedFinalDue)) return "MATURED";

  return "ACTIVE";
}
