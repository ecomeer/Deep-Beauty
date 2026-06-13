# Deep Beauty — Code, Flow & Performance Review (June 2026)

Scope: full-project sanity review of the storefront, admin dashboard, API
layer and Supabase backend on `main` (commit `f43fc76`), focused on
correctness, flow integrity, performance, and dead code. This is a read-only
audit — no source files were changed. PR #27 (open, draft) is a separate UI
redesign and is referenced where relevant but not assumed to be merged.

`npm run build` and `npm run lint` were both executed against a fresh
`npm install`.

---

## 1. Architecture overview

- **Stack**: Next.js 16.2.2 (Turbopack), React 19, TypeScript, Tailwind 4,
  Supabase (Postgres + Auth), Framer Motion, Recharts (admin charts).
- **Routing**: `app/(store)` — 33 storefront routes (home, products, cart,
  checkout, account, orders, wishlist, auth). `app/(admin)` — 22 admin routes
  (dashboard, products, orders, customers, marketing, settings). 62 API routes
  under `app/api/**`.
- **Data layer / Supabase clients** — five different client-creation patterns:
  - `lib/supabase-admin.ts` — lazy service-role singleton (server-only, mutations).
  - `lib/supabase-server.ts` — per-request anon-key factory (SSR reads, 5s timeout).
  - `lib/supabase-client.ts` — browser client factory.
  - `lib/supabase.ts` — a **second**, module-level browser singleton + retry helper.
  - `lib/auth-admin.ts` — per-request server client used only for `requireAdmin()`.
- **Auth model**: Supabase Auth + `proxy.ts` middleware guards `/admin/*` via
  session cookie + `ADMIN_EMAILS` allowlist + `app_metadata.role`. API-level
  admin checks go through `requireAdmin()` in `lib/auth-admin.ts`, which
  additionally checks `users.role` and `profiles.role`.
- **RLS**: enabled on public tables (`20250502000002_enable_rls_on_public_tables.sql`,
  `20250502000003_security_hardening.sql`); all writes go through
  `supabaseAdmin` (service role), client-side queries are anon/SELECT-only.

Overall the architecture is sound and the recent "fix" commits (admin auth
loop, checkout/shipping 500s, product column names) have left the code in a
working state — `npm run build` completes cleanly (93/93 pages, TypeScript
clean). The findings below are about specific flows that are incomplete,
risky under load, or carry leftover cruft from the fix cycle.

---

## 2. Sanity / correctness findings (P0)

### P0-1. Online card payment (Tap) creates orders with no items and no address
**File**: `app/api/checkout/verify/route.ts:71-96`

When a customer pays via Tap and is redirected back to `/checkout/verify`,
the route verifies the charge, then **inserts a brand-new `orders` row with
no `order_items` and empty `address_line1`/`address_area`**:

```ts
// Note: full order row creation requires the original cart/address.
// ...
// This minimal implementation creates a placeholder "paid" order.
// Replace with your full order-creation logic when ready.
```

If `TAP_SECRET_KEY` is configured (online payment enabled), every successful
card payment produces an order the admin cannot fulfill (no products, no
delivery address). `create-payment` (the step before) already does the
correct server-side price re-validation but discards the cart/address instead
of persisting it (e.g. a `pending_orders` row keyed by `order_ref`/`charge_id`)
for `verify` to complete later. **This flow is not production-ready as long as
Tap is enabled.**

### P0-2. COD checkout trusts client-supplied totals
**File**: `app/api/checkout/route.ts:28-66`

`/api/checkout` (used for `payment_method: 'cod'` and likely the default
flow) accepts `subtotal`, `shipping_cost`, `total`, `coupon_discount`, and
per-item `unit_price`/`total_price` directly from the request body and writes
them verbatim via `create_order_atomic`. There is **no re-fetch of
`products.price`, no coupon re-validation against `coupons`, and no shipping
recalculation** — contrast with `app/api/checkout/create-payment/route.ts:57-101`,
which does exactly this re-validation with the comment "never trust client
totals".

