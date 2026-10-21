import Link from "next/link";
import ProgressRing from "./ProgressRing";
import { formatCurrency, formatDate } from "@/lib/format";
import { deriveSchemeStatus } from "@/lib/scheme-status";

type RegistrationWithScheme = {
  id: bigint | string;
  registrationNumber: string | null;
  noOfInstallmentsPaid: number | null;
  finalInstallmentDueDate: Date | string | null;
  status: string;
  isCancelled?: boolean | null;
  redeemedOn?: Date | string | null;
  scheme: {
    name: string;
    noOfInstallments: number;
    installmentAmount: number;
  };
  branch?: { currency?: { code: string | null } | null } | null;
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-brand-100 text-brand-700 dark:bg-brand-800/40 dark:text-brand-300",
  MATURED: "bg-gold-100 text-gold-700 dark:bg-gold-700/30 dark:text-gold-300",
  REDEEMED: "bg-ink-100 text-ink-500 dark:bg-surface-raised dark:text-ink-300",
  CANCELLED: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300",
};

const STATUS_LABELS: Record<string, string> = {
  MATURED: "READY TO REDEEM",
};

export default function SchemeCard({ registration }: { registration: RegistrationWithScheme }) {
  const paid = registration.noOfInstallmentsPaid ?? 0;
  const total = registration.scheme.noOfInstallments;
  const left = Math.max(0, total - paid);
  const currencyCode = registration.branch?.currency?.code ?? null;
  const lifecycleStatus = deriveSchemeStatus(registration);

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg dark:border-surface-border dark:bg-surface-raised">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-300 dark:text-ink-500">
            {registration.scheme.noOfInstallments}-month plan
          </p>
          <h3 className="text-base font-semibold text-ink-900 dark:text-ink-100">{registration.scheme.name}</h3>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
            STATUS_STYLES[lifecycleStatus] ?? "bg-ink-100 text-ink-500 dark:bg-surface-raised dark:text-ink-300"
          }`}
        >
          {STATUS_LABELS[lifecycleStatus] ?? lifecycleStatus}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <ProgressRing paid={paid} total={total} />
        <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <span className="text-ink-500 dark:text-ink-300">Monthly</span>
          <span className="text-right font-medium text-ink-900 dark:text-ink-100">
            {formatCurrency(registration.scheme.installmentAmount, currencyCode)}
          </span>
          <span className="text-ink-500 dark:text-ink-300">Final Due</span>
          <span className="text-right font-medium text-ink-900 dark:text-ink-100">
            {formatDate(registration.finalInstallmentDueDate)}
          </span>
          <span className="text-ink-500 dark:text-ink-300">Plan ID</span>
          <span className="text-right font-medium text-ink-900 dark:text-ink-100">
            {registration.registrationNumber ?? String(registration.id)}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3 dark:border-surface-border">
        <span className="text-xs text-ink-500 dark:text-ink-300">
          {left > 0 ? `${left} Installment${left === 1 ? "" : "s"} Left` : "Completed"}
        </span>
        <Link
          href={`/schemes/${registration.id}`}
          className="group/link inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          Details
          <span className="transition-transform group-hover/link:translate-x-0.5">→</span>
        </Link>
      </div>
    </div>
  );
}
