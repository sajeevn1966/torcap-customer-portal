"use client";

import { useState } from "react";
import { formatCurrency, formatDate, formatWeight, formatPieces } from "@/lib/format";
import type { MaterialLabel } from "@/lib/material";
import EmptyState from "@/components/EmptyState";

export type SchemeReceiptRow = {
  id: string;
  voucherNo: string;
  voucherDate: Date | string;
  schemeNames: string;
  amount: number | null;
  currencyCode: string | null;
  paymentSummary: string | null;
  remarks: string | null;
};

export type RetailSaleLineItem = {
  id: string;
  productName: string;
  material: MaterialLabel;
  weight: number | null;
  pieces: number | null;
  amount: number | null;
};

export type RetailSaleInvoice = {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date | string | null;
  currencyCode: string | null;
  grandTotal: number | null;
  salesPersonName: string | null;
  lineItems: RetailSaleLineItem[];
};

export type OjpRow = {
  id: string;
  voucherNumber: string;
  voucherDate: Date | string | null;
  weight: number | null;
  amount: number | null;
  currencyCode: string | null;
  salesPersonName: string | null;
};

// Sales Order shares the same "card per order, line items underneath"
// shape as Retail Sale, so it reuses RetailSaleLineItem for its rows.
export type SalesOrderInvoice = {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date | string | null;
  currencyCode: string | null;
  grandTotal: number | null;
  salesPersonName: string | null;
  lineItems: RetailSaleLineItem[];
};

export type AdvanceReceiptRow = {
  id: string;
  receiptNumber: string;
  receiptDate: Date | string | null;
  amount: number | null;
  balance: number | null;
  currencyCode: string | null;
  salesPersonName: string | null;
};