Impact: a customer can edit their cart in `localStorage`/devtools to submit
an order with a near-zero `total`/`unit_price` while `quantity` (and thus
stock decrement) reflects the real items. Since COD appears to be the
primary/working payment path (Tap is feature-flagged), this is the
highest-impact integrity gap in the order flow.

**Suggested fix shape** (not implemented here): factor the price/coupon/
shipping re-validation in `create-payment/route.ts` into a shared helper
(`lib/order-pricing.ts`) and call it from both `/api/checkout` and
`/api/checkout/create-payment` before building `orderData`/`itemsPayload`.

### P0-3. Two parallel, inconsistent payment integrations
**Files**: `app/api/payment/{initiate,callback,error}/route.ts` (MyFatoorah,
via `lib/payment.ts`) vs `app/api/checkout/{create-payment,verify,webhook}`
(Tap).

Only the Tap routes are referenced from the UI
(`app/(store)/checkout/EnhancedCheckoutPage.tsx`). The `/api/payment/*`
MyFatoorah routes (and `lib/payment.ts`, `MYFATOORAH_*` env vars) appear to be
an earlier, now-unused integration — they redirect to `/order-success` and
`/payment-failed`, which still exist, but nothing calls `/api/payment/initiate`.
Worth confirming with the team and either removing this integration or
documenting it as the "next" payment provider — having two creates confusion
about which one P0-1/P0-2 actually need fixing for.

### P0-4 (minor). `profiles` table lookup may always be a no-op
**File**: `lib/auth-admin.ts:40-43`

`requireAdmin()` runs `supabaseAdmin.from('profiles').select('role')...` on
**every** admin API request. The `profiles` table is only defined in
`supabase/missing-tables.sql` — a manual "run in Supabase dashboard SQL
editor" script, not in `supabase/migrations/`. If that script was never run
against the project's database, this query always errors/returns null and
contributes nothing to the `isAdmin` check, costing one extra round trip per
admin request. Action: confirm `profiles` exists in the live DB; if not,
either run `missing-tables.sql` as a proper migration or drop the
`profilesRoleRes` lookup from `auth-admin.ts`.

---

## 3. Performance findings (P1)

### P1-1. `admin/customers` loads the entire `orders` table per request
**File**: `app/api/admin/customers/route.ts:15-26`

```ts
let query = supabaseAdmin
  .from('orders')
  .select('customer_name, customer_phone, customer_email, total, created_at')
  .order('created_at', { ascending: false })
...
const { data, error } = await query
// then aggregate-by-phone and paginate in memory
```

Every load of the admin "Customers" page fetches **every order row** (5
columns each), then groups/aggregates/sorts/paginates in JS. This is fine at
current data volumes but will degrade linearly with order count and is the
single biggest perf risk in the admin area. Recommend a SQL-side aggregation
(`GROUP BY` on `customer_phone`/`customer_email` with `count(*)`,
`sum(total)`, `max(created_at)`), ideally via a view or RPC, with the
`ilike` search applied before aggregation.

### P1-2. Wildcard `select('*')` across several routes
Columns are unnecessarily wide on:
- `app/api/account/addresses/route.ts:17`
- `app/api/account/notifications/route.ts:17`
- `app/api/orders/[id]/route.ts:16` (`select('*, order_items(*)')`)
- `app/api/admin/marketing/[id]/route.ts:55`
- `app/api/admin/orders/[id]/route.ts:10-12` (three parallel `select('*')`
  on `orders`, `order_items`, `order_tracking`)
- `app/api/admin/products/[id]/route.ts:9`
- `app/api/admin/reviews/route.ts:21`

Individually low-impact, but `admin/orders/[id]` and `orders/[id]` pull full
`products`/`order_items` rows (including any large text/image columns) on
every order-detail view. Worth an explicit column list pass, especially for
admin order detail (loaded frequently while processing orders).

