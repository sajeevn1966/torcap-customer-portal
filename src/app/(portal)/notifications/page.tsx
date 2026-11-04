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
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 p-6 text-white shadow-card sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-gold-400/20" />
        <div className="relative">
          <h1 className="font-display text-3xl font-semibold">Notifications</h1>
          <p className="mt-1 text-sm text-white/80">Reminders And Maturity Alerts Tied To Your Account.</p>
        </div>
        <dl className="relative mt-6 grid grid-cols-3 gap-3">
          {[
            ["Overdue", notices.filter((n) => n.kind === "overdue").length],
            ["Due Soon", notices.filter((n) => n.kind === "due").length],
            ["Ready To Redeem", notices.filter((n) => n.kind === "matured").length],
          ].map(([label, n]) => (
            <div key={String(label)} className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-white/70">{label}</dt>
              <dd className="mt-1 text-2xl font-semibold">{n}</dd>
            </div>
          ))}
        </dl>
      </section>

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
        <div className="space-y-3">
          {notices.map((n) => {
            const tone =
              n.kind === "matured"
                ? { bar: "border-l-brand-500", icon: "bg-brand-100 text-brand-700 dark:bg-brand-800/40 dark:text-brand-300", chip: "bg-brand-50 text-brand-700 dark:bg-brand-800/30 dark:text-brand-300", label: "Ready To Redeem" }
                : n.kind === "overdue"
                  ? { bar: "border-l-red-500", icon: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300", chip: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300", label: "Overdue" }
                  : { bar: "border-l-gold-400", icon: "bg-gold-50 text-gold-600 dark:bg-gold-700/30 dark:text-gold-300", chip: "bg-gold-50 text-gold-700 dark:bg-gold-700/30 dark:text-gold-300", label: "Due Soon" };
            return (
              <div
                key={n.id}
                className={`flex items-start gap-4 rounded-2xl border border-l-4 border-ink-100 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg dark:border-surface-border dark:bg-surface-raised ${tone.bar}`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone.icon}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    {n.kind === "matured" ? (
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    ) : (
                      <>
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </>
                    )}
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">{n.title}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tone.chip}`}>{tone.label}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">{n.detail}</p>
                  {n.date && <p className="mt-2 text-xs font-medium text-ink-300 dark:text-ink-500">Due {formatDate(n.date)}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
