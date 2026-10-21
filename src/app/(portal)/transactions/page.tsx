import { prisma } from "@/lib/prisma";
import { getSessionCustomerId } from "@/lib/session";
import { formatCurrency } from "@/lib/format";
import { classifyMaterial, materialWeight } from "@/lib/material";
import TransactionsTabs, {
  type SchemeReceiptRow,
  type RetailSaleInvoice,
  type OjpRow,
  type SalesOrderInvoice,
  type AdvanceReceiptRow,
} from "@/components/TransactionsTabs";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const customerId = BigInt(getSessionCustomerId()!);

  const [receipts, invoices, ojpPurchases, salesOrders, advanceReceipts] = await Promise.all([
    prisma.schemeReceipt.findMany({
      where: { customerId, isDeleted: false },
      include: {
        lineItems: { include: { scheme: true } },
        paymentDetails: { include: { currency: true } },
        branch: { include: { currency: true } },
      },
      orderBy: [{ voucherDate: "desc" }, { voucherNo: "desc" }],
    }),
    prisma.posInvoice.findMany({
      where: { posCustomerId: customerId, isDeleted: false },
      include: {
        lineItems: { where: { isDeleted: false }, include: { item: true } },
        branch: { include: { currency: true } },
        salesPerson: true,
      },
      orderBy: [{ invoiceDate: "desc" }, { invoiceNumber: "desc" }],
    }),
    prisma.oldJewelleryPurchase.findMany({
      where: { posCustomerId: customerId, isDeleted: false },
      include: { branch: { include: { currency: true } }, salesPerson: true },
      orderBy: [{ voucherDate: "desc" }, { voucherNumber: "desc" }],
    }),
    prisma.retailSalesOrder.findMany({
      where: { customerId, isDeleted: false },
      include: {
        lineItems: { where: { isDeleted: false }, include: { item: true } },
        branch: { include: { currency: true } },
        salesPerson: true,
      },
      orderBy: [{ voucherDate: "desc" }, { voucherNumber: "desc" }],
    }),
    prisma.advanceReceipt.findMany({
      where: { posCustomerId: customerId, isDeleted: false },
      include: { branch: { include: { currency: true } }, salesPerson: true },
      orderBy: [{ receiptDate: "desc" }, { receiptNumber: "desc" }],
    }),
  ]);

  const schemeRows: SchemeReceiptRow[] = receipts.map((receipt) => {
    const schemeNames = Array.from(
      new Set(receipt.lineItems.map((li) => li.scheme?.name).filter(Boolean))
    ).join(", ");
    const paymentSummary = receipt.paymentDetails
      .map((pd) => formatCurrency(pd.amount, pd.currency?.code ?? receipt.branch?.currency?.code))
      .join(" + ");

    return {
      id: receipt.id.toString(),
      voucherNo: receipt.voucherNo,
      voucherDate: receipt.voucherDate,
      schemeNames,
      amount: receipt.amount,
      currencyCode: receipt.branch?.currency?.code ?? null,
      paymentSummary: paymentSummary || null,
      remarks: receipt.remarks,
    };
  });

  // One card per invoice, with its own line items grouped underneath —
  // a single invoice can mix diamond, gold, and silver pieces, so each
  // line item still needs its own material + weight, but the invoice
  // number/date should only appear once per invoice, not repeated on
  // every product row.
  const retailInvoices: RetailSaleInvoice[] = invoices.map((invoice) => ({
    id: invoice.id.toString(),
    invoiceNumber: invoice.invoiceNumber ?? "—",
    invoiceDate: invoice.invoiceDate,
    currencyCode: invoice.branch?.currency?.code ?? null,
    grandTotal: invoice.grandTotal ?? invoice.netAmount,
    salesPersonName: invoice.salesPerson?.name ?? null,
    lineItems: invoice.lineItems.map((li) => {
      const material = classifyMaterial(li.item);
      return {
        id: li.id.toString(),
        productName: li.description ?? li.item?.description ?? li.code ?? "Item",
        material,
        // Diamonds are counted in pieces, not weighed in grams like gold/
        // silver — `weight` (from stone_weight) is often 0 or negligible
        // for a diamond-set piece, so the UI shows piece count instead for
        // Diamond rows (see TransactionsTabs.tsx). `pieces` itself is
        // often null in the real data; `quantity_in_pieces` is NOT NULL
        // with a default of 1 and is reliably populated, so it's the
        // fallback rather than the other way around.
        weight: materialWeight(material, { stoneWeight: li.stoneWeight, netWeight: li.netWeight, weight: li.weight }),
        pieces: li.pieces ?? li.quantityInPieces,
        amount: li.totalAmount ?? li.amount,
      };
    }),
  }));

  const ojpRows: OjpRow[] = ojpPurchases.map((p) => ({
    id: p.id.toString(),
    voucherNumber: p.voucherNumber ?? "—",
    voucherDate: p.voucherDate,
    weight: p.netWeight ?? p.grossWeight,
    amount: p.grandTotal ?? p.paidAmount,
    currencyCode: p.branch?.currency?.code ?? null,
    salesPersonName: p.salesPerson?.name ?? null,
  }));

  // Sales Order is distinct from Retail Sale — confirmed in the database
  // that retail_sales_order and pos_invoice are separate tables, with
  // retail_sales_order_invoice linking an order to the pos_invoice
  // eventually raised against it. Same card-per-order layout as Retail
  // Sale, since an order can likewise mix materials across its line items.
  const salesOrderInvoices: SalesOrderInvoice[] = salesOrders.map((order) => ({
    id: order.id.toString(),
    invoiceNumber: order.voucherNumber ?? "—",
    invoiceDate: order.voucherDate,
    currencyCode: order.branch?.currency?.code ?? null,
    grandTotal: order.totalAmountPaid,
    salesPersonName: order.salesPerson?.name ?? null,
    lineItems: order.lineItems.map((li) => {
      const material = classifyMaterial(li.item);
      return {
        id: li.id.toString(),
        productName: li.description ?? li.item?.description ?? "Item",
        material,
        // retail_sales_order_line_item has no quantity_in_pieces fallback
        // column (unlike pos_invoice_line_item) — `pieces` is the only
        // source here, so it can be null for a Diamond row with no count
        // recorded, rendering as "—" rather than assuming a default of 1.
        weight: materialWeight(material, { stoneWeight: li.stoneWeight, netWeight: li.metalWeight, weight: li.metalWeight }),
        pieces: li.pieces,
        amount: li.total,
      };
    }),
  }));

  const advanceReceiptRows: AdvanceReceiptRow[] = advanceReceipts.map((r) => ({
    id: r.id.toString(),
    receiptNumber: r.receiptNumber ?? "—",
    receiptDate: r.receiptDate,
    amount: r.amount,
    balance: r.balance,
    currencyCode: r.branch?.currency?.code ?? null,
    salesPersonName: r.salesPerson?.name ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-ink-100">Transactions</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">
          Scheme Installments, Retail Sale - Gold Purchase, Old Gold Sale, Sales Order, And Advance Receipt — All In One Place.
        </p>
      </div>

      <TransactionsTabs
        schemeReceipts={schemeRows}
        retailSales={retailInvoices}
        ojpPurchases={ojpRows}
        salesOrders={salesOrderInvoices}
        advanceReceipts={advanceReceiptRows}
      />
    </div>
  );
}
