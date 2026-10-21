import { prisma } from "@/lib/prisma";
import { getSessionCustomerId } from "@/lib/session";
import SchemeCard from "@/components/SchemeCard";
import EmptyState from "@/components/EmptyState";
import { formatCurrency, formatDate, nextInstallmentDueDate, currencySign } from "@/lib/format";
import { deriveSchemeStatus } from "@/lib/scheme-status";

export const dynamic = "force-dynamic";

type ActivityKind = "scheme" | "retail" | "ojp" | "salesOrder" | "advance";

type ActivityItem = {
  id: string;
  kind: ActivityKind;
  date: Date;
  title: string;
  subtitle: string | null;
  amount: number | null;
  currencyCode: string | null;
};

const ACTIVITY_ICON_STYLES: Record<ActivityKind, string> = {
  scheme: "bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 dark:bg-surface-raised dark:text-brand-300 dark:ring-brand-800/40",
  retail: "bg-gold-50 text-gold-600 ring-1 ring-inset ring-gold-100 dark:bg-gold-700/20 dark:text-gold-300 dark:ring-gold-600/30",
  ojp: "bg-teal-50 text-teal-600 ring-1 ring-inset ring-teal-100 dark:bg-teal-900/20 dark:text-teal-300 dark:ring-teal-800/30",
  salesOrder: "bg-sky-50 text-sky-600 ring-1 ring-inset ring-sky-100 dark:bg-sky-900/20 dark:text-sky-300 dark:ring-sky-800/30",
  advance: "bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100 dark:bg-rose-900/20 dark:text-rose-300 dark:ring-rose-800/30",
};

