import { NextRequest, NextResponse } from "next/server";

// The generic CRUD endpoints below (customers, receipts, schemes,
// registrations) have no login check — they were built as a back-office
// API and are NOT used by the customer portal screens. Left open on the
// internet they would let anyone list or change customer data, so they are
// switched off unless ENABLE_ADMIN_API=true is set explicitly (e.g. on a
// private network only).
export function middleware(req: NextRequest) {
  if (process.env.ENABLE_ADMIN_API === "true") return NextResponse.next();
  return NextResponse.json(
    { success: false, error: "Not found." },
    { status: 404 }
  );
}

export const config = {
  matcher: [
    "/api/customers/:path*",
    "/api/receipts/:path*",
    "/api/schemes/:path*",
    "/api/registrations/:path*",
  ],
};