### P1-3. `create_order_atomic` locks products in client-supplied order
**File**: `supabase/migrations/20260603_atomic_checkout.sql:17-37`

The function loops over `p_items` in the order the client sent them and takes
`SELECT ... FOR UPDATE` on each product row. Two concurrent checkouts
containing the same two products in opposite order can deadlock; Postgres
will detect this and abort one transaction after `deadlock_timeout`, which
surfaces to the user as a checkout 500 (the exact symptom class fixed in
commit `3553e96`, but for a different root cause). Sorting `p_items` by
`product_id` before the lock loop removes this class of deadlock entirely —
cheap, low-risk fix worth prioritizing alongside P0-2.

### P1-4. Duplicate browser Supabase client strategies
**Files**: `lib/supabase.ts` (module-level singleton + retry wrapper) vs
`lib/supabase-client.ts` (factory). Having two ways to get a browser client
increases the chance of session/token staleness bugs — the same bug class
behind several of the recent admin-auth fixes. Recommend consolidating on the
factory pattern (`supabase-client.ts`) and removing the singleton from
`lib/supabase.ts`, or documenting why both are needed.

### P1-5. Largest client components
38 of 68 TSX files are `'use client'`. The largest:
- `components/store/StitchHomeContent.tsx` — 738 lines, actively used by `/`
  and `/offers`. Fully client-rendered (framer-motion, cart/wishlist context,
  toasts throughout), so it can't be trivially split, but since it backs the
  highest-traffic page, extracting the static marketing sections (hero
  banners, category grids, badges) into server components with small client
  "islands" for the interactive bits (add-to-cart, wishlist toggle, carousel)
  would reduce homepage JS payload.
- `components/store/EnhancedCartSidebar.tsx` (371 lines) and
  `app/(store)/checkout/EnhancedCheckoutPage.tsx` — inherently interactive,
  lower priority.
- `components/store/EnhancedHomeContent.tsx` (881 lines) — see P2-1, this one
  should just be deleted rather than optimized.

---

## 4. Dead code / duplication findings (P2)

### P2-1. `HomeContent.tsx` / `EnhancedHomeContent.tsx` / `ProductCard.tsx` are unused
On current `main`, `app/(store)/page.tsx` and `app/(store)/offers/page.tsx`
both render `StitchHomeContent` only. `HomeContent.tsx` (imports
`ProductCard.tsx`) and `EnhancedHomeContent.tsx` have no importers anywhere in
`app/` or `components/`. That's **~1,800 lines of dead component code**
(`HomeContent.tsx` + `EnhancedHomeContent.tsx` + `ProductCard.tsx`). PR #27
(open/draft) already proposes removing exactly these files — this review
confirms that part of PR #27 is correct and worth merging independent of the
rest of that PR's scope, if it can be split out.

### P2-2. Misleading "bestsellers" comment
**File**: `app/api/products/bestsellers/route.ts:15-16`

```ts
// First try to get from products table if there's a sales_count column
```

There is no `sales_count` column (removed in the f43fc76 fix) and no fallback
logic — the endpoint simply returns `is_featured` products. The comment
should be removed or the endpoint should compute real bestsellers from
`order_items` (e.g. `GROUP BY product_id ORDER BY SUM(quantity) DESC`).

### P2-3. ESLint: 2 errors, 37 warnings
`npm run lint` (after `npm install`, which was required — `node_modules` was
absent) reports:

- **2 errors** in `components/admin/AdminSidebar.tsx` (`react-hooks/static-components`):
  `SidebarContent` is declared *inside* the component body (lines 144-217) and
  instantiated at lines 226 and 277, so it's recreated on every render —
  any local state inside `SidebarContent` resets each render. Move
  `SidebarContent` to module scope (or hoist it above the parent component)
  and pass `onLinkClick` as a prop (already done). PR #27 notes these as
  "pre-existing, not introduced by this PR" — confirmed still present on `main`.
