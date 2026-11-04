import { prisma } from "@/lib/prisma";
import { getSessionCustomerId } from "@/lib/session";
import ProfileForm from "@/components/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const customerId = BigInt(getSessionCustomerId()!);

  // A missing/renamed lookup table must never break the whole profile page —
  // that dropdown just comes back empty.
  const safe = async <T,>(q: Promise<T[]>): Promise<T[]> => {
    try {
      return await q;
    } catch {
      return [];
    }
  };
  const attr = (type: string) =>
    safe(
      prisma.specialAttribute.findMany({ where: { masterType: type }, orderBy: { name: "asc" } })
    );

  const [customer, countries, divisions, karats, genders, maritalStatuses, relationships, styles, branches, familyMembers, company, customerTypes, customerGrades, personas, leadSources] =
    await Promise.all([
    prisma.posCustomer.findFirstOrThrow({
      where: { id: customerId, isDeleted: false },
      include: { state: true, city: true, country: true, nationality: true, documentIssuingCountry: true },
    }),
    prisma.country.findMany({ where: { isDeleted: false }, orderBy: { name: "asc" } }),
    safe(prisma.division.findMany({ orderBy: { name: "asc" } })),
    safe(prisma.karat.findMany({ orderBy: { name: "asc" } })),
    safe(prisma.gender.findMany({ orderBy: { name: "asc" } })),
    attr("MARITAL_STATUS"),
    attr("RELATIONSHIP"),
    attr("JEWELLERY_STYLE"),
    safe(prisma.branch.findMany({ orderBy: { name: "asc" } })),
    safe(
      prisma.posCustomerFamilyMember.findMany({
        where: { posCustomerId: customerId, isDeleted: false },
        orderBy: { memberOrder: "asc" },
      })
    ),
    prisma.company.findFirst({ where: { isDeleted: false } }).catch(() => null),
    attr("RETAIL_CUSTOMER_TYPE"),
    attr("CUSTOMER_GRADE"),
    attr("PERSONA"),
    attr("LEAD_SOURCE"),
  ]);
  const opt = (r: { id: bigint; name: string | null }) => ({ id: r.id.toString(), name: r.name ?? "" });
  const dstr = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

  // States/cities are loaded client-side as cascading dropdowns (see
  // ProfileForm), but if the customer already has a state/city on file we
  // need that state's own list preloaded so the current selection has
  // something to match against on first render.
  const initialStates = customer.countryId
    ? await prisma.state.findMany({
        where: { countryId: customer.countryId, isDeleted: false },
        orderBy: { name: "asc" },
      })
    : [];
  const initialCities = customer.stateId
    ? await prisma.city.findMany({
        where: { stateId: customer.stateId, isDeleted: false },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 p-6 text-white shadow-card sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-gold-400/20" />
        <div className="relative flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/20 text-2xl font-semibold ring-2 ring-white/40">
            {(customer.name ?? "?").trim().charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70">My Profile</p>
            <h1 className="font-display truncate text-3xl font-semibold">{customer.name ?? "Profile"}</h1>
            <p className="mt-0.5 text-sm text-white/80">
              {[customer.code, customer.mobile].filter(Boolean).join(" · ") || "View And Update Your Account Details."}
            </p>
          </div>
        </div>
      </section>

      <ProfileForm
        customer={{
          id: customer.id.toString(),
          name: customer.name,
          mobile: customer.mobile,
          whatsappNumber: customer.whatsappNumber,
          email: customer.email,
          idCardType: customer.idCardType,
          idCardNumber: customer.idCardNumber,
          address: customer.address,
          zipcode: customer.zipcode,
          stateId: customer.stateId?.toString() ?? null,
          cityId: customer.cityId?.toString() ?? null,
          countryId: customer.countryId?.toString() ?? null,
          countryCode: customer.countryCode,
          nationalityId: customer.nationalityId?.toString() ?? null,
          dateOfBirth: customer.dateOfBirth ? customer.dateOfBirth.toISOString().slice(0, 10) : null,
          documentIssuingCountryId: customer.documentIssuingCountryId?.toString() ?? null,
          language: customer.language,
          alternateContactNumber: customer.alternateContactNumber,
          contactViaWhatsapp: !!customer.contactViaWhatsapp,
          contactViaSms: !!customer.contactViaSms,
          contactViaCall: !!customer.contactViaCall,
          contactViaEmail: !!customer.contactViaEmail,
          preferredJewelryId: customer.preferredJewelryId?.toString() ?? null,
          preferredKaratId: customer.preferredKaratId?.toString() ?? null,
          preferredStyleId: customer.preferredStyleId?.toString() ?? null,
          ringSize: customer.ringSize,
          bangleSize: customer.bangleSize,
          customerTypeId: customer.customerTypeId?.toString() ?? null,
          customerGradeId: customer.customerGradeId?.toString() ?? null,
          personaId: customer.personaId?.toString() ?? null,
          leadSourceId: customer.leadSourceId?.toString() ?? null,
          totalReferrals: customer.totalReferrals,
          familyMilestone: customer.familyMilestone,
          advocacyScore: customer.advocacyScore,
          consentService: !!customer.consentService,
          consentMarketing: !!customer.consentMarketing,
          preferredBranchId: customer.preferredBranchId?.toString() ?? null,
          goldRateAlert: !!customer.goldRateAlert,
          goldRateAlertMode: customer.goldRateAlertMode,
          weeklyNotificationMail: !!customer.weeklyNotificationMail,
          anniversaryDate: dstr(customer.anniversaryDate),
          spouseName: customer.spouseName,
          genderId: customer.genderId?.toString() ?? null,
          maritalStatusId: customer.maritalStatusId?.toString() ?? null,
        }}
        familyMembers={familyMembers.map((m) => ({
          id: m.id.toString(),
          name: m.name ?? "",
          relationshipId: m.relationshipId?.toString() ?? "",
          dateOfBirth: dstr(m.dateOfBirth),
          anniversaryDate: dstr(m.anniversaryDate),
          mobile: m.mobile ?? "",
          email: m.email ?? "",
        }))}
        lookups={{
          divisions: divisions.map(opt),
          karats: karats.map(opt),
          genders: genders.map(opt),
          maritalStatuses: maritalStatuses.map(opt),
          relationships: relationships.map(opt),
          styles: styles.map(opt),
          customerTypes: customerTypes.map(opt),
          customerGrades: customerGrades.map(opt),
          personas: personas.map(opt),
          leadSources: leadSources.map(opt),
          branches: branches.map((b) => ({ id: b.id.toString(), name: [b.code, b.name].filter(Boolean).join(" | ") })),
        }}
        companyName={company?.name ?? "our company"}
        countries={countries.map((c) => ({ id: c.id.toString(), name: c.name ?? "", countryCode: c.countryCode }))}
        initialStates={initialStates.map((s) => ({ id: s.id.toString(), name: s.name ?? "" }))}
        initialCities={initialCities.map((c) => ({ id: c.id.toString(), name: c.name ?? "" }))}
      />
    </div>
  );
}
