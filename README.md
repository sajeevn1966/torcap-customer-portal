# TORCAP Scheme Portal

A Next.js (App Router) customer portal for the TORCAP Scheme module, backed
by your existing PostgreSQL database through Prisma ORM. No mock data — every
page reads through server-side API routes / server components straight from
Postgres.

## 1. What this connects to

This project targets tables that already exist in your TORCAP database
(introspected from `amtur_16082026.sql`), grouped by what they're for:

**Scheme module (core):**

| Table                            | Purpose                                   |
|-----------------------------------|--------------------------------------------|
| `pos_customer`                    | Customer master                            |
| `scheme`                          | Scheme master (plan definitions)           |
| `scheme_customer_registration`    | A customer's enrollment in a scheme        |
| `scheme_receipt`                  | An installment receipt (voucher)           |
| `scheme_receipt_line_item`        | Which registration/scheme a receipt pays   |
| `scheme_receipt_payment_detail`   | Cash/card/bank split for a receipt         |

**Shared/supporting:**

| Table        | Purpose                                                    |
|---------------|--------------------------------------------------------------|
| `branch`      | Store branch — has `currency_id`                             |
| `currency`    | Currency master — `code` (e.g. `SAR`), `symbol`               |
| `item`        | Product master — only read for `main_division`/`division` (Diamond/Gold/Silver classification) and `description` |

**Transactions page — Retail Sale tab:**

| Table                          | Purpose                                  |
|----------------------------------|---------------------------------------------|
| `pos_invoice`                    | A retail sale invoice                       |
| `pos_invoice_line_item`          | Line items on that invoice (product, weight, amount) |
| `pos_invoice_payment_detail`     | Cash/card/bank split (modeled, not yet shown in UI) |

**Transactions page — Old Gold Purchase (OJP) tab:**

| Table                                     | Purpose                             |
|----------------------------------------------|------------------------------------------|
| `old_jewellery_purchase`                      | An old-gold purchase voucher              |
| `old_jewellery_purchase_line_item`            | Line items (modeled, not yet shown in UI) |
| `old_jewellery_purchase_payment_detail`       | Payment split (modeled, not yet shown in UI) |

**Transactions page — Sales Order tab:**

Confirmed as a genuinely distinct table from `pos_invoice` (Retail Sale) —
`retail_sales_order_invoice` is a join table linking an order to the
`pos_invoice` eventually raised against it, i.e. Sales Order is the
pre-invoice order stage.

| Table                                    | Purpose                                    |
|---------------------------------------------|--------------------------------------------|
| `retail_sales_order`                         | A sales order header                        |
| `retail_sales_order_invoice`                 | Join to the `pos_invoice` it was billed through (modeled, not yet shown in UI) |
| `retail_sales_order_line_item`               | Line items — reuses the same Diamond/Gold/Silver classification as Retail Sale |
| `retail_sales_order_payment_detail`          | Payment split (modeled, not yet shown in UI) |

**Transactions page — Advance Receipt tab:**

| Table                                    | Purpose                                    |
|---------------------------------------------|--------------------------------------------|
| `advance_receipt`                            | An advance payment receipt                  |
| `advance_receipt_payment_details`            | Payment split (modeled, not yet shown in UI) |
| `advance_receipt_transaction`                | Debit/credit ledger lines, e.g. applying the advance against a later invoice (modeled, not yet shown in UI) |

`prisma/schema.prisma` was hand-authored to match these tables exactly
(column names, types, defaults, nullability) as a starting point — **you
should still run introspection against your real database before trusting
it**, per the workflow below. Only the columns this app actually reads are
modeled for each table — run `db pull` if you need the rest of their
columns too.

## 2. Setup

```bash
npm install
cp .env.example .env
# edit .env and set DATABASE_URL to your real TORCAP Postgres connection string
```

### Recommended: introspect the real database instead of trusting this schema blindly

```
Existing TORCAP PostgreSQL
        ↓
  npx prisma db pull        (introspection — reads your live schema)
        ↓
  prisma/schema.prisma      (regenerated to match the database exactly)
        ↓
  npx prisma generate       (builds the typed client)
        ↓
  npm run dev                (Next.js API + UI)
```

Run:

```bash
npx prisma db pull
npx prisma generate
```

