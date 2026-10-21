import { prisma } from "@/lib/prisma";
import { getSessionCustomerId } from "@/lib/session";
import ProfileForm from "@/components/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const customerId = BigInt(getSessionCustomerId()!);

  const [customer, countries] = await Promise.all([
    prisma.posCustomer.findFirstOrThrow({
      where: { id: customerId, isDeleted: false },
      include: { state: true, city: true, country: true, nationality: true, documentIssuingCountry: true },
    }),
    prisma.country.findMany({ where: { isDeleted: false }, orderBy: { name: "asc" } }),
  ]);

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
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-ink-100">Profile</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">
          View And Update Your Account Details.
        </p>
      </div>

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
        }}
        countries={countries.map((c) => ({ id: c.id.toString(), name: c.name ?? "", countryCode: c.countryCode }))}
        initialStates={initialStates.map((s) => ({ id: s.id.toString(), name: s.name ?? "" }))}
        initialCities={initialCities.map((c) => ({ id: c.id.toString(), name: c.name ?? "" }))}
      />
    </div>
  );
}
