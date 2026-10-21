import { z } from "zod";

export const createCustomerSchema = z.object({
  code: z.string().max(255).optional(),
  name: z.string().min(1, "Name is required").max(255),
  mobile: z.string().min(5, "Mobile number is too short").max(255),
  email: z.string().email().max(255).optional().or(z.literal("")).optional(),
  idCardType: z.string().max(255).optional(),
  idCardNumber: z.string().max(255).optional(),
  address: z.string().max(255).optional(),
  zipcode: z.string().max(255).optional(),
  stateId: z.coerce.bigint().optional(),
  cityId: z.coerce.bigint().optional(),
  branchId: z.coerce.bigint().optional(),
  countryId: z.coerce.bigint().optional(),
  countryCode: z.string().max(10).optional(),
  vatNumber: z.string().max(255).optional(),
  nationalityId: z.coerce.bigint().optional(),
  externalReferenceId: z.coerce.number().int().optional(),
  dateOfBirth: z.coerce.date().optional(),
  documentIssuingCountryId: z.coerce.bigint().optional(),
  language: z.string().max(255).default("en").optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