export default async function OverviewPage() {
  const customerId = BigInt(getSessionCustomerId()!);

  const [customer, registrations, recentReceipts, recentInvoices, recentOjp, recentSalesOrders, recentAdvanceReceipts] = await Promise.all([
    prisma.posCustomer.findFirstOrThrow({
      where: { id: customerId },
      include: { branch: { include: { currency: true } } },
    }),
    prisma.schemeCustomerRegistration.findMany({
      where: { customerId, isDeleted: false },
      include: { scheme: true, branch: { include: { currency: true } } },
      orderBy: { registrationDate: "desc" },
    }),
    prisma.schemeReceipt.findMany({
      where: { customerId, isDeleted: false },
      include: { lineItems: true, branch: { include: { currency: true } } },
      orderBy: { voucherDate: "desc" },
      take: 8,
    }),
    prisma.posInvoice.findMany({
      where: { posCustomerId: customerId, isDeleted: false },
      include: { branch: { include: { currency: true } } },
      orderBy: { invoiceDate: "desc" },
      take: 8,
    }),
    prisma.oldJewelleryPurchase.findMany({
      where: { posCustomerId: customerId, isDeleted: false },
      include: { branch: { include: { currency: true } } },
      orderBy: { voucherDate: "desc" },
      take: 8,
    }),
    prisma.retailSalesOrder.findMany({
      where: { customerId, isDeleted: false },
      include: { branch: { include: { currency: true } } },
      orderBy: { voucherDate: "desc" },
      take: 8,
    }),
    prisma.advanceReceipt.findMany({
      where: { posCustomerId: customerId, isDeleted: false },
      include: { branch: { include: { currency: true } } },
      orderBy: { receiptDate: "desc" },
      take: 8,
    }),
  ]);

  // "Total paid in" sums across every registration, which could in theory
  // span more than one branch/currency. We label it with the customer's
  // home branch currency (the common case for a single-store customer) —
  // if TORCAP customers routinely transact across branches with different
  // currencies, this aggregate should instead be broken out per currency.
  const homeCurrencyCode = customer.branch?.currency?.code ?? null;
  const homeCurrencySign = currencySign(customer.branch?.currency);

  const totalPaidIn = registrations.reduce((sum, r) => sum + (r.totalPaidAmount ?? 0), 0);
  const activeSchemes = registrations.filter((r) => deriveSchemeStatus(r) === "ACTIVE");
  const readyToRedeem = registrations.filter((r) => deriveSchemeStatus(r) === "MATURED");

  const nextInstallments = activeSchemes
    .map((r) => ({
      registration: r,
      due: nextInstallmentDueDate(r.firstInstallmentDate, r.noOfInstallmentsPaid, r.scheme.noOfInstallments),
    }))
    .filter((x): x is { registration: (typeof activeSchemes)[number]; due: Date } => x.due !== null)
    .sort((a, b) => a.due.getTime() - b.due.getTime());

  const nextInstallment = nextInstallments[0];
  const nextInstallmentCurrency = nextInstallment?.registration.branch?.currency?.code ?? null;
  const nextInstallmentSign = currencySign(nextInstallment?.registration.branch?.currency);

  // Recent Activity merges all five transaction sources — Scheme
  // installments, Retail Sale invoices, Old Gold Sale vouchers, Sales
  // Orders, and Advance Receipts — into one feed sorted by date, rather
  // than five separate lists. Each source is fetched with its own small
  // `take` limit above so the merge still has enough recent items from
  // every source to sort correctly, then the combined result is trimmed
  // to the final display count below.
  const activity: ActivityItem[] = [
    ...recentReceipts.map((r): ActivityItem => ({
      id: `scheme-${r.id}`,
      kind: "scheme",
      date: r.voucherDate,
      title: `Receipt ${r.voucherNo}`,
      subtitle: "Scheme Installment",
      amount: r.amount,
      currencyCode: r.branch?.currency?.code ?? null,
    })),
    ...recentInvoices.map((inv): ActivityItem => ({
      id: `retail-${inv.id}`,
      kind: "retail",
      date: inv.invoiceDate ?? inv.createdDate ?? new Date(0),
      title: `Invoice ${inv.invoiceNumber ?? "—"}`,
      subtitle: "Retail Sale - Gold Purchase",
      amount: inv.grandTotal ?? inv.netAmount,
      currencyCode: inv.branch?.currency?.code ?? null,
    })),
    ...recentOjp.map((p): ActivityItem => ({
      id: `ojp-${p.id}`,
      kind: "ojp",
      date: p.voucherDate ?? p.createdDate ?? new Date(0),
      title: `OJP ${p.voucherNumber ?? "—"}`,
      subtitle: "Old Gold Sale",
      amount: p.grandTotal ?? p.paidAmount,
      currencyCode: p.branch?.currency?.code ?? null,
    })),
    ...recentSalesOrders.map((o): ActivityItem => ({
      id: `salesOrder-${o.id}`,
      kind: "salesOrder",
      date: o.voucherDate ?? o.createdDate ?? new Date(0),
      title: `Order ${o.voucherNumber ?? "—"}`,
      subtitle: "Sales Order",
      amount: o.totalAmountPaid,
      currencyCode: o.branch?.currency?.code ?? null,
    })),
    ...recentAdvanceReceipts.map((r): ActivityItem => ({
      id: `advance-${r.id}`,
      kind: "advance",
      date: r.receiptDate ?? r.createdDate ?? new Date(0),
      title: `Receipt ${r.receiptNumber ?? "—"}`,
      subtitle: "Advance Receipt",
      amount: r.amount,
      currencyCode: r.branch?.currency?.code ?? null,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-ink-100">
          Welcome Back, {customer.name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">
          Here&apos;s Where Things Stand Across Your Schemes And Recent Visits To The Store.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Total Paid In"
          value={formatCurrency(totalPaidIn, homeCurrencyCode)}
          sub="Across All Schemes"
          tone="brand"
          badgeText={homeCurrencySign}
          icon={
            <path
              d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          }
        />
        <StatCard
          label="Active Schemes"
          value={String(activeSchemes.length)}
          sub="Currently Running"
          tone="amber"
          icon={
            <>
              <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
              <path d="M12 7.5v5l3.5 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </>
          }
        />
        <StatCard
          label="Next Installment"
          value={
            nextInstallment
              ? formatCurrency(nextInstallment.registration.scheme.installmentAmount, nextInstallmentCurrency)
              : "—"
          }
          sub={nextInstallment ? `Due ${formatDate(nextInstallment.due)}` : "No Upcoming Due Date"}
          tone="teal"
          badgeText={nextInstallmentSign}
          icon={
            <>
              <rect x="3.5" y="5" width="17" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" />
              <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </>
          }
        />
        <StatCard
          label="Ready To Redeem"
          value={String(readyToRedeem.length)}
          sub="Scheme(s) Awaiting Pickup"
          tone="purple"
          icon={
            <path
              d="M12 3l2.2 4.8L19.5 9l-3.7 3.6.9 5.4-4.7-2.5-4.7 2.5.9-5.4L4.5 9l5.3-1.2L12 3z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          }
        />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-ink-100">Active Schemes</h2>
          <a href="/schemes" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
            View All →
          </a>
        </div>
        {activeSchemes.length === 0 ? (
          <EmptyState
            message="You Don't Have Any Active Schemes Yet."
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
                <path d="M12 7.5v5l3.5 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {activeSchemes.slice(0, 4).map((registration) => (
              <SchemeCard key={registration.id.toString()} registration={registration} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-ink-100">Recent Activity</h2>
          <a href="/transactions" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
            View All →
          </a>
        </div>
        {activity.length === 0 ? (
          <EmptyState
            message="No Transactions Yet."
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M3 12h4l3-8 4 16 3-8h4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-ink-100 dark:border-surface-border">
            {activity.map((item, idx) => (
              <div
                key={item.id}
                className={`group flex items-center justify-between px-4 py-3 transition hover:bg-brand-50/40 dark:hover:bg-surface ${
                  idx !== activity.length - 1 ? "border-b border-ink-100 dark:border-surface-border" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-transform group-hover:scale-105 ${ACTIVITY_ICON_STYLES[item.kind]}`}
                  >
                    <ActivityIcon kind={item.kind} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink-900 dark:text-ink-100">{item.title}</p>
                    <p className="text-xs text-ink-500 dark:text-ink-300">
                      {formatDate(item.date)}
                      {item.subtitle ? ` · ${item.subtitle}` : ""}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                  {formatCurrency(item.amount, item.currencyCode)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ActivityIcon({ kind }: { kind: ActivityKind }) {
  if (kind === "retail") {
    // Shopping bag — a retail purchase
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M6 8h12l-.9 11.1a2 2 0 01-2 1.9H8.9a2 2 0 01-2-1.9L6 8z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M9 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "ojp") {
    // Coin — buying gold back is a cash/coin exchange
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M9.3 9.3c0-1 1.1-1.7 2.7-1.7s2.7.7 2.7 1.7-1.1 1.5-2.7 1.5-2.7.6-2.7 1.6 1.1 1.7 2.7 1.7 2.7-.6 2.7-1.7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path d="M12 6.3v1.3M12 16.4v1.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "salesOrder") {
    // Order document with a checklist
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M7 3h10l1 3v14a1 1 0 01-1 1H7a1 1 0 01-1-1V6l1-3z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M9 3v3h6V3M9 11l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === "advance") {
    // Wallet/receipt — an advance payment received
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3.5" y="6" width="17" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3.5 10h17" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="16.5" cy="14" r="1.4" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  // Scheme — a confirmed installment payment
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8.2 12.3l2.6 2.6 5-5.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  tone,
  badgeText,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  tone: "brand" | "amber" | "teal" | "purple";
  /** When set (e.g. a resolved branch currency code like "SAR"), shown as
   * text in the badge instead of the icon — falls back to the icon if this
   * is null/undefined (no currency could be resolved for that stat). */
  badgeText?: string;
}) {
  const toneStyles: Record<typeof tone, string> = {
    brand: "bg-brand-50 text-brand-600 dark:bg-brand-800/30 dark:text-brand-300",
    amber: "bg-gold-50 text-gold-600 dark:bg-gold-700/20 dark:text-gold-300",
    teal: "bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-300",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300",
  };
  return (
    <div className="group rounded-2xl border border-ink-100 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-md dark:border-surface-border dark:bg-surface-raised">
      <span className={`flex h-9 w-9 items-center justify-center rounded-full transition-transform group-hover:scale-105 ${toneStyles[tone]}`}>
        {badgeText ? (
          <span className={badgeText.length <= 2 ? "text-base font-bold leading-none" : "text-[10px] font-bold tracking-tight"}>
            {badgeText}
          </span>
        ) : (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
            {icon}
          </svg>
        )}
      </span>
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-ink-300 dark:text-ink-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-ink-900 dark:text-ink-100">{value}</p>
      <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-300">{sub}</p>
    </div>
  );
}
