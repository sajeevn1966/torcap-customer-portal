import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionCustomerId } from "@/lib/session";
import { formatCurrency, formatDate } from "@/lib/format";
import { deriveSchemeStatus } from "@/lib/scheme-status";
import ProgressRing from "@/components/ProgressRing";
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

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-brand-600 dark:text-brand-400">
          {registration.registrationNumber ?? registration.id.toString()}
        </p>
        <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-ink-100">{registration.scheme.name}</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-md dark:border-surface-border dark:bg-surface-raised sm:col-span-1">
          <ProgressRing paid={paid} total={total} size={56} />
          <div>
            <p className="text-sm font-medium text-ink-900 dark:text-ink-100">Installments Paid</p>
            <p className="text-xs text-ink-500 dark:text-ink-300">{Math.max(0, total - paid)} Remaining</p>
          </div>
        </div>
        <InfoCard label="Monthly Installment" value={formatCurrency(registration.scheme.installmentAmount, currencyCode)} />
        <InfoCard label="Total Paid So Far" value={formatCurrency(registration.totalPaidAmount, currencyCode)} />
        <InfoCard label="Extra Amount Paid" value={formatCurrency(extraPaid, currencyCode)} />
        <InfoCard label="Total Weight" value={fmtWeight((registration.totalFixedWeight ?? 0) + (registration.bonusWeightFixed ?? 0))} />
        <InfoCard label="Bonus Weight" value={fmtWeight(registration.bonusWeightFixed)} />
        <InfoCard label="Total Bonus Accrued" value={fmtMoney3(registration.totalBonus, currencyCode)} />
        <InfoCard label="Registration Date" value={formatDate(registration.registrationDate)} />
        <InfoCard label="Final Due Date" value={formatDate(registration.finalInstallmentDueDate)} />
        <InfoCard label="Status" value={statusLabel} />
        {lifecycleStatus === "REDEEMED" && registration.redeemedPosInvoiceId != null && <InfoCard label="Redeemed On" value={formatDate(registration.redeemedOn)} />}
      </div>

      <section>
        <h2 className="font-display mb-3 text-lg font-semibold text-ink-900 dark:text-ink-100">Installment History</h2>
        {registration.lineItems.length === 0 ? (
          <EmptyState
            message="No Installments Recorded Yet."
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="bg-brand-50/60 text-xs uppercase tracking-wide text-ink-500 dark:bg-surface-raised dark:text-ink-300">
                  <tr>
                    <th className="px-3 py-3 font-medium">Branch</th>
                    <th className="px-3 py-3 font-medium">Date</th>
                    <th className="px-3 py-3 font-medium">Voucher</th>
                    <th className="px-3 py-3 font-medium">Receipt Mode</th>
                    <th className="px-3 py-3 text-right font-medium">Installment Paid</th>
                    <th className="px-3 py-3 text-right font-medium">Extra Paid</th>
                    <th className="px-3 py-3 text-right font-medium">Bonus Value</th>
                    <th className="px-3 py-3 text-right font-medium">Extra Bonus</th>
                    <th className="px-3 py-3 text-right font-medium">Total Value</th>
                    <th className="px-3 py-3 text-right font-medium">Metal Rate</th>
                    <th className="px-3 py-3 text-right font-medium">Weight Fixed</th>
                    <th className="px-3 py-3 text-right font-medium">Bonus Weight</th>
                    <th className="px-3 py-3 text-right font-medium">Extra Weight</th>
                    <th className="px-3 py-3 text-right font-medium">Total Accumulated Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ li, accumulated }, idx) => (
                    <tr key={li.id.toString()} className={idx % 2 === 1 ? "bg-brand-50/20 dark:bg-surface-raised/40" : ""}>
                      <td className="px-3 py-3 text-ink-500 dark:text-ink-300">{li.receipt.branch?.code ?? ""}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-ink-500 dark:text-ink-300">{formatDate(li.receipt.voucherDate)}</td>
                      <td className="whitespace-nowrap px-3 py-3 font-medium text-ink-900 dark:text-ink-100">{li.receipt.voucherNo}</td>
                      <td className="px-3 py-3 text-ink-500 dark:text-ink-300">
                        {Array.from(new Set(li.receipt.paymentDetails.filter((d) => !d.isDeleted).map((d) => modeLabel(d.paymentModeId)).filter(Boolean))).join(", ")}
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-ink-900 dark:text-ink-100">{fmt3(li.amount)}</td>
                      <td className="px-3 py-3 text-right text-ink-700 dark:text-ink-100">{fmtNz(li.extraPaid)}</td>
                      <td className="px-3 py-3 text-right text-ink-700 dark:text-ink-100">{fmtNz(li.bonusValue)}</td>
                      <td className="px-3 py-3 text-right text-ink-700 dark:text-ink-100">{fmtNz(li.extraBonus)}</td>
                      <td className="px-3 py-3 text-right text-ink-700 dark:text-ink-100">{fmt3(li.totalValue)}</td>
                      <td className="px-3 py-3 text-right text-ink-700 dark:text-ink-100">{fmt3(li.metalRate)}</td>
                      <td className="px-3 py-3 text-right text-ink-700 dark:text-ink-100">{fmt3(li.fixedMetalWeight)}</td>
                      <td className="px-3 py-3 text-right text-ink-700 dark:text-ink-100">{fmtNz(li.bonusMetalWeight)}</td>
                      <td className="px-3 py-3 text-right text-ink-700 dark:text-ink-100">{fmtNz(li.extraBonusWeight)}</td>
                      <td className="px-3 py-3 text-right font-medium text-ink-900 dark:text-ink-100">{fmt3(accumulated)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-md dark:border-surface-border dark:bg-surface-raised">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-300 dark:text-ink-500">{label}</p>
      <p className="mt-1.5 text-base font-semibold text-ink-900 dark:text-ink-100">{value}</p>
    </div>
  );
}