`db pull` will overwrite `prisma/schema.prisma` with what your database
actually contains — including every other table in the dump (branch, item,
pos_invoice, etc.), not just the six Scheme-module ones. That's expected. Diff
the six Scheme models against what's here; they should match. If your live
schema has since drifted (extra columns, renamed constraints), the pulled
version wins — update the models in this repo (and the corresponding Zod
schemas / components, if a field you rely on changed).

**Do not run `prisma migrate dev` against this database.** Migrate is for
schemas Prisma owns end-to-end; this one already exists and is presumably
shared with a POS/back-office system. Schema changes should go through
reviewed, hand-written SQL migrations instead.

```bash
npm run dev
```

## 3. Environment variables

`DATABASE_URL` is read only in `src/lib/prisma.ts`, which is marked
`import "server-only"` — Next.js will fail the build if any client component
ever imports it. It is never included in `next.config.mjs`'s public env, and
never sent to the browser.

## 4. API routes

All routes return `{ success: true, data }` or
`{ success: false, error: { code, message, details? } }`. BigInt columns
(all primary/foreign keys) are serialized to strings in JSON responses.

| Method | Path                                   | Notes                                              |
|--------|------------------------------------------|-----------------------------------------------------|
| GET    | `/api/customers`                          | `?search=&page=&pageSize=`                          |
| POST   | `/api/customers`                          | Create customer                                     |
| GET    | `/api/customers/:id`                        | Includes registrations + recent receipts             |
| PATCH  | `/api/customers/:id`                        | Partial update                                       |
| DELETE | `/api/customers/:id`                        | Soft delete (`is_deleted = true`)                    |
| GET    | `/api/schemes`                             | `?activeOnly=true`                                   |
| POST   | `/api/schemes`                             | Create scheme                                        |
| GET/PATCH/DELETE | `/api/schemes/:id`                | Same pattern as customers                             |
| GET    | `/api/registrations`                       | `?customerId=&schemeId=&status=`                      |
| POST   | `/api/registrations`                       | Validates customerId/schemeId exist first             |
| GET/PATCH/DELETE | `/api/registrations/:id`          | Includes scheme + line items                          |
| GET    | `/api/receipts`                            | `?customerId=&branchId=&from=&to=`                    |
| POST   | `/api/receipts`                            | Accepts nested `lineItems[]` / `paymentDetails[]`, written in one DB transaction |
| GET/PATCH/DELETE | `/api/receipts/:id`               | Includes line items + payment details                 |
| GET/POST | `/api/receipts/:id/line-items`          | Add an installment line to an existing receipt         |
| GET/POST | `/api/receipts/:id/payments`            | Add a payment split to an existing receipt              |
| POST   | `/api/auth/lookup`                         | Looks up customer by mobile — **placeholder, see below** |
| POST   | `/api/auth/logout`                         | Clears the session cookie                              |

Error handling (`src/lib/api-response.ts`) maps:
- Zod validation errors → `422 VALIDATION_ERROR`
- Prisma unique constraint (`P2002`) → `409 UNIQUE_CONSTRAINT_VIOLATION`
- Prisma FK violation (`P2003`) → `409 FOREIGN_KEY_VIOLATION`
- Prisma "not found" (`P2025`) → `404 NOT_FOUND`
- DB unreachable / bad `DATABASE_URL` → `503 DATABASE_UNAVAILABLE`
- Anything else → `500 INTERNAL_ERROR` (logged server-side, never leaks raw DB errors to the client)

## 5. Login — two-factor lookup + real WhatsApp OTP

Login is now a two-step flow:

**Step 1 — `/api/auth/lookup` (`src/app/api/auth/lookup/route.ts`)**
1. Finds the `pos_customer` row whose `email` OR `id_card_number` matches
   what was typed into the "Email Or ID Number" field.
2. Checks that the "Registered Mobile Number" field matches the `mobile`
   on **that same customer record** (not just any customer in the table).
