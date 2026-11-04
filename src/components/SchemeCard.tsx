import Link from "next/link";
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
  redeemedPosInvoiceId?: bigint | string | null;
  scheme: {
    name: string;
    noOfInstallments: number;
    installmentAmount: number;
  };
  branch?: { currency?: { code: string | null } | null } | null;
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-white/20 text-white ring-1 ring-white/40",
  MATURED: "bg-gold-100 text-gold-700",
  REDEEMED: "bg-white/90 text-ink-700",
  CANCELLED: "bg-red-100 text-red-700",
};

// Header band colour by lifecycle status (green = running, gold = ready,
// grey = redeemed, muted red = cancelled).
const BAND_STYLES: Record<string, string> = {
  ACTIVE: "from-brand-500 via-brand-600 to-brand-800",
  MATURED: "from-gold-400 via-gold-500 to-gold-600",
  REDEEMED: "from-ink-500 to-ink-700",
  CANCELLED: "from-red-400 to-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  MATURED: "READY TO REDEEM",
};

export default function SchemeCard({ registration }: { registration: RegistrationWithScheme }) {
  const paid = registration.noOfInstallmentsPaid ?? 0;
  const total = registration.scheme.noOfInstallments;
  const left = Math.max(0, total - paid);
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const currencyCode = registration.branch?.currency?.code ?? null;
  const lifecycleStatus = deriveSchemeStatus(registration);
  const showRedeemed = lifecycleStatus === "REDEEMED" && registration.redeemedPosInvoiceId != null;

  return (
    <div className="group overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-lg dark:border-surface-border dark:bg-surface-raised">
      <div className={`relative bg-gradient-to-br p-4 text-white ${BAND_STYLES[lifecycleStatus] ?? BAND_STYLES.ACTIVE}`}>
        <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/75">
              {registration.scheme.noOfInstallments}-Month Plan
            </p>
            <h3 className="mt-0.5 truncate text-lg font-semibold">{registration.scheme.name}</h3>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
              STATUS_STYLES[lifecycleStatus] ?? STATUS_STYLES.ACTIVE
            }`}
          >
            {STATUS_LABELS[lifecycleStatus] ?? lifecycleStatus}
          </span>
        </div>
        <div className="relative mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-white/85">
            <span>
              {paid} Of {total} Paid
            </span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          <Tile label="Monthly" value={formatCurrency(registration.scheme.installmentAmount, currencyCode)} />
          <Tile label="Final Due" value={formatDate(registration.finalInstallmentDueDate)} />
          <Tile label="Plan ID" value={registration.registrationNumber ?? String(registration.id)} />
          {showRedeemed && <Tile label="Redeemed On" value={formatDate(registration.redeemedOn)} />}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3 dark:border-surface-border">
          <span className="text-xs font-medium text-ink-500 dark:text-ink-300">
            {left > 0 ? `${left} Installment${left === 1 ? "" : "s"} Left` : "Completed"}
          </span>
          <Link
            href={`/schemes/${registration.id}`}
            className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3.5 py-1.5 text-sm font-semibold text-brand-600 transition hover:bg-brand-100 dark:bg-brand-800/30 dark:text-brand-300 dark:hover:bg-brand-800/50"
          >
            Details
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-brand-50/50 px-3 py-2 dark:bg-surface">
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-500 dark:text-ink-300">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-ink-900 dark:text-ink-100">{value}</p>
    </div>
  );
}
