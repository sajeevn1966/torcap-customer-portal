import { prisma } from "@/lib/prisma";
import LoginForm from "./LoginForm";

// Read on every request (never prerendered at build time): the labels on the
// form depend on the live Company setting `whatsapp_integration_enabled`.
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  let whatsappEnabled = true;
  try {
    const company = await prisma.company.findFirst({ where: { isDeleted: false } });
    // Same rule as /api/auth/lookup: no company row counts as "off".
    whatsappEnabled = company?.whatsappIntegrationEnabled ?? false;
  } catch {
    // Database unreachable: show the default (WhatsApp) wording; the sign-in
    // request itself will report the real problem.
  }
  return <LoginForm whatsappEnabled={whatsappEnabled} />;
}
