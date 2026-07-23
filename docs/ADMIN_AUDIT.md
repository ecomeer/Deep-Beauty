# Admin Dashboard Audit Report — Deep Beauty

## Context

This is a read-only audit of the admin dashboard in the Deep Beauty storefront
(Next.js 16.2.2 with the new `proxy.ts` middleware model, React 19, Supabase,
Arabic/RTL UI). The goal is to identify everything broken, incomplete,
insecure, or misleading before the dashboard is trusted for real business
operation, and to produce a prioritized fix plan.
All findings below were traced through the real implementation; each is marked
**Confirmed** (verified in code) or **Suspected** (needs a runtime/DB check).

> **Remediation status (Phase 1 applied).** The audit was performed read-only.
> The Phase 1 critical/high fixes have since been implemented in this same
> branch:
> - **C-1** `hasAdminMetadata` now trusts only `app_metadata.role` (`lib/admin-config.ts`).
> - **C-2** admin login fails closed on an empty allowlist (`app/api/auth/admin/login/route.ts`).
> - **C-3** `isDevBypass()` is gated by `NODE_ENV !== 'production'` and prefers a server-only `DEV_BYPASS` var (`lib/admin-config.ts`).
> - **Schema drift** — added `supabase/migrations/20260723000000_add_categories_image_url.sql`.
> - **Storefront sync** — `revalidateStorefront()` added to banners, flash-sales, and settings mutation routes.
> - **Rate limiting** — `authLimiter` added to admin/customer login and register; abandoned-cart cron now requires `CRON_SECRET` (fail-closed).
> - **Quick wins** — dashboard sales chart excludes cancelled orders; `marketing/[id]` PATCH is column-whitelisted.
>
> Phases 2–4 (stats aggregation, campaign edit page, server-side filters,
> full-dataset CSV export, UI polish, performance) remain open.

### Verification performed (actually run)
| Check | Command | Result |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | **Pass** (0 errors) |
| ESLint | `npx eslint .` | **Pass** (0 errors, 3 trivial unused-var warnings) |
| Unit tests | `npx vitest run` | **Pass** (105 tests after Phase 1) |
| Production build | `npm run build` | **Pass** (compiles, all routes generated) |
| Runtime / browser / live DB | — | **Not Tested** (no running DB in this environment) |

The toolchain is healthy — there are **no build, type, lint, or unit-test
failures**. Every issue below is a logic, data-integrity, security, or UX
defect that the current tests do not cover.

---

## 1. Executive Summary

- **Overall completion:** ~78% built, ~65% production-ready. Most CRUD surfaces
  exist and function; the gaps are in security hardening, data correctness,
  storefront sync, and a handful of half-finished features.
- **Overall quality rating:** Good structure and consistency (shared auth
  helper, shared list hook, canonical order-status module, RLS hardening
  migrations), undermined by a few serious auth flaws and several
  "looks-done-but-wrong" data behaviors.
- **Issue counts:** Critical **3**, High **5**, Medium **11**, Low **12**.
- **Top blockers to production:**
  1. **Privilege escalation** — `user_metadata.role` is trusted for admin, and
     `user_metadata` is self-writable with the public anon key (any customer can
     make themselves admin).
  2. **Fail-open admin login** — if `ADMIN_EMAILS` is unset, any authenticated
     user is promoted to full admin.
  3. **`NEXT_PUBLIC_DEV_BYPASS`** disables *all* admin auth and is a client-exposed
     env var with no environment guard.
  4. **Schema drift** — `categories.image_url` is read/written by code but exists
     in no migration; category admin + storefront `/products` break at runtime
     unless the column was hand-added to the live DB.
  5. **Storefront staleness** — banners, flash-sales, and settings mutations never
     revalidate the storefront ISR cache.

---

## 2. Admin Dashboard Route Map

Pages live under `app/(admin)/admin/*`; each list page is a client component
calling an API route under `app/api/admin/*` that self-guards with
`requireAdmin`. Status reflects functional correctness, not build success.

