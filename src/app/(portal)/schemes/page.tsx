import { prisma } from "@/lib/prisma";
import { getSessionCustomerId } from "@/lib/session";
import SchemeCard from "@/components/SchemeCard";
import EmptyState from "@/components/EmptyState";
import { deriveSchemeStatus } from "@/lib/scheme-status";

export const dynamic = "force-dynamic";

export default async function SchemesPage() {
  const customerId = BigInt(getSessionCustomerId()!);

  const registrations = await prisma.schemeCustomerRegistration.findMany({
    where: { customerId, isDeleted: false },
    include: { scheme: true, branch: { include: { currency: true } } },
    orderBy: [{ status: "asc" }, { registrationDate: "desc" }],
  });

  const counts = { ACTIVE: 0, MATURED: 0, REDEEMED: 0, CANCELLED: 0 } as Record<string, number>;
  for (const r of registrations) counts[deriveSchemeStatus(r)] = (counts[deriveSchemeStatus(r)] ?? 0) + 1;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 p-6 text-white shadow-card sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-gold-400/20" />
        <div className="relative">
          <h1 className="font-display text-3xl font-semibold">My Schemes</h1>
          <p className="mt-1 text-sm text-white/80">
            Tap A Scheme To See Its Full Installment Schedule And Maturity Details.
          </p>
        </div>
        <dl className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Total", registrations.length],
            ["Active", counts.ACTIVE],
            ["Ready To Redeem", counts.MATURED],
            ["Redeemed", counts.REDEEMED],
          ].map(([label, n]) => (
            <div key={String(label)} className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-white/70">{label}</dt>
              <dd className="mt-1 text-2xl font-semibold">{n}</dd>
            </div>
          ))}
        </dl>
      </section>

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