const TABS = [
  {
    key: "scheme" as const,
    label: "Scheme",
    icon: (
      <>
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
        <path d="M8.2 12.3l2.6 2.6 5-5.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    key: "retail" as const,
    label: "Retail Sale - Gold Purchase",
    icon: (
      <>
        <path
          d="M6 8h12l-.9 11.1a2 2 0 01-2 1.9H8.9a2 2 0 01-2-1.9L6 8z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M9 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </>
    ),
  },
  {
    key: "ojp" as const,
    label: "Old Gold Sale",
    icon: (
      <>
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M9.3 9.3c0-1 1.1-1.7 2.7-1.7s2.7.7 2.7 1.7-1.1 1.5-2.7 1.5-2.7.6-2.7 1.6 1.1 1.7 2.7 1.7 2.7-.6 2.7-1.7"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path d="M12 6.3v1.3M12 16.4v1.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
  },
  {
    key: "salesOrder" as const,
    label: "Sales Order",
    icon: (
      <>
        <path
          d="M7 3h10l1 3v14a1 1 0 01-1 1H7a1 1 0 01-1-1V6l1-3z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M9 3v3h6V3M9 11l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    key: "advance" as const,
    label: "Advance Receipt",
    icon: (
      <>
        <rect x="3.5" y="6" width="17" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3.5 10h17" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="16.5" cy="14" r="1.4" fill="currentColor" stroke="none" />
      </>
    ),
  },
];

type TabKey = (typeof TABS)[number]["key"];

const MATERIAL_STYLES: Record<Exclude<MaterialLabel, null>, string> = {
  Diamond: "bg-brand-100 text-brand-700 dark:bg-brand-800/40 dark:text-brand-300",
  Gold: "bg-gold-100 text-gold-700 dark:bg-gold-700/30 dark:text-gold-300",
  Silver: "bg-ink-100 text-ink-600 dark:bg-surface-raised dark:text-ink-300",
};

export default function TransactionsTabs({
  schemeReceipts,
  retailSales,
  ojpPurchases,
  salesOrders,
  advanceReceipts,
}: {
  schemeReceipts: SchemeReceiptRow[];
  retailSales: RetailSaleInvoice[];
  ojpPurchases: OjpRow[];
  salesOrders: SalesOrderInvoice[];
  advanceReceipts: AdvanceReceiptRow[];
}) {
  const [tab, setTab] = useState<TabKey>("scheme");

  const counts: Record<TabKey, number> = {
    scheme: schemeReceipts.length,
    retail: retailSales.length,
    ojp: ojpPurchases.length,
    salesOrder: salesOrders.length,
    advance: advanceReceipts.length,
  };

  return (
    <div className="space-y-5">
      <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-ink-100 bg-white p-1 shadow-sm [scrollbar-width:none] dark:border-surface-border dark:bg-surface-raised sm:inline-flex [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={(e) => {
              setTab(t.key);
              // On small screens the tab row scrolls sideways — bring the
              // tapped tab into view so its name is never cut off.
              e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
            }}
            aria-label={t.label}
            className={`group flex shrink-0 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition sm:px-3.5 sm:py-1.5 ${
              tab === t.key
                ? "bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-sm shadow-brand-500/30"
                : "text-ink-500 hover:bg-brand-50 hover:text-brand-700 dark:text-ink-300 dark:hover:bg-surface dark:hover:text-brand-300"
            }`}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
              className={`shrink-0 ${tab === t.key ? "opacity-100" : "opacity-60 transition-opacity group-hover:opacity-100"}`}
            >
              {t.icon}
            </svg>
            <span className="whitespace-nowrap">{t.label}</span>
            <span
              className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                tab === t.key
                  ? "bg-white/20 text-white"
                  : "bg-ink-100 text-ink-500 dark:bg-surface dark:text-ink-300"
              }`}
            >
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {tab === "scheme" && <SchemeTab rows={schemeReceipts} />}
      {tab === "retail" && <InvoiceTab invoices={retailSales} kind="retail" />}
      {tab === "ojp" && <OjpTab rows={ojpPurchases} />}
      {tab === "salesOrder" && <InvoiceTab invoices={salesOrders} kind="salesOrder" />}
      {tab === "advance" && <AdvanceReceiptTab rows={advanceReceipts} />}
    </div>
  );
}

function SalesPersonTag({ name }: { name: string | null }) {
  if (!name) return null;
  return (
    <span className="inline-flex items-center gap-1 text-ink-500 dark:text-ink-300">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      {name}
    </span>
  );
}

function SchemeTab({ rows }: { rows: SchemeReceiptRow[] }) {
  if (rows.length === 0)
    return (
      <EmptyState
        message="No Scheme Transactions Yet."
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M8.2 12.3l2.6 2.6 5-5.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        }
      />
    );
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div
          key={r.id}
          className="flex flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-md dark:border-surface-border dark:bg-surface-raised sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">Receipt {r.voucherNo}</p>
            <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-300">
              {formatDate(r.voucherDate)}
              {r.schemeNames ? ` · ${r.schemeNames}` : ""}
            </p>
            {r.remarks && <p className="mt-1 text-xs text-ink-300 dark:text-ink-500">{r.remarks}</p>}
          </div>
          <div className="text-right">
            <p className="text-base font-semibold text-ink-900 dark:text-ink-100">
              {formatCurrency(r.amount, r.currencyCode)}
            </p>
            {r.paymentSummary && <p className="text-xs text-ink-500 dark:text-ink-300">{r.paymentSummary}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// Shared by Retail Sale and Sales Order — identical card-per-invoice,
// line-items-underneath layout, differing only in which empty-state
// copy/icon and terminology ("Invoice" vs "Order") fits the tab.
function InvoiceTab({
  invoices,
  kind,
}: {
  invoices: RetailSaleInvoice[] | SalesOrderInvoice[];
  kind: "retail" | "salesOrder";
}) {
  if (invoices.length === 0)
    return (
      <EmptyState
        message={kind === "retail" ? "No Retail Sale - Gold Purchase Transactions Yet." : "No Sales Order Transactions Yet."}
        icon={
          kind === "retail" ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6 8h12l-.9 11.1a2 2 0 01-2 1.9H8.9a2 2 0 01-2-1.9L6 8z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M9 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M7 3h10l1 3v14a1 1 0 01-1 1H7a1 1 0 01-1-1V6l1-3z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M9 3v3h6V3M9 11l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )
        }
      />
    );
  const label = kind === "retail" ? "Invoice" : "Order";
  return (
    <div className="space-y-4">
      {invoices.map((invoice) => (
        <div
          key={invoice.id}
          className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-md dark:border-surface-border dark:bg-surface-raised"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 bg-brand-50/60 px-5 py-3 dark:border-surface-border dark:bg-surface">
            <div>
              <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                {label} {invoice.invoiceNumber}
              </p>
              <p className="text-xs text-ink-500 dark:text-ink-300">
                {formatDate(invoice.invoiceDate)}
                {invoice.salesPersonName && (
                  <>
                    {" · "}
                    <SalesPersonTag name={invoice.salesPersonName} />
                  </>
                )}
              </p>
            </div>
            <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">
              {formatCurrency(invoice.grandTotal, invoice.currencyCode)}
            </p>
          </div>

          <table className="w-full table-fixed text-left text-sm">
            <colgroup>
              <col className="w-[40%]" />
              <col className="w-[20%]" />
              <col className="w-[20%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead className="text-xs uppercase tracking-wide text-ink-300 dark:text-ink-500">
              <tr>
                <th className="px-5 py-2 font-medium">Product</th>
                <th className="px-5 py-2 font-medium">Material</th>
                <th className="px-5 py-2 text-right font-medium">Weight / Pcs</th>
                <th className="px-5 py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((li) => (
                <tr key={li.id} className="border-t border-ink-100 first:border-t-0 dark:border-surface-border">
                  <td className="truncate px-5 py-2.5 text-ink-900 dark:text-ink-100">{li.productName}</td>
                  <td className="px-5 py-2.5">
                    {li.material ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${MATERIAL_STYLES[li.material]}`}
                      >
                        {li.material}
                      </span>
                    ) : (
                      <span className="text-ink-300 dark:text-ink-500">—</span>
                    )}
                  </td>
                  <td className="px-5 py-2.5 text-right text-ink-500 dark:text-ink-300">
                    {li.material === "Diamond" ? formatPieces(li.pieces) : formatWeight(li.weight)}
                  </td>
                  <td className="px-5 py-2.5 text-right font-medium text-ink-900 dark:text-ink-100">
                    {formatCurrency(li.amount, invoice.currencyCode)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function OjpTab({ rows }: { rows: OjpRow[] }) {
  if (rows.length === 0)
    return (
      <EmptyState
        message="No Old Gold Sale Transactions Yet."
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M9.3 9.3c0-1 1.1-1.7 2.7-1.7s2.7.7 2.7 1.7-1.1 1.5-2.7 1.5-2.7.6-2.7 1.6 1.1 1.7 2.7 1.7 2.7-.6 2.7-1.7"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path d="M12 6.3v1.3M12 16.4v1.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        }
      />
    );
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 dark:border-surface-border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-brand-50/60 text-xs uppercase tracking-wide text-ink-500 dark:bg-surface-raised dark:text-ink-300">
            <tr>
              <th className="px-4 py-3 font-medium">Invoice</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Salesman</th>
              <th className="px-4 py-3 text-right font-medium">Weight</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr
                key={r.id}
                className={`transition hover:bg-brand-50/40 dark:hover:bg-surface ${
                  idx % 2 === 1 ? "bg-brand-50/20 dark:bg-surface-raised/40" : ""
                }`}
              >
                <td className="px-4 py-3 font-medium text-ink-900 dark:text-ink-100">{r.voucherNumber}</td>
                <td className="px-4 py-3 text-ink-500 dark:text-ink-300">{formatDate(r.voucherDate)}</td>
                <td className="px-4 py-3 text-ink-500 dark:text-ink-300">{r.salesPersonName ?? "—"}</td>
                <td className="px-4 py-3 text-right text-ink-500 dark:text-ink-300">{formatWeight(r.weight)}</td>
                <td className="px-4 py-3 text-right font-medium text-ink-900 dark:text-ink-100">
                  {formatCurrency(r.amount, r.currencyCode)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdvanceReceiptTab({ rows }: { rows: AdvanceReceiptRow[] }) {
  if (rows.length === 0)
    return (
      <EmptyState
        message="No Advance Receipt Transactions Yet."
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="3.5" y="6" width="17" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
            <path d="M3.5 10h17" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="16.5" cy="14" r="1.4" fill="currentColor" stroke="none" />
          </svg>
        }
      />
    );
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 dark:border-surface-border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-brand-50/60 text-xs uppercase tracking-wide text-ink-500 dark:bg-surface-raised dark:text-ink-300">
            <tr>
              <th className="px-4 py-3 font-medium">Receipt</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Salesman</th>
              <th className="px-4 py-3 text-right font-medium">Balance</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr
                key={r.id}
                className={`transition hover:bg-brand-50/40 dark:hover:bg-surface ${
                  idx % 2 === 1 ? "bg-brand-50/20 dark:bg-surface-raised/40" : ""
                }`}
              >
                <td className="px-4 py-3 font-medium text-ink-900 dark:text-ink-100">{r.receiptNumber}</td>
                <td className="px-4 py-3 text-ink-500 dark:text-ink-300">{formatDate(r.receiptDate)}</td>
                <td className="px-4 py-3 text-ink-500 dark:text-ink-300">{r.salesPersonName ?? "—"}</td>
                <td className="px-4 py-3 text-right text-ink-500 dark:text-ink-300">
                  {formatCurrency(r.balance, r.currencyCode)}
                </td>
                <td className="px-4 py-3 text-right font-medium text-ink-900 dark:text-ink-100">
                  {formatCurrency(r.amount, r.currencyCode)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
