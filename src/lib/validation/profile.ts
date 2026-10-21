import { z } from "zod";

/**
 * Fields the customer is allowed to edit on their own profile.
 * `name` and `mobile` are intentionally NOT included here — those stay
 * view-only per the product requirement, and the API route enforces this
 * again server-side (never trusts the client to simply omit them).
 */
export const updateProfileSchema = z.object({
  whatsappNumber: z.string().max(255).optional().or(z.literal("")),
  email: z.string().email().max(255).optional().or(z.literal("")),
  idCardType: z.string().max(255).optional().or(z.literal("")),
  idCardNumber: z.string().max(255).optional().or(z.literal("")),
  address: z.string().max(255).optional().or(z.literal("")),
  zipcode: z.string().max(255).optional().or(z.literal("")),
  stateId: z.coerce.bigint().optional().nullable(),
  cityId: z.coerce.bigint().optional().nullable(),
  countryId: z.coerce.bigint().optional().nullable(),
  nationalityId: z.coerce.bigint().optional().nullable(),
  documentIssuingCountryId: z.coerce.bigint().optional().nullable(),
  dateOfBirth: z.coerce.date().optional().nullable(),
  language: z.string().max(255).optional().or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
