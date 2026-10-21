import { z } from "zod";

export const createRegistrationSchema = z.object({
  customerId: z.coerce.bigint(),
  schemeId: z.coerce.bigint(),
  registrationNumber: z.string().max(255).optional(),
  registrationDate: z.coerce.date().optional(),
  firstInstallmentDate: z.coerce.date().optional(),
  finalInstallmentDueDate: z.coerce.date().optional(),
  branchId: z.coerce.bigint().optional(),
  salesPersonId: z.coerce.bigint().optional(),
  noOfInstallmentsPaid: z.coerce.number().int().min(0).default(0).optional(),
  totalPaidAmount: z.coerce.number().min(0).default(0).optional(),
  totalFixedWeight: z.coerce.number().min(0).optional(),
  bonusWeightFixed: z.coerce.number().min(0).optional(),
  financialYear: z.coerce.bigint().optional(),
  isCancelled: z.coerce.boolean().default(false).optional(),
  totalBonus: z.coerce.number().min(0).default(0).optional(),
  openingAmount: z.coerce.number().optional(),
  openingWeight: z.coerce.number().optional(),
  redeemedOn: z.coerce.date().optional(),
  karatId: z.coerce.bigint().optional(),
  redeemedPosInvoiceId: z.coerce.bigint().optional(),
  status: z.enum(["ACTIVE", "MATURED", "REDEEMED", "CANCELLED"]).default("ACTIVE").optional(),
});

export const updateRegistrationSchema = createRegistrationSchema.partial();

export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>;
export type UpdateRegistrationInput = z.infer<typeof updateRegistrationSchema>;
