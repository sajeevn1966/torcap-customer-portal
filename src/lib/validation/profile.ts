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

  alternateContactNumber: z.string().max(255).optional().or(z.literal("")),
  contactViaWhatsapp: z.boolean().optional(),
  contactViaSms: z.boolean().optional(),
  contactViaCall: z.boolean().optional(),
  contactViaEmail: z.boolean().optional(),
  preferredJewelryId: z.coerce.bigint().optional().nullable(),
  preferredKaratId: z.coerce.bigint().optional().nullable(),
  preferredStyleId: z.coerce.bigint().optional().nullable(),
  ringSize: z.coerce.number().positive().optional().nullable(),
  bangleSize: z.coerce.number().positive().optional().nullable(),
  customerTypeId: z.coerce.bigint().optional().nullable(),
  customerGradeId: z.coerce.bigint().optional().nullable(),
  personaId: z.coerce.bigint().optional().nullable(),
  leadSourceId: z.coerce.bigint().optional().nullable(),
  consentService: z.boolean().optional(),
  consentMarketing: z.boolean().optional(),
  preferredBranchId: z.coerce.bigint().optional().nullable(),
  goldRateAlert: z.boolean().optional(),
  goldRateAlertMode: z.enum(["SMS", "WHATSAPP", "EMAIL"]).optional().nullable().or(z.literal("")),
  weeklyNotificationMail: z.boolean().optional(),
  anniversaryDate: z.coerce.date().optional().nullable(),
  spouseName: z.string().max(255).optional().or(z.literal("")),
  genderId: z.coerce.bigint().optional().nullable(),
  maritalStatusId: z.coerce.bigint().optional().nullable(),

  familyMembers: z
    .array(
      z.object({
        id: z.coerce.bigint().optional().nullable(),
        name: z.string().max(255).optional().or(z.literal("")),
        relationshipId: z.coerce.bigint().optional().nullable(),
        dateOfBirth: z.coerce.date().optional().nullable(),
        anniversaryDate: z.coerce.date().optional().nullable(),
        mobile: z.string().max(255).optional().or(z.literal("")),
        email: z.string().email().max(255).optional().or(z.literal("")),
      })
    )
    .max(6)
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