| Route | Purpose | Status | Data Source | Main Problems |
|---|---|---|---|---|
| `/admin` | Redirect → `/admin/dashboard` | Working | — | — |
| `/admin/login` | Admin sign-in | Working | `/api/auth/admin/login` | No rate limiting; fail-open allowlist (see Security) |
| `/admin/dashboard` | KPI overview + charts | Working | `/api/admin/dashboard` | Chart includes cancelled orders; dead `trend` prop; badge lag |
| `/admin/stats` | Analytics (period) | Partially Working | `/api/admin/stats` | Top-products not aggregated per product; "completed"/"active customers" are misleading proxies |
| `/admin/products` | Product list/CRUD | Working | `/api/admin/products` | Stock filter client-side over paginated data; bulk = N requests; CSV = page only |
| `/admin/products/[id]` | Create/edit product | Working | `/api/admin/products/[id]` | No column whitelist on create; no client validation |
| `/admin/categories` | Category CRUD | Partially Working | `/api/admin/categories` | `image_url` schema drift; image-only edit; orphan-on-delete (text FK) |
| `/admin/orders` | Order list | Working | `/api/admin/orders` | Search double-fetch (stale `page`); date filter client-side; bulk = N requests |
| `/admin/orders/[id]` | Order detail/actions | Partially Working | `/api/admin/orders/[id]` | Tracking form has non-canonical statuses; cancel has no confirm |
| `/admin/orders/[id]/invoice` | Printable invoice | Working | `supabaseAdmin` (server) | — |
| `/admin/customers` | Customer list (read-only) | Working | `/api/admin/customers` | WhatsApp link hardcodes `965` prefix; CSV = page only |
| `/admin/reviews` | Moderate reviews | Working | `/api/admin/reviews` | Stat tiles are per-page counts |
| `/admin/coupons` | Redirect → marketing/coupons | Working | — | — |
| `/admin/marketing` | Marketing landing | Placeholder | none (static) | Hardcoded "مفعل/قريباً" channel statuses |
| `/admin/marketing/campaigns` | Campaign list | Partially Working | `/api/admin/marketing` | **Edit link 404s** (no `[id]` route); PATCH has no column whitelist |
| `/admin/marketing/campaigns/new` | Create campaign | Working | `/api/admin/marketing` | Only email enabled (sms/push/social disabled) |
| `/admin/marketing/coupons` | Coupon list | Working | `/api/admin/coupons` | No edit (toggle/delete only) |
| `/admin/marketing/coupons/new` | Create coupon | Working | `/api/admin/coupons` | — |
| `/admin/newsletter` | Subscriber list | Partially Working | `/api/admin/newsletter` | No pagination; "send newsletter" advertised but absent; CSV unescaped |
| `/admin/banners` | Home banners | Working | `/api/admin/banners` | No storefront revalidation; reorder = 2 requests; no full edit |
| `/admin/flash-sales` | Flash sales | Working | `/api/admin/flash-sales` | No storefront revalidation; picker fetches 200 products; no edit |
| `/admin/abandoned-carts` | Recovery list | Working | `/api/admin/abandoned-carts` | Silent 200-row cap; type mismatch |
| `/admin/contact-messages` | Contact inbox | Working | `/api/admin/contact-messages` | Silent 200-row cap |
| `/admin/settings` | Store settings | Working | `/api/admin/settings` | No storefront revalidation; `Setting` type has phantom `id` |
| `/admin/shipping` | Shipping zones CRUD | Working | `/api/admin/shipping` | Most complete CRUD; no issues |
| `/admin/team` | Staff/permissions | Working | `/api/admin/staff` | Deactivate has no confirm; no delete-staff |

---

## 3. Critical Issues

### C-1. Privilege escalation via self-writable `user_metadata.role`
- **Severity:** Critical
- **Affected route:** all `/admin/*` and `/api/admin/*`
- **Files:** `lib/admin-config.ts:19-23`, `proxy.ts:57`, `lib/auth-admin.ts:58-61`, `app/api/admin/me/route.ts:37-38`
- **Evidence:** `hasAdminMetadata()` returns true when `user.app_metadata?.role === 'admin'` **or** `user.user_metadata?.role === 'admin'`. `user_metadata` is writable by the user themselves via the browser client (`lib/supabase-client.ts`, built with `NEXT_PUBLIC_SUPABASE_ANON_KEY`) by calling `supabase.auth.updateUser({ data: { role: 'admin' } })`.
- **Root cause:** Trusting a user-controlled field for authorization. `app_metadata` is server-managed; `user_metadata` is not.
- **User impact:** Any registered customer can grant themselves full admin (bypasses proxy page-guard, every API route, and the `/me` UI gate). Total compromise of the admin surface and all customer/order/payment data.
- **Recommended fix:** In `hasAdminMetadata`, check **only** `app_metadata.role`. (The privileged-field DB triggers in `20260717010000` already protect `public.users.role`; this vector lives in `auth.users` metadata and is not covered by them.)
- **Difficulty:** Easy
- **Status:** ✅ Fixed in this branch.

