import { z } from "zod";

export const createReceiptSchema = z.object({
  voucherNo: z.string().min(1, "Voucher number is required").max(255),
  voucherDate: z.coerce.date(),
  customerId: z.coerce.bigint(),
  amount: z.coerce.number().optional(),
  metalRate: z.coerce.number().optional(),
  remarks: z.string().max(500).optional(),
  voucherTypeId: z.coerce.bigint().optional(),
  branchId: z.coerce.bigint(),
  financialYear: z.coerce.bigint(),
  divisionId: z.coerce.bigint().optional(),
  metalRateTypeId: z.coerce.bigint().optional(),
  fixedWeight: z.coerce.number().optional(),
  karatId: z.coerce.bigint().optional(),
});

export const updateReceiptSchema = createReceiptSchema.partial();

export const createLineItemSchema = z.object({
  schemeId: z.coerce.bigint().optional(),
  registrationId: z.coerce.bigint().optional(),
  amount: z.coerce.number().optional(),
  bonusValue: z.coerce.number().optional(),
  fixedMetalWeight: z.coerce.number().optional(),
  bonusMetalWeight: z.coerce.number().optional(),
  totalValue: z.coerce.number().optional(),
  totalFixedWeight: z.coerce.number().optional(),
  remarks: z.string().max(255).optional(),
  metalRate: z.coerce.number().optional(),
  bonusPercentage: z.coerce.number().optional(),
  nowPayingInstallments: z.coerce.number().int().optional(),
  totalInstallments: z.coerce.number().int().optional(),
  paidInstallments: z.coerce.number().int().optional(),
  extraPaid: z.coerce.number().optional(),
  extraBonus: z.coerce.number().default(0).optional(),
  extraBonusWeight: z.coerce.number().default(0).optional(),
  installmentStatus: z.string().max(100).optional(),
});

export const createPaymentDetailSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  referenceNumber: z.string().max(100).optional(),
  rate: z.coerce.number().optional(),
  lcAmount: z.coerce.number().optional(),
  paymentModeId: z.coerce.bigint(),
  currencyId: z.coerce.bigint().optional(),
});

export type CreateReceiptInput = z.infer<typeof createReceiptSchema>;
export type UpdateReceiptInput = z.infer<typeof updateReceiptSchema>;
export type CreateLineItemInput = z.infer<typeof createLineItemSchema>;
export type CreatePaymentDetailInput = z.infer<typeof createPaymentDetailSchema>;
