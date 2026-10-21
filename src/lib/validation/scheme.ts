import { z } from "zod";

export const createSchemeSchema = z.object({
  schemeId: z.string().max(255).optional(),
  name: z.string().min(1, "Name is required").max(50),
  type: z.string().min(1, "Type is required").max(50),
  schemeValidity: z.coerce.number().int().optional(),
  paymentMode: z.string().min(1, "Payment mode is required").max(50),
  noOfInstallments: z.coerce.number().int().positive("Must be at least 1 installment"),
  installmentAmount: z.coerce.number().positive("Installment amount must be greater than 0"),
  isFixed: z.coerce.boolean().default(false),
  isInstallmentBonus: z.coerce.boolean().default(false),
  bonusType: z.string().max(50).optional(),
  bonusPercentage: z.coerce.number().min(0).max(100).optional(),
  bonusValue: z.coerce.number().optional(),
  isFixMetal: z.coerce.boolean().default(false),
  isExtraBonusOnMaturity: z.coerce.boolean().default(false),
  maturityBonusType: z.string().max(50).optional(),
  preMatureBonus: z.string().max(50).optional(),
  maturityBonusValue: z.coerce.number().optional(),
  schemeControlAccountId: z.coerce.bigint().optional(),
  schemeAdvanceAccountId: z.coerce.bigint().optional(),
  isActive: z.coerce.boolean().default(true),
  delayAllowedForInstallment: z.coerce.number().int().optional(),
  isBonusOnDelayedInstallment: z.coerce.boolean().default(false),
  fixWithLesserMetalRate: z.coerce.boolean().default(false),
  allowPreMatureClosing: z.coerce.boolean().default(false),
  additionalPaymentMultiple: z.coerce.number().default(0).optional(),
  schemeMcDiscountAccountId: z.coerce.bigint().optional(),
});

export const updateSchemeSchema = createSchemeSchema.partial();

export type CreateSchemeInput = z.infer<typeof createSchemeSchema>;
export type UpdateSchemeInput = z.infer<typeof updateSchemeSchema>;