- **37 warnings**, mostly `@typescript-eslint/no-unused-vars` (e.g.
  `app/(store)/wishlist/page.tsx` imports 10 unused identifiers — `Metadata`,
  `useWishlistContext`, `useCartContext`, `useCountry`, several icons, `Image`,
  `Link`, `toast`) and a handful of `no-explicit-any`
  (`app/api/admin/reviews/route.ts:42,71,98`, `hooks/useWishlist.ts:50`).
  None block the build; cleaning the wishlist page imports in particular
  suggests that page may itself be a leftover/incomplete rewrite worth a
  quick look.

### P2-4. Build-time Supabase error during static generation
`npm run build` succeeds (93/93 pages, TS clean) but logs:

```
Failed to fetch offers: Error: [supabase-admin] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars
```

during static generation of `/offers` (this sandbox had no `.env.local`). The
page still renders (error is caught), so this is not a build failure, but
confirm that the Vercel build environment has these vars set for `/offers`'
`revalidate: 1m` ISR fetch — if they're ever missing in production, `/offers`
silently renders empty.

---

## 5. Flows checked and found OK

- **Admin auth** (`proxy.ts`, `app/api/auth/admin/login`, `ensure-role`):
  coherent after the recent fix series — login syncs role to
  `app_metadata`/`user_metadata`/`users.role`, `ensure-role` is an intentional
  no-op, proxy checks session + `ADMIN_EMAILS`. No regressions found.
- **Product API column names** (the f43fc76 fix): current `select()` calls
  use real columns (`price`, `compare_price`); `sale_price` is computed
  client-side via `applyDiscount()`. Consistent.
- **Cart / Wishlist** (`hooks/useCart.ts`, `hooks/useWishlist.ts`,
  `context/CartContext.tsx`, `context/WishlistContext.tsx`): simple
  localStorage-backed state, contexts are thin wrappers, no issues found.
- **Auth page routing**: `/login` and `/register` are the live pages
  (linked from account/checkout flows); `/auth/login` and `/auth/signup` are
  intentional 6-line redirect aliases to `/login` (not dead code).
- **`create_order_atomic` transactionality**: correctly atomic — an exception
  (e.g. insufficient stock) rolls back the whole order + item inserts within
  the single RPC call.

---

## 6. Prioritized punch list

| # | Priority | Item | File(s) |
|---|----------|------|---------|
| 1 | P0 | Tap `verify` creates orders with no items/address | `app/api/checkout/verify/route.ts` |
| 2 | P0 | COD checkout doesn't re-validate price/coupon/shipping server-side | `app/api/checkout/route.ts` |
| 3 | P0 | Resolve duplicate Tap vs MyFatoorah payment integrations | `app/api/payment/*`, `lib/payment.ts` |
| 4 | P0 (minor) | Confirm `profiles` table exists or drop the lookup | `lib/auth-admin.ts:40-43`, `supabase/missing-tables.sql` |
| 5 | P1 | SQL-side aggregation for admin customers | `app/api/admin/customers/route.ts` |
| 6 | P1 | Sort `p_items` by `product_id` before locking | `supabase/migrations/20260603_atomic_checkout.sql` |
| 7 | P1 | Tighten wildcard `select('*')` columns | listed in §3.2 |
| 8 | P1 | Consolidate browser Supabase client patterns | `lib/supabase.ts` vs `lib/supabase-client.ts` |
| 9 | P2 | Remove dead Home/ProductCard components (~1,800 lines) | `HomeContent.tsx`, `EnhancedHomeContent.tsx`, `ProductCard.tsx` |
| 10 | P2 | Fix `bestsellers` comment / implement real ranking | `app/api/products/bestsellers/route.ts` |
| 11 | P2 | Fix AdminSidebar `static-components` lint errors | `components/admin/AdminSidebar.tsx` |
| 12 | P2 | Clean up unused imports (esp. wishlist page) | `app/(store)/wishlist/page.tsx` + others |

Items 1–4 affect order correctness/fulfillment and are the recommended
starting point for any follow-up work.
