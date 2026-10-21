import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionCustomerId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import NavTabs from "@/components/NavTabs";
import ThemeToggle from "@/components/ThemeToggle";
import Logo from "@/components/Logo";
import UserMenu from "@/components/UserMenu";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const customerId = getSessionCustomerId();
  if (!customerId) redirect("/login");

  const customer = await prisma.posCustomer.findFirst({
    where: { id: BigInt(customerId), isDeleted: false },
  });
  if (!customer) redirect("/login");

  const initials = (customer.name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-sand-50 dark:bg-surface">
      {/* Very quiet background accents behind the whole app — echoes the
          login page's depth treatment without competing with content. */}
      <div className="pointer-events-none fixed -left-40 -top-40 h-96 w-96 rounded-full bg-brand-50 blur-3xl dark:bg-brand-800/[0.07]" />
      <div className="pointer-events-none fixed -bottom-40 -right-32 h-96 w-96 rounded-full bg-gold-50/70 blur-3xl dark:bg-gold-600/[0.05]" />

      <header className="sticky top-0 z-20 border-b border-ink-100 bg-sand-50/95 backdrop-blur dark:border-surface-border dark:bg-surface/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4 md:gap-8">
            <Link href="/overview" className="flex shrink-0 items-center">
              <Logo height={46} />
            </Link>
            <NavTabs />
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            <UserMenu name={customer.name ?? "Account"} initials={initials || "U"} />
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>

      <footer className="relative border-t border-ink-100 py-6 dark:border-surface-border">
        <p className="mx-auto max-w-6xl px-4 text-left text-xs text-ink-300 dark:text-ink-500 sm:px-6">
          Designed &amp; Developed By <span className="font-semibold text-brand-500">Team Torcap</span>
          {" "}•{" "}
          Powered By <span className="font-semibold text-brand-500">SIT Systems, Saudi Arabia</span>
        </p>
      </footer>
    </div>
  );
}