3. Checks `whatsapp_integration_enabled` on the `company` table (read live
   via `prisma.company.findFirst()` — not cached, not an env var) to decide
   what happens next:
   - **`true` (normal case):** generates a 6-digit code and sends it to
     that customer's `whatsapp_number` via the WhatsApp Business API, using
     their Template Messages API (a template with one variable for the
     code — see the template-name note below). **The send credentials
     (provider URL, username, password, sender number, priority, timeout)
     are also read live from `company`** (`src/lib/whatsapp.ts`) — the
     exact same settings TORCAP's main ERP already uses for its own
     scheme-action WhatsApp OTPs (`scheme_registration_otp_required` etc.),
     so there's nothing to duplicate or keep in sync in `.env`. Response:
     `{ otpRequired: true, whatsappMasked }` — the login page then shows
     Step 2 below.
   - **`false` (WhatsApp switched off company-wide):** login completes
     immediately on the Step 1/2 match alone, **without** requiring a
     WhatsApp code — this is the fallback for when WhatsApp sign-in is
     intentionally turned off, so customers aren't locked out entirely.
     The session is set right here. Response:
     `{ otpRequired: false, id, name }` — the login page skips Step 2 and
     goes straight to the portal.
4. When WhatsApp is on, the generated code is stored in a short-lived,
   HMAC-signed cookie (`src/lib/otp.ts`) keyed to that customer id — **not**
   a plain cookie, so it can't be edited in dev tools to skip the code
   check or log in as someone else. It expires after 5 minutes and locks
   out after 5 wrong attempts. The login page shows a live mm:ss countdown
   (driven by `expiresInSeconds` from the server), disables Verify when it
   hits 00:00, and highlights "Resend Code".

**Step 2 (only when WhatsApp is on) — `/api/auth/verify-otp`
(`src/app/api/auth/verify-otp/route.ts`)**
Checks the typed code against that signed cookie. Only on a correct match
does it set the real session cookie (`src/lib/session.ts`) and log the
customer in.

Mobile-number comparison (Step 1.2) is done on the last 9 digits (via
`last9Digits()`) so formatting differences across branches/systems
(`0501234567` vs `501234567` vs `+966501234567`) don't block a real match.
The WhatsApp number (Step 1.3) is normalized to `966XXXXXXXXX` the same way
in `src/lib/whatsapp.ts`.

**Required `.env` values** (see `.env.example`): just `SESSION_SECRET` (any
random 32+ character string, signs the temporary OTP cookie) and
`WHATSAPP_OTP_TEMPLATE_NAME`.

