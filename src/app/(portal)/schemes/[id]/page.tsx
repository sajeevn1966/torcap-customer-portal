import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionCustomerId } from "@/lib/session";
import { formatCurrency, formatDate } from "@/lib/format";
import { deriveSchemeStatus } from "@/lib/scheme-status";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function SchemeDetailPage({ params }: { params: { id: string } }) {
  if (!/^\d+$/.test(params.id)) notFound();
  const customerId = BigInt(getSessionCustomerId()!);
  const registrationId = BigInt(params.id);

  const registration = await prisma.schemeCustomerRegistration.findFirst({
    where: { id: registrationId, customerId, isDeleted: false },
    include: {
      scheme: true,
      branch: { include: { currency: true } },
      lineItems: {
        where: { isDeleted: { not: true } },
        include: {
          receipt: { include: { branch: { include: { currency: true } }, paymentDetails: true } },
        },
      },
    },
  });

  if (!registration) notFound();

  const paid = registration.noOfInstallmentsPaid ?? 0;
  const total = registration.scheme.noOfInstallments;
  const currencyCode = registration.branch?.currency?.code;
  // total_paid_amount and total_fixed_weight already include the opening figures.
  // Total Weight shown = fixed weight + bonus weight (matches the ERP receipt screen).
  // Extra Amount Paid = receipts paid above (monthly installment x installments paid), opening excluded.
  const extraPaid = Math.max(
    0,
    Math.round(((registration.totalPaidAmount ?? 0) - (registration.openingAmount ?? 0) - registration.scheme.installmentAmount * paid) * 100) / 100
  );
  const fmt3 = (v: number | null | undefined) =>
    v === null || v === undefined ? "" : v.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  const fmtMoney3 = (v: number | null | undefined, code?: string | null) =>
    `${code ? code + " " : ""}${(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`;
  // Blank (not 0.000) when there is nothing, like the ERP screen.
  const fmtNz = (v: number | null | undefined) => (v ? fmt3(v) : "");

  // Receipt mode names (a missing lookup table must not break the page).
  const modeIds = Array.from(
    new Set(registration.lineItems.flatMap((li) => li.receipt.paymentDetails.filter((d) => !d.isDeleted).map((d) => d.paymentModeId)))
  );
  const modes = modeIds.length
    ? await prisma.paymentMode.findMany({ where: { id: { in: modeIds } } }).catch(() => [])
    : [];
  const receiptMode = (li: (typeof registration.lineItems)[number]) =>
    Array.from(new Set(li.receipt.paymentDetails.filter((d) => !d.isDeleted).map((d) => modeLabel(d.paymentModeId)).filter(Boolean))).join(", ");
  const modeLabel = (id: bigint) => {
    const m = modes.find((x) => x.id === id);
    return m ? m.code || m.name || "" : "";
  };

  // Oldest first, with a running "Total Accumulated Weight" that starts from
  // the opening weight (total_fixed_weight already includes it).
  const rows = [...registration.lineItems]
    .sort(
      (a, b) =>
        a.receipt.voucherDate.getTime() - b.receipt.voucherDate.getTime() || Number(a.id - b.id)
    )
    .reduce<{ li: (typeof registration.lineItems)[number]; accumulated: number }[]>((acc, li) => {
      const prev = acc.length ? acc[acc.length - 1].accumulated : registration.openingWeight ?? 0;
      const add = (li.fixedMetalWeight ?? 0) + (li.bonusMetalWeight ?? 0) + (li.extraBonusWeight ?? 0);
      acc.push({ li, accumulated: prev + add });
      return acc;
    }, []);

  const fmtWeight = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${v.toFixed(3)} g`);
  const lifecycleStatus = deriveSchemeStatus(registration);
  const statusLabel = lifecycleStatus === "MATURED" ? "Ready To Redeem" : lifecycleStatus;

  // The stored totals already include the opening figures once a receipt exists;
  // before any receipt they can still be 0 while the opening values are set.
  const effPaid = Math.max(registration.totalPaidAmount ?? 0, registration.openingAmount ?? 0);
  const effFixedWeight = Math.max(registration.totalFixedWeight ?? 0, registration.openingWeight ?? 0);
  const totalWeight = effFixedWeight + (registration.bonusWeightFixed ?? 0);
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const sum = (f: (li: (typeof rows)[number]["li"]) => number | null | undefined) =>
    rows.reduce((t, r) => t + (f(r.li) ?? 0), 0);
  const statusStyle: Record<string, string> = {
    ACTIVE: "bg-white/20 text-white ring-1 ring-white/40",
    MATURED: "bg-gold-100 text-gold-700",
    REDEEMED: "bg-white/90 text-ink-700",
    CANCELLED: "bg-red-100 text-red-700",
  };
  const showRedeemed = lifecycleStatus === "REDEEMED" && registration.redeemedPosInvoiceId != null;

  return (
    <div className="space-y-6">
      <Link
        href="/schemes"
        className="inline-flex items-center gap-2 rounded-full border border-ink-100 bg-white px-4 py-1.5 text-sm font-medium text-brand-600 shadow-sm transition hover:-translate-x-0.5 hover:bg-brand-50 dark:border-surface-border dark:bg-surface-raised dark:text-brand-300 dark:hover:bg-brand-800/30"
      >
        <span aria-hidden>←</span> Back To My Schemes
      </Link>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 p-6 text-white shadow-card sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-gold-400/20" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
              Plan {registration.registrationNumber ?? registration.id.toString()}
            </p>
            <h1 className="font-display mt-1 text-3xl font-semibold">{registration.scheme.name}</h1>
          </div>
          <span className={`rounded-full px-3.5 py-1 text-xs font-semibold tracking-wide ${statusStyle[lifecycleStatus] ?? statusStyle.ACTIVE}`}>
            {statusLabel}
          </span>
        </div>

        <div className="relative mt-6">
          <div className="mb-2 flex items-end justify-between text-sm">
            <span className="font-medium">
              {paid} Of {total} Installments Paid
            </span>
            <span className="text-white/80">{Math.max(0, total - paid)} Remaining</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-gradient-to-r from-gold-200 to-gold-400 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <dl className="relative mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <HeroItem label="Monthly Installment" value={formatCurrency(registration.scheme.installmentAmount, currencyCode)} />
          <HeroItem label="Registration Date" value={formatDate(registration.registrationDate)} />
          <HeroItem label="Final Due Date" value={formatDate(registration.finalInstallmentDueDate)} />
          {showRedeemed ? (
            <HeroItem label="Redeemed On" value={formatDate(registration.redeemedOn)} />
          ) : (
            <HeroItem label="Progress" value={`${pct}%`} />
          )}
        </dl>
      </section>

      {/* Payments & Gold */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StatGroup title="Payments" accent="green">
          <Stat label="Total Paid So Far" value={formatCurrency(effPaid, currencyCode)} big />
          <Stat label="Extra Amount Paid" value={formatCurrency(extraPaid, currencyCode)} />
          <Stat label="Total Bonus Accrued" value={fmtMoney3(registration.totalBonus, currencyCode)} />
        </StatGroup>
        <StatGroup title="Gold" accent="gold">
          <Stat label="Total Weight" value={fmtWeight(totalWeight)} big />
          <Stat label="Bonus Weight" value={fmtWeight(registration.bonusWeightFixed)} />
          <Stat label="Fixed Weight" value={fmtWeight(effFixedWeight)} />
        </StatGroup>
      </div>

      {/* History */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-ink-100">Installment History</h2>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-800/30 dark:text-brand-300">
            {rows.length} {rows.length === 1 ? "Receipt" : "Receipts"}
          </span>
        </div>
        {rows.length === 0 ? (
          <EmptyState
            message="No Installments Recorded Yet."
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M3 12h4l3-8 4 16 3-8h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card dark:border-surface-border dark:bg-surface-raised md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead>
                    <tr className="bg-brand-600 text-[11px] uppercase tracking-wider text-white">
                      <th className="sticky left-0 z-10 bg-brand-600 px-3 py-3 font-semibold">Date</th>
                      <th className="px-3 py-3 font-semibold">Voucher</th>
                      <th className="px-3 py-3 font-semibold">Branch</th>
                      <th className="px-3 py-3 font-semibold">Mode</th>
                      <th className="px-3 py-3 text-right font-semibold">Installment Paid</th>
                      <th className="px-3 py-3 text-right font-semibold">Extra Paid</th>
                      <th className="px-3 py-3 text-right font-semibold">Bonus Value</th>
                      <th className="px-3 py-3 text-right font-semibold">Extra Bonus</th>
                      <th className="px-3 py-3 text-right font-semibold">Total Value</th>
                      <th className="px-3 py-3 text-right font-semibold">Metal Rate</th>
                      <th className="bg-gold-600 px-3 py-3 text-right font-semibold">Weight Fixed</th>
                      <th className="bg-gold-600 px-3 py-3 text-right font-semibold">Bonus Weight</th>
                      <th className="bg-gold-600 px-3 py-3 text-right font-semibold">Extra Weight</th>
                      <th className="bg-gold-600 px-3 py-3 text-right font-semibold">Accumulated Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100 dark:divide-surface-border">
                    {rows.map(({ li, accumulated }, idx) => (
                      <tr key={li.id.toString()} className={`transition hover:bg-brand-50/60 dark:hover:bg-brand-800/20 ${idx % 2 === 1 ? "bg-brand-50/25 dark:bg-surface/40" : ""}`}>
                        <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-3 text-ink-700 dark:bg-surface-raised dark:text-ink-100">{formatDate(li.receipt.voucherDate)}</td>
                        <td className="whitespace-nowrap px-3 py-3 font-semibold text-brand-600 dark:text-brand-300">{li.receipt.voucherNo}</td>
                        <td className="px-3 py-3 text-ink-500 dark:text-ink-300">{li.receipt.branch?.code ?? ""}</td>
                        <td className="px-3 py-3">
                          {receiptMode(li) && (
                            <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-800/30 dark:text-brand-300">{receiptMode(li)}</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-ink-900 dark:text-ink-100">{fmt3(li.amount)}</td>
                        <td className="px-3 py-3 text-right text-ink-700 dark:text-ink-100">{fmtNz(li.extraPaid)}</td>
                        <td className="px-3 py-3 text-right text-ink-700 dark:text-ink-100">{fmtNz(li.bonusValue)}</td>
                        <td className="px-3 py-3 text-right text-ink-700 dark:text-ink-100">{fmtNz(li.extraBonus)}</td>
                        <td className="px-3 py-3 text-right font-medium text-ink-900 dark:text-ink-100">{fmt3(li.totalValue)}</td>
                        <td className="px-3 py-3 text-right text-ink-500 dark:text-ink-300">{fmt3(li.metalRate)}</td>
                        <td className="bg-gold-50/40 px-3 py-3 text-right text-ink-700 dark:bg-transparent dark:text-ink-100">{fmt3(li.fixedMetalWeight)}</td>
                        <td className="bg-gold-50/40 px-3 py-3 text-right text-ink-700 dark:bg-transparent dark:text-ink-100">{fmtNz(li.bonusMetalWeight)}</td>
                        <td className="bg-gold-50/40 px-3 py-3 text-right text-ink-700 dark:bg-transparent dark:text-ink-100">{fmtNz(li.extraBonusWeight)}</td>
                        <td className="bg-gold-50/40 px-3 py-3 text-right font-semibold text-gold-700 dark:bg-transparent dark:text-gold-300">{fmt3(accumulated)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-brand-500 bg-brand-50 text-sm font-semibold text-ink-900 dark:bg-brand-800/20 dark:text-ink-100">
                      <td className="sticky left-0 bg-brand-50 px-3 py-3 dark:bg-transparent" colSpan={4}>Total</td>
                      <td className="px-3 py-3 text-right">{fmt3(sum((l) => l.amount))}</td>
                      <td className="px-3 py-3 text-right">{fmtNz(sum((l) => l.extraPaid))}</td>
                      <td className="px-3 py-3 text-right">{fmtNz(sum((l) => l.bonusValue))}</td>
                      <td className="px-3 py-3 text-right">{fmtNz(sum((l) => l.extraBonus))}</td>
                      <td className="px-3 py-3 text-right">{fmt3(sum((l) => l.totalValue))}</td>
                      <td />
                      <td className="px-3 py-3 text-right">{fmt3(sum((l) => l.fixedMetalWeight))}</td>
                      <td className="px-3 py-3 text-right">{fmtNz(sum((l) => l.bonusMetalWeight))}</td>
                      <td className="px-3 py-3 text-right">{fmtNz(sum((l) => l.extraBonusWeight))}</td>
                      <td className="px-3 py-3 text-right text-gold-700 dark:text-gold-300">{fmt3(rows[rows.length - 1].accumulated)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {rows.map(({ li, accumulated }) => (
                <div key={li.id.toString()} className="rounded-2xl border border-ink-100 bg-white p-4 shadow-card dark:border-surface-border dark:bg-surface-raised">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-brand-600 dark:text-brand-300">{li.receipt.voucherNo}</p>
                      <p className="text-xs text-ink-500 dark:text-ink-300">
                        {formatDate(li.receipt.voucherDate)}
                        {li.receipt.branch?.code ? ` · Branch ${li.receipt.branch.code}` : ""}
                      </p>
                    </div>
                    {receiptMode(li) && (
                      <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-800/30 dark:text-brand-300">{receiptMode(li)}</span>
                    )}
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <MRow k="Installment Paid" v={fmt3(li.amount)} strong />
                    <MRow k="Total Value" v={fmt3(li.totalValue)} strong />
                    <MRow k="Extra Paid" v={fmtNz(li.extraPaid) || "—"} />
                    <MRow k="Bonus Value" v={fmtNz(li.bonusValue) || "—"} />
                    <MRow k="Extra Bonus" v={fmtNz(li.extraBonus) || "—"} />
                    <MRow k="Metal Rate" v={fmt3(li.metalRate)} />
                    <MRow k="Weight Fixed" v={fmt3(li.fixedMetalWeight)} />
                    <MRow k="Bonus Weight" v={fmtNz(li.bonusMetalWeight) || "—"} />
                    <MRow k="Extra Weight" v={fmtNz(li.extraBonusWeight) || "—"} />
                    <MRow k="Accumulated Weight" v={fmt3(accumulated)} strong />
                  </dl>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function HeroItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
      <dt className="text-[11px] font-medium uppercase tracking-wider text-white/70">{label}</dt>
      <dd className="mt-1 text-base font-semibold">{value}</dd>
    </div>
  );
}

function StatGroup({ title, accent, children }: { title: string; accent: "green" | "gold"; children: React.ReactNode }) {
  const bar = accent === "gold" ? "bg-gold-400" : "bg-brand-500";
  return (
    <section className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card dark:border-surface-border dark:bg-surface-raised">
      <div className={`h-1.5 ${bar}`} />
      <div className="p-5">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-ink-500 dark:text-ink-300">{title}</h3>
        <div className="grid grid-cols-2 gap-4">{children}</div>
      </div>
    </section>
  );
}

function Stat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className={big ? "col-span-2 rounded-xl bg-brand-50/60 px-4 py-3 dark:bg-brand-800/20" : "px-1"}>
      <p className="text-xs font-medium text-ink-500 dark:text-ink-300">{label}</p>
      <p className={`mt-1 font-semibold text-ink-900 dark:text-ink-100 ${big ? "text-2xl text-brand-600 dark:text-brand-300" : "text-lg"}`}>{value}</p>
    </div>
  );
}

function MRow({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-ink-500 dark:text-ink-300">{k}</dt>
      <dd className={strong ? "font-semibold text-ink-900 dark:text-ink-100" : "text-ink-700 dark:text-ink-100"}>{v}</dd>
    </div>
  );
}