### C-2. Fail-open admin allowlist in login
- **Severity:** Critical
- **Affected route:** `/api/auth/admin/login`
- **Files:** `app/api/auth/admin/login/route.ts:46-72`
- **Evidence:** `const emailInAllowList = allowedEmails.length === 0 || allowedEmails.includes(normalizedEmail)`. When `ADMIN_EMAILS`/`ADMIN_EMAIL` is empty, any user who authenticates and isn't already `staff` passes, is synced to `app_metadata.role='admin'` (lines 57-60), and upserted as `users.role='admin'` (lines 67-69). Combined with open self-registration (`app/api/auth/register`), an attacker registers then POSTs here to become admin.
- **Root cause:** "Empty allowlist means allow everyone" default.
- **User impact:** Full admin takeover whenever the env var is missing/misconfigured — a single deploy mistake opens the whole dashboard.
- **Recommended fix:** Treat an empty allowlist as "deny" (require an explicit allowlist or `app_metadata` admin). Fail closed.
- **Difficulty:** Easy
- **Status:** ✅ Fixed in this branch.

### C-3. Client-exposed global auth bypass (`NEXT_PUBLIC_DEV_BYPASS`)
- **Severity:** Critical (High if operationally guaranteed unset in prod)
- **Affected route:** all admin
- **Files:** `lib/admin-config.ts:26-28`, `lib/auth-admin.ts:21`, `proxy.ts:67-69`, `app/api/admin/me/route.ts:11-13`
- **Evidence:** `isDevBypass()` reads `process.env.NEXT_PUBLIC_DEV_BYPASS === 'true'`; when true, `requireAdmin` returns `null` immediately, the proxy lets every `/admin` route through, and `/me` returns admin. It is a `NEXT_PUBLIC_` variable (baked into the client bundle) with no `NODE_ENV`/Vercel guard despite the "local only" comment.
- **Root cause:** A debug backdoor gated only by a comment.
- **User impact:** If ever set in a deployed build, the entire admin surface is unauthenticated.
- **Recommended fix:** Guard with `process.env.NODE_ENV !== 'production'` inside `isDevBypass()`, and rename to a non-`NEXT_PUBLIC_` server-only var.
- **Difficulty:** Easy
- **Status:** ✅ Fixed in this branch.

---

## 4. Broken or Incomplete Features

| Feature | Current Status | Problem | Root Cause | Required Fix | Priority |
|---|---|---|---|---|---|
| Category admin + storefront `/products` | Broken (drift) | `categories.image_url` selected/written but in no migration | Schema drift (manual DB edits) | Add migration `ALTER TABLE categories ADD COLUMN image_url text` | Critical — ✅ fixed |
| Campaign edit | Broken (404) | Pencil links to `/admin/marketing/campaigns/[id]` which doesn't exist | Missing route | Add edit page or remove the link | High |
| Storefront sync (banners/flash-sales/settings) | Broken | Mutations don't call `revalidateStorefront()` | Missing revalidation calls | Add revalidation to those routes | High — ✅ fixed |
| Stats "top products" | Incomplete | Returns top 10 line-items, not aggregated per product | No GROUP BY/SUM | Use `get_bestseller_products` RPC or aggregate | High |
| Newsletter send | Missing | UI advertises sending newsletters; only subscriber list exists | Feature not built | Build send flow or drop the claim | Medium |
| Product stock filter | Partial | Filters only the 20 loaded rows over server pagination | Client-side filter | Move filter to the API query | Medium |
| Orders date filter | Partial | Filters only the current page | Client-side filter | Move filter to the API query | Medium |
| CSV export (orders/products/customers) | Partial | Exports only the loaded page | Uses in-memory page state | Add export endpoint returning full dataset | Medium |
| Newsletter CSV | Partial | Hand-built `r.join(',')`, no escaping | Bypasses `lib/csv.ts` | Use `toCsv()` | Medium |
| Order tracking status dropdown | Partial | Hardcodes `preparing`/`out_for_delivery` (non-canonical) | Not using `ORDER_STATUSES` | Use canonical statuses | Medium |
| Order cancel | Partial | No confirmation dialog before cancel + WhatsApp | Missing confirm | Add `confirm()` | Medium |
| Marketing landing channel status | Placeholder | "مفعل/قريباً" hardcoded | Static content | Drive from real config or label as informational | Low |
| Category / banner / flash-sale / coupon edit | Incomplete | Create-only (no full edit form) | Not built | Add edit forms | Low |
| Bulk actions (products/orders/coupons) | Works, inefficient | One HTTP request per row | No bulk endpoint | Add bulk endpoints | Low |
| Dashboard `StatCard.trend` | Dead code | Prop never passed | Leftover | Remove or wire up | Low |
| Duplicate nav item | Cosmetic | Newsletter listed twice in sidebar | Copy in two groups | Remove one | Low |

