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
        include: { receipt: { include: { branch: { include: { currency: true } } } } },
        orderBy: { createdDate: "desc" },
      },
    },
  });

  if (!registration) notFound();

  const paid = registration.noOfInstallmentsPaid ?? 0;
  const total = registration.scheme.noOfInstallments;
  const currencyCode = registration.branch?.currency?.code;
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
        <InfoCard label="Registration Date" value={formatDate(registration.registrationDate)} />
        <InfoCard label="Final Due Date" value={formatDate(registration.finalInstallmentDueDate)} />
        <InfoCard label="Status" value={statusLabel} />
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
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="bg-brand-50/60 text-xs uppercase tracking-wide text-ink-500 dark:bg-surface-raised dark:text-ink-300">
                  <tr>
                    <th className="px-4 py-3 font-medium">Voucher</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Installment #</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {registration.lineItems.map((li, idx) => (
                    <tr key={li.id.toString()} className={idx % 2 === 1 ? "bg-brand-50/20 dark:bg-surface-raised/40" : ""}>
                      <td className="px-4 py-3 font-medium text-ink-900 dark:text-ink-100">{li.receipt.voucherNo}</td>
                      <td className="px-4 py-3 text-ink-500 dark:text-ink-300">{formatDate(li.receipt.voucherDate)}</td>
                      <td className="px-4 py-3 text-ink-500 dark:text-ink-300">{li.nowPayingInstallments ?? "—"}</td>
                      <td className="px-4 py-3 text-right font-medium text-ink-900 dark:text-ink-100">
                        {formatCurrency(li.amount, li.receipt.branch?.currency?.code)}
                      </td>
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