**Template name — needs your confirmation.** The `company` table has
columns for a POS-invoice template and a scheme-receipt template, but none
for a *login* template specifically. `WHATSAPP_OTP_TEMPLATE_NAME` currently
defaults to `"otp"` (the provider's own documented example name) — replace
it in `.env` with whatever template TORCAP's existing scheme-action OTPs
actually use once you confirm that, so login sends through the same
already-approved template rather than possibly an unapproved/nonexistent
one.

**Session:** after login, `src/lib/session.ts` issues a signed cookie
(`torcap_session` = `customerId.expiresAt.HMAC`), httpOnly, `secure` in
production, 8-hour expiry. A tampered or expired cookie is treated as logged
out. `SESSION_SECRET` (32+ chars) is required; changing it logs everyone out.
Add rate limiting in front of `/api/auth/` (see DEPLOYMENT-GUIDE.html).

## 6. Currency is dynamic, not hardcoded

Every amount in the UI is labeled with the currency of the branch (or
payment) it actually belongs to — never a fixed "SR"/"SAR" string:

- `formatCurrency(value, currencyCode)` in `src/lib/format.ts` takes no
  default currency; if you don't pass a code, it renders the bare number.
- Registration and scheme amounts use `registration.branch.currency.code`.
- Receipt totals use `receipt.branch.currency.code`.
- Individual payment-detail lines use `paymentDetail.currency.code` first
  (a single receipt can be paid in a different currency than its branch —
  the `scheme_receipt_payment_detail` table has its own `currency_id`),
  falling back to the receipt's branch currency if that payment row has none.
- The Overview page's "Total paid in" is an aggregate across every
  registration, which could in theory span branches with different
  currencies. It's currently labeled with the customer's *home branch*
  currency (`pos_customer.branch_id`) as a pragmatic default for the common
  single-store case. If your customers routinely transact across
  branches with different currencies, split that stat out per currency
  instead of summing across them.

If a branch or currency record is missing/null for some row, the amount
still renders — just without a currency label — rather than silently
falling back to a guessed currency.

## 7. Transactions page — three tabs, one page

`src/app/(portal)/transactions/page.tsx` queries all three sources
(Scheme receipts, retail invoices, OJP purchases) up front and hands them to
`src/components/TransactionsTabs.tsx`, a client component that switches
between them with no extra navigation/reload.

- **Scheme** — unchanged from before: one row per installment receipt.
- **Retail Sale** — one row **per line item**, not per invoice, since a
  single invoice can mix diamond, gold, and silver pieces that each need
  their own material + weight shown. Columns: invoice number, invoice date,
  product name, material, weight, amount.
- **Old Gold Purchase (OJP)** — one row per purchase voucher (header-level
  `net_weight`/`grand_total` was enough for the requested columns, so line
  items aren't queried for this tab). Columns: invoice number, date,
  weight, amount.

**How "Diamond / Gold / Silver — which one only" is decided**
(`src/lib/material.ts`): confirmed against the real `item` table data —
`item.main_division` holds `"DIAMOND"` for diamond-set pieces;
`item.division` holds `"GOLD"` or `"SILVER"` for plain metal items
(`stone_type_id` was unused/null across the sample data, so
`main_division` is the reliable diamond signal, not `stone_type_id`).
`classifyMaterial()` picks exactly one label per line item; `materialWeight()`
then picks the matching weight field (`stoneWeight` for Diamond,
`netWeight`/`weight` for Gold or Silver).

**Not yet wired into the UI, but modeled and ready:**
`pos_invoice_payment_detail` and `old_jewellery_purchase_line_item` /
`old_jewellery_purchase_payment_detail` — the requested columns for Retail
Sale and OJP didn't need these, but the Prisma models exist if you want to
add a payment-method breakdown or an OJP line-item drill-down later, the
same way `SchemeReceiptPaymentDetail` is already used on the Scheme tab.

## 8. UI

- **Brand**: Sona Gold & Diamonds (`Sona_Guideline.pdf`) — a real client brand
  system, not a placeholder palette.
- Font: **Nunito Sans** for body text everywhere (`src/app/layout.tsx`,
  loaded via `next/font/google`) — the guideline's official secondary/body
  typeface. Headings (`font-display` Tailwind class — every `h1`/`h2` in
  the app) use **Playfair Display**, a free Google Fonts stand-in for the
  guideline's primary typeface, **GT Super Ds Trial**. GT Super itself is
  intentionally NOT wired in: it's a Grilli Type trial font licensed only
  for mockups/testing, not production use — using it live would violate
  Grilli Type's license. If you later buy the full **GT Super** license
  from Grilli Type, send the licensed files and this can be swapped to
  `next/font/local` in `src/app/layout.tsx` + `tailwind.config.ts`'s
  `fontFamily.display`, replacing Playfair Display in both places.
- Palette (`tailwind.config.ts`): three custom color scales built from the
  guideline's exact hex values —
  - `brand.*` — Heritage Green (`brand.500 = #096340`, the guideline's
    primary color)
  - `sand.*` — Eternal Sand (`sand.100 = #F5F1EC`, the guideline's
    secondary color; used as the app's page background instead of stark
    white — `sand.50 = #FFFAF3` on `<body>`)
  - `gold.*` — Golden Glow (`gold.400 = #C39A6B`, the guideline's accent
    color; used sparingly for status badges/icons — e.g. the "Gold"
    material tag, the "MATURED" scheme badge, Retail Sale's icon tone —
    matching the guideline's own 10–20% usage note for the accent)
  Anywhere the app previously used generic Tailwind `amber-*` as a
  stand-in accent has been swapped to the real `gold-*` scale.
- Pages: `/login`, `/overview`, `/schemes`, `/schemes/[id]`, `/transactions`,
  `/notifications` — mirroring the "Portal Contents" structure from the
  mockup (Login → Overview → My Schemes → Transactions → Notifications).
  An Invoices page wasn't built yet since no invoice table was in scope of
  the six tables you listed — `pos_invoice` exists in the dump and could be
  wired in the same way if you want that page too.

## 9. Text input convention — capitalize-as-you-type

App-wide default: any new free-text field (customer name, item description,
remarks, etc.) should use `src/components/TextInput.tsx` instead of a raw
`<input>`. It automatically capitalizes the first letter of each word as
the person types — `"mohammed hassan"` becomes `"Mohammed Hassan"` — on
both desktop typing and mobile virtual keyboards.

```tsx
import { useState } from "react";
import TextInput from "@/components/TextInput";

const [name, setName] = useState("");
<TextInput value={name} onChange={setName} placeholder="Full name" />
```

`onChange` here receives the already-capitalized string directly (not a
change event), so no extra transform is needed in the calling form.

**Don't use this for:** mobile numbers, emails, codes, or IDs — anywhere
word-capitalization doesn't make sense. Keep those as plain `<input>` with
the right `type` (`tel`, `email`, etc.), the way the login page's mobile
field already does.

The current app has no free-text fields yet (only the login page's numeric
mobile field), so there's nothing visibly different yet — this is set up
for whenever a name/search/remarks field gets added next.

## 10. Profile page — view/edit own account details

New page at `/profile`, linked from the header's user menu (name/avatar
dropdown → **Profile**). Server component (`src/app/(portal)/profile/page.tsx`)
fetches the customer's own record plus the full countries list up front;
`src/components/ProfileForm.tsx` (client component) handles editing.

**View-only, per requirement:** `name` and `mobile` are shown but disabled
in the form. This is enforced in two places, not just the UI — the API
route's Zod schema (`src/lib/validation/profile.ts`) doesn't even declare
those fields, so they're silently stripped from any request body before it
ever reaches the database write, regardless of what the client sends.

**Editable fields:** WhatsApp number, email, ID type (Passport / Iqama /
Resident ID / Emirates ID, with the customer's existing value auto-added
to the list if it doesn't match one of those four), ID number, address,
zipcode, Country / Province / City (cascading — picking a Country loads
its Provinces via `/api/lookups/states`, picking a Province loads its
Cities via `/api/lookups/cities`), Nationality, Document Issuing Country,
date of birth, language.

**Country Code is derived, not editable:** the form shows a disabled field
that updates live from the selected Country's `country_code` — matching
"selected country code automatically comes from country table
country_code". The server independently re-derives and stores this on
save too (`src/app/api/profile/route.ts`), never trusting a client-sent
value for it.

**Security note:** `/api/profile` has no `:id` in its route — the customer
id always comes from the session cookie, never from the request, so
there's no way to view or edit another customer's profile by guessing an
id in the URL.

**⚠️ Unverified column — action needed:** `whatsapp_number` on
`pos_customer` was requested but isn't present in the reference dump
(`amtur_16082026.sql`) I built the schema from — it may have been added to
your live `sit_sonasa2` database since. Before relying on this field,
confirm the exact column name:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'pos_customer' AND column_name ILIKE '%whatsapp%';
```
If it's named differently (or doesn't exist yet), update the `@map(...)`
on `PosCustomer.whatsappNumber` in `prisma/schema.prisma` to match.

## 11. Project structure

```
prisma/schema.prisma            Data model (introspect-first, see §2)
src/lib/prisma.ts                Server-only Prisma client singleton
src/lib/api-response.ts          ok()/created()/handleApiError() envelope + BigInt-safe JSON
src/lib/params.ts                Route param → BigInt parsing
src/lib/session.ts                Placeholder cookie session (see §5)
src/lib/validation/*.ts           Zod schemas per entity (incl. profile.ts)
src/lib/scheme-status.ts          Derives real scheme lifecycle state (paid vs total, redeemed, cancelled)
src/lib/material.ts               Classifies a line item as Diamond/Gold/Silver (see §7)
src/lib/text.ts                   capitalizeWords() — used by TextInput
src/components/TextInput.tsx      Default free-text input, auto-capitalizes (see §9)
src/app/api/profile/route.ts       GET/PATCH own profile (session-scoped, see §10)
src/app/api/lookups/**/route.ts    Countries/states/cities for profile dropdowns
src/app/(portal)/profile/page.tsx   Profile page
src/components/ProfileForm.tsx      Profile edit form, cascading Country→Province→City
src/app/api/**/route.ts            REST API routes (CRUD)
src/app/login/page.tsx             Login UI
src/app/(portal)/layout.tsx         Authenticated shell (nav, user menu)
src/app/(portal)/overview/page.tsx   Dashboard
src/app/(portal)/schemes/**            My Schemes list + detail
src/app/(portal)/transactions/page.tsx Transactions data fetching (all 3 sources)
src/components/TransactionsTabs.tsx    Scheme / Retail Sale / OJP tab switcher
src/app/(portal)/notifications/page.tsx Computed due-date / maturity alerts
src/components/*.tsx                Shared UI (nav, cards, progress ring)
```

## 7. Deployment

See the `deploy/` folder: DEPLOYMENT-GUIDE.html, GITHUB-GUIDE.html, MULTI-CLIENT-GUIDE.html, example PM2 and Nginx files, and `update.sh`.