---

## 5. Database and API Problems

**Confirmed**
- **Schema drift — `categories.image_url` missing** (`app/api/admin/categories/route.ts:11,28`, `[id]/route.ts:18`; storefront `app/(store)/products/page.tsx`). No migration or `schema.sql` defines it. Same drift class the `20260717110000` migration was written to fix for `coupons.description_ar`, `newsletter_subscribers.name/is_active`, `categories.updated_at`. **✅ Fixed** via `20260723000000_add_categories_image_url.sql`.
- **No storefront revalidation** on banners, flash-sales, settings mutations (§4). Only products/categories call `lib/revalidate-storefront.ts`. Home/`/products`/`/offers` stay stale up to their ISR window (5–10 min). **✅ Fixed.**
- **Stats top-products** not grouped by product (`app/api/admin/stats/route.ts:47-57`) — duplicate products, per-line totals.
- **Dashboard chart includes cancelled orders** (`app/api/admin/dashboard/route.ts:32` — no status filter), while `stats` correctly filters `delivered`. Inconsistent revenue basis. **✅ Fixed** (chart now excludes cancelled).
- **Category delete orphans products** — `products.category` is free-text (`00001_initial_schema.sql:34`), not an FK; deleting a category leaves products pointing at a dead name string. Flash-sale category targeting (by name) also breaks on rename.
- **CSV exports truncate to the loaded page** (`orders/page.tsx:112`, `products/page.tsx:113`, `customers/page.tsx:41`); **newsletter CSV is unescaped** (`newsletter/page.tsx:33`) → CSV injection / comma corruption.
- **Type/DB mismatches** (`types/index.ts`): `Subscriber` (`source`, `subscribed_at` don't exist), `AbandonedCart` (every field name differs from table), `MarketingCampaign` (`name/status/recipients_count` vs `title/is_active/sent_count`; enum values differ), `Setting` (phantom `id`; table is keyed by `key`). `Review` missing `updated_at`.
- **`marketing/[id]` PATCH has no column whitelist** (`route.ts:22` does `.update(body)`) — arbitrary client keys forwarded, unlike `products/[id]` which whitelists. **✅ Fixed.**
- **Silent row caps**: `abandoned-carts` and `contact-messages` `.limit(200)` with no pagination.
- **Drift artifacts**: `supabase/apply-marketing-campaigns.sql` duplicates `00011`; `supabase/missing-tables.sql` is a manual patch and the only place `admin_users` is defined (orphaned/unused). Both diverge from the ordered migration set.

**Suspected (need live DB / runtime confirmation)**
- `get_total_paid_sales` (`20260717080000`) sums `payment_status='paid'` with no `status <> 'cancelled'` guard — a paid-then-cancelled order may still count as revenue. Confirm `cancel_order_effects_atomic` flips `payment_status` to refunded.
- `get_admin_customers`, `get_bestseller_products`, `get_frequently_bought_together` don't filter order status — cancelled orders inflate customer totals and bestseller/FBT rankings.

---

## 6. Authentication and Security Issues

| Security Issue | Severity | Evidence | Risk | Recommended Fix | Status |
|---|---|---|---|---|---|
| `user_metadata.role` trusted for admin | Critical | `lib/admin-config.ts:19-23` | Any customer self-promotes to admin via anon key | Trust only `app_metadata.role` | ✅ Fixed |
| Fail-open login allowlist | Critical | `app/api/auth/admin/login/route.ts:47` | Empty env → anyone becomes admin | Fail closed on empty allowlist | ✅ Fixed |
| `NEXT_PUBLIC_DEV_BYPASS` global bypass | Critical | `lib/admin-config.ts:26-28` | Client-exposed backdoor, no prod guard | Guard by `NODE_ENV`; drop `NEXT_PUBLIC_` prefix | ✅ Fixed |
| No rate limiting on login/registration | High | no limiter in `app/api/auth/**`; `lib/rate-limit.ts` has none for auth | Credential brute force | Add auth rate limiter | ✅ Fixed |
| Cron endpoint fail-open | High | `app/api/cron/abandoned-cart-reminders/route.ts:16-19` (`if (cronSecret && ...)`) | Unset secret → anyone triggers ≤100 emails/call | Require `CRON_SECRET`; reject if unset | ✅ Fixed |
| Any staff reaches no-permission admin routes | Medium | `lib/auth-admin.ts:75` (`!permission` short-circuits) | `upload`, `push/send`, `dashboard`, `stats` reachable by any staff | Add explicit permission or full-admin gate | Open |
| `marketing/[id]` PATCH mass-assignment | Medium | `app/api/admin/marketing/[id]/route.ts:22` | Arbitrary column writes (service-role) | Whitelist columns | ✅ Fixed |
| No explicit CSRF defense | Low | cookie auth, no tokens | Mitigated by SameSite=Lax + JSON POST | Document; consider origin check on mutations | Open |
| `marketing_campaigns`/`push_subscriptions` RLS omit `is_active` | Low | `00011`, `00010` policies | Deactivated admin's own session passes (writes go via service-role anyway) | Use `is_admin()` helper | Open |
| Proxy deletes wrong cookie names | Low | `proxy.ts:52-53` (`sb-access-token`) vs `@supabase/ssr` chunked names | Redirect-loop cleanup no-ops | Delete correct `sb-<ref>-auth-token*` cookies | Open |

**Done well (verified):** every `/api/admin/**` handler calls `requireAdmin` server-side and returns its result — no admin API route is unprotected or client-only-guarded; service-role key is server-only (no `NEXT_PUBLIC_`); privileged-field triggers force `role='customer'` and block role tampering on `public.users`/`profiles`; RLS consolidated so writes require `is_admin()` (SECURITY INVOKER, checks `is_active`); privileged RPCs revoked from anon/authenticated; upload route validates MIME + size + folder whitelist and regenerates filenames; `/api/admin/setup` disabled (410). Do **not** expose secret values — none are printed in this report.

---

## 7. UI and UX Problems (by page)

- **Sidebar** — Newsletter appears twice (`AdminSidebar.tsx:58,69`); remove one. `isActive` uses `startsWith`, so `/admin/marketing` highlights for sub-routes — scope the match. Pending-orders badge polls every 2 min (can lag); refresh it after order mutations. *Priority: Low.*
- **Dashboard** — Sales chart silently includes cancelled orders (✅ fixed); dead `trend` prop on `StatCard`. Otherwise strong loading/empty/error states. *Medium.*
- **Stats** — "الطلبات المكتملة" = `dailySales.length` (not completed count) and "العملاء النشطين" = capped `topCustomers.length` (~5) mislead the operator; compute real values or relabel. *Medium.*
- **Products** — Stock-filter and pagination counts disagree because the filter is client-side over a server page; move to the API. Native `confirm()` is fine but inconsistent with a styled dialog elsewhere. *Medium.*
- **Orders list** — `handleSearch` fires `fetchOrders()` after `setPage(1)` reading stale `page`, plus the `useEffect` refetch → double fetch / wrong page. Date filter client-side. Per-row status change has no confirm. *Medium.*
- **Order detail** — Tracking-form status dropdown includes non-canonical `preparing`/`out_for_delivery` with no label/color and outside `VALID_TRANSITIONS`; cancel button has no confirmation and auto-opens WhatsApp; confirmed→shipped skips the valid `processing` step. *High for the status inconsistency.*
- **Categories** — Inline edit only changes the image; name/slug can't be edited after creation. Local `slugify` duplicates `lib/utils`. *Low.*
- **Customers** — WhatsApp link hardcodes `wa.me/965${phone}` (double-prefix risk); order detail uses `toWhatsAppPhone()` — unify on the helper. *Low.*
- **Newsletter** — No pagination (loads all); advertised "send newsletters" doesn't exist; CSV unescaped. *Medium.*
- **Marketing landing** — Channel statuses hardcoded; either wire to config or mark clearly informational. *Low.*
- **Consistency** — All destructive actions use native `confirm()`; standardize (and add the two missing confirms: order cancel, order status change). *Medium.*
- **Responsive/RTL** — Layout is RTL throughout with desktop table + mobile-card patterns and a mobile drawer/bottom-nav; no responsive defects found. *Good.*

---

## 8. Performance Issues

| Performance Issue | Evidence | Impact | Recommended Fix | Priority |
|---|---|---|---|---|
| Client-side filters over server pages | products stock filter, orders date filter | Misleading results; forces over-fetch to compensate | Push filters into API queries | Medium |
| Bulk actions = N HTTP requests | `products/page.tsx:77-98`, `orders/page.tsx:85-93`, coupons, banner reorder | Slow, rate-limit-prone bulk ops | Add bulk endpoints (single query) | Medium |
| Flash-sale picker fetches 200 products | `flash-sales/page.tsx:72` (`pageSize=200`) | Large payload on mount | Search/typeahead endpoint | Low |
| Orders list double-fetch on search | `orders/page.tsx:53-57` + effect | 2 requests per search | Drive fetch from state only | Low |
| Newsletter/abandoned/contact no pagination | `newsletter` all rows; others `.limit(200)` | Silent truncation, growing payloads | Add pagination | Low |
| CSV exports re-use page state | §4 | Not perf-critical but incomplete data | Server-side export | Medium |
| Sidebar badge poll every 2 min | `AdminSidebar.tsx` | Minor recurring request | Refresh on mutation instead | Low |

No SQL N+1 in list endpoints (they use single embedded joins); `head:true`
count queries are correct. Overall data-layer performance is reasonable.

---

## 9. Missing Features

**Essential before production**
- Fix C-1/C-2/C-3 auth flaws and the `categories.image_url` migration. *(✅ done)*
- Storefront revalidation for banners/flash-sales/settings. *(✅ done)*
- Auth + cron rate limiting / secret enforcement. *(✅ done)*

**Recommended improvements**
- Campaign edit page; category/banner/flash-sale/coupon full edit forms.
- Correct stats aggregation (top products, revenue excluding cancelled).
- Full-dataset CSV export endpoints; escaped newsletter CSV.
- Confirmation dialogs on order cancel and status change.
- Category as a real FK (or enforced reference) to prevent orphans.

**Optional advanced**
- Newsletter/broadcast sending; SMS/push/social campaign channels.
- Activity/audit log; styled confirmation dialog component; import features.

---

## 10. Quick Wins (high impact, low effort)

1. `hasAdminMetadata` → check only `app_metadata.role` (fixes C-1). *Easy.* ✅
2. Fail-closed allowlist in admin login (fixes C-2). *Easy.* ✅
3. Guard `isDevBypass()` by `NODE_ENV` (fixes C-3). *Easy.* ✅
4. Add `categories.image_url` migration (fixes the drift breakage). *Easy.* ✅
5. Add `revalidateStorefront()` to banners/flash-sales/settings routes. *Easy.* ✅
6. Add `status <> 'cancelled'` filter to the dashboard chart query. *Easy.* ✅
7. Remove duplicate newsletter nav item. *Trivial.*
8. Replace non-canonical statuses in the order tracking dropdown with `ORDER_STATUSES`. *Easy.*
9. Add `confirm()` to order cancel + order status change. *Easy.*
10. Column-whitelist the `marketing/[id]` PATCH. *Easy.* ✅

---

## 11. Recommended Implementation Plan

### Phase 1 — Critical Fixes (security, data integrity, breakage) — ✅ Applied
- **Tasks:** C-1, C-2, C-3; add `categories.image_url` migration; auth + cron rate limiting/secret enforcement.
- **Files:** `lib/admin-config.ts`, `app/api/auth/admin/login/route.ts`, `lib/auth-admin.ts`, `proxy.ts`, `app/api/admin/me/route.ts`, new `supabase/migrations/*_add_categories_image_url.sql`, `lib/rate-limit.ts`, `app/api/cron/abandoned-cart-reminders/route.ts`.
- **Dependencies:** None; do auth fixes first.
- **Risks:** Tightening auth could lock out a misconfigured environment — verify `ADMIN_EMAILS`/`app_metadata` is set for real admins before deploy.
- **Verification:** As a normal customer, `updateUser({data:{role:'admin'}})` must NOT grant `/admin`; with empty `ADMIN_EMAILS`, admin login must be denied; with `NEXT_PUBLIC_DEV_BYPASS=true` in a prod build, admin must still require auth; category list loads without a `column does not exist` error.

### Phase 2 — Core Functionality (CRUD, sync, stats)
- **Tasks:** revalidation on banners/flash-sales/settings *(✅ done)*; fix stats top-products aggregation and cancelled-order revenue; campaign edit route; move product/order filters server-side; full-dataset CSV export; escape newsletter CSV; column-whitelist marketing PATCH *(✅ done)*; fix orders search double-fetch.
- **Files:** `app/api/admin/{banners,flash-sales,settings,stats,dashboard,marketing}/**`, `app/(admin)/admin/{products,orders,newsletter,marketing}/**`, `supabase/migrations` for RPC status filters, `lib/csv.ts` callers.
- **Dependencies:** Phase 1 migrations applied.
- **Risks:** RPC changes touch storefront recommendations too — re-test bestsellers/FBT.
- **Verification:** Create a flash sale → storefront price updates without waiting out ISR; cancel a paid order → it drops out of revenue/bestsellers; export CSV → full dataset, correctly escaped.

### Phase 3 — UI/UX Improvements
- **Tasks:** confirmations on cancel/status change; canonical order statuses; category/banner/flash-sale/coupon edit forms; unify WhatsApp helper; relabel misleading stat tiles; remove duplicate nav; scope sidebar active-state; align type definitions with tables.
- **Files:** `app/(admin)/admin/**`, `components/admin/AdminSidebar.tsx`, `types/index.ts`.
- **Dependencies:** None (independent of Phase 2).
- **Risks:** Low; type fixes may surface latent TS errors to resolve.
- **Verification:** `tsc`/`eslint`/`vitest`/`build` still green; manual click-through of each edited page.

### Phase 4 — Performance & Advanced
- **Tasks:** bulk endpoints; pagination for newsletter/abandoned/contact; flash-sale picker typeahead; refresh badge on mutation; newsletter/broadcast sending; activity log; styled dialog component.
- **Files:** new bulk API routes, list pages, `components/admin/*`.
- **Dependencies:** Phases 1–3.
- **Risks:** New endpoints need their own `requireAdmin` gating — mirror existing patterns.
- **Verification:** Bulk update 50 rows in one request; large lists paginate; new endpoints reject unauthorized callers.

---

## 12. Production Readiness Checklist

| Area | State | Note |
|---|---|---|
| Build | **Completed** | `npm run build` passes |
| TypeScript | **Completed** | 0 errors |
| Lint | **Completed** | 0 errors (3 warnings) |
| Unit tests | **Completed** | 105 pass |
| E2E / runtime / browser | **Not Tested** | No running app/DB in this environment |
| Admin route protection (API) | **Completed** | All routes `requireAdmin`-gated |
| Authentication hardening | **Completed (Phase 1)** | C-1/C-2/C-3 fixed; staff no-permission gating still open |
| Role-based permissions | **Incomplete** | No-permission routes reachable by any staff |
| Database schema integrity | **Improved** | `categories.image_url` migration added; type mismatches remain |
| Storefront ↔ dashboard sync | **Completed** | Banners/flash-sales/settings now revalidate |
| Orders workflow | **Incomplete** | Non-canonical statuses; cancel without confirm |
| Products/categories CRUD | **Incomplete** | Category orphans; image-only category edit |
| Statistics accuracy | **Incomplete** | Top-products + cancelled-order counting (chart fixed) |
| Images/upload | **Completed** | Validated + folder-whitelisted |
| Payments | **Not Tested** | Out of admin scope; not runtime-verified here |
| Responsive design | **Completed** | RTL + mobile patterns throughout |
| Performance | **Incomplete** | Client-side filters, N-request bulk, unpaginated lists |
| Security (secrets) | **Completed** | Service-role key server-only |
| Rate limiting | **Completed** | Auth + cron throttling added |

---

*Audit performed read-only; Phase 1 critical/high fixes applied in the same
branch (see the remediation banner at the top). Phases 2–4 remain open and are
ready to execute on approval.*
