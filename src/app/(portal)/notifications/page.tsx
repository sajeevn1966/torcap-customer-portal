import { prisma } from "@/lib/prisma";
import { getSessionCustomerId } from "@/lib/session";
import { formatCurrency, formatDate, daysUntil, nextInstallmentDueDate } from "@/lib/format";
import { deriveSchemeStatus } from "@/lib/scheme-status";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

type Notice = {
  id: string;
  kind: "due" | "matured" | "overdue";
  title: string;
  detail: string;
  date: Date | null;
};

export default async function NotificationsPage() {
  const customerId = BigInt(getSessionCustomerId()!);

  const registrations = await prisma.schemeCustomerRegistration.findMany({
    where: { customerId, isDeleted: false },
    include: { scheme: true, branch: { include: { currency: true } } },
  });

  // These notifications are computed from real registration data (status,
  // firstInstallmentDate, noOfInstallmentsPaid) rather than read from a
  // dedicated notifications table — the six Scheme-module tables in the
  // provided dump don't include one. If TORCAP has a separate notifications
  // table elsewhere in the full database, point this page at it instead.
  const notices: Notice[] = [];

  for (const r of registrations) {
    const lifecycleStatus = deriveSchemeStatus(r);

    if (lifecycleStatus === "MATURED") {
      notices.push({
        id: `matured-${r.id}`,
        kind: "matured",
        title: "Scheme Ready For Redemption",
        detail: `${r.scheme.name} Has Matured. Visit The Store To Redeem Against Any Purchase.`,
        date: null,
      });
      continue;
    }

    if (lifecycleStatus !== "ACTIVE" || !r.firstInstallmentDate) continue;

    const nextDue = nextInstallmentDueDate(r.firstInstallmentDate, r.noOfInstallmentsPaid, r.scheme.noOfInstallments);
    if (!nextDue) continue;

    const days = daysUntil(nextDue);
    if (days === null) continue;

    const currencyCode = r.branch?.currency?.code;

    if (days < 0) {
      notices.push({
        id: `overdue-${r.id}`,
        kind: "overdue",
        title: "Installment Overdue",
        detail: `Your ${formatCurrency(r.scheme.installmentAmount, currencyCode)} Installment For ${r.scheme.name} Was Due On ${formatDate(nextDue)}.`,
        date: nextDue,
      });
    } else if (days <= 14) {
      notices.push({
        id: `due-${r.id}`,
        kind: "due",
        title: `Installment Due In ${days} Day${days === 1 ? "" : "s"}`,
        detail: `Your ${formatCurrency(r.scheme.installmentAmount, currencyCode)} Installment For ${r.scheme.name} Is Due On ${formatDate(nextDue)}.`,
        date: nextDue,
      });
    }
  }

  notices.sort((a, b) => (a.date && b.date ? a.date.getTime() - b.date.getTime() : 0));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-ink-100">Notifications</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">
          Reminders And Maturity Alerts Tied To Your Account.
        </p>
      </div>

      {notices.length === 0 ? (
        <EmptyState
          message="You're All Caught Up — No Reminders Right Now."
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink-100 dark:border-surface-border">
          {notices.map((n, idx) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 px-5 py-4 transition hover:bg-brand-50/40 dark:hover:bg-surface ${
                idx !== notices.length - 1 ? "border-b border-ink-100 dark:border-surface-border" : ""
              }`}
            >
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  n.kind === "matured"
                    ? "bg-brand-100 text-brand-700 dark:bg-brand-800/40 dark:text-brand-300"
                    : n.kind === "overdue"
                      ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300"
                      : "bg-gold-50 text-gold-600 dark:bg-gold-700/30 dark:text-gold-300"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  {n.kind === "matured" ? (
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : (
                    <>
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
                      <path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </>
                  )}
                </svg>
              </span>
              <div>
                <p className="text-sm font-medium text-ink-900 dark:text-ink-100">{n.title}</p>
                <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-300">{n.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
