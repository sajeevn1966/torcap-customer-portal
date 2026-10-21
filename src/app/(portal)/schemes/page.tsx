import { prisma } from "@/lib/prisma";
import { getSessionCustomerId } from "@/lib/session";
import SchemeCard from "@/components/SchemeCard";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function SchemesPage() {
  const customerId = BigInt(getSessionCustomerId()!);

  const registrations = await prisma.schemeCustomerRegistration.findMany({
    where: { customerId, isDeleted: false },
    include: { scheme: true, branch: { include: { currency: true } } },
    orderBy: [{ status: "asc" }, { registrationDate: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-ink-100">My Schemes</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">
          Tap A Scheme To See Its Full Installment Schedule And Maturity Details.
        </p>
      </div>

      {registrations.length === 0 ? (
        <EmptyState
          message="You Aren't Registered On Any Schemes Yet. Visit A Branch To Get Started."
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="M12 7.5v5l3.5 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {registrations.map((registration) => (
            <SchemeCard key={registration.id.toString()} registration={registration} />
          ))}
        </div>
      )}
    </div>
  );
}
