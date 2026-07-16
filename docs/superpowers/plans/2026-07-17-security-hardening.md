# Deep Beauty Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the confirmed authorization, loyalty-points, payment-reservation, and privileged-RPC security gaps without changing legitimate storefront or admin behavior.

**Architecture:** Keep all privileged writes behind authenticated Next.js route handlers and Supabase service-role calls. Enforce the same boundary in Postgres with RLS, triggers, and service-role-only RPCs. Make payment cancellation and loyalty awarding idempotent and atomic.

**Tech Stack:** Next.js 16, TypeScript, Vitest, Supabase Postgres/RLS/RPC, Vercel.

## Global Constraints

- Do not modify `main` directly.
- Do not apply DDL to the production Supabase project before development-branch verification.
- Preserve guest checkout, authenticated checkout, COD, UPayments, MyFatoorah fallback, customer profile editing, admin/staff permissions, and order cancellation.
- Never trust `user_id`, totals, prices, coupon state, or payment state supplied by the browser.
- All privileged RPCs must be unavailable to `PUBLIC`, `anon`, and `authenticated` unless explicitly required.

---

### Task 1: Establish CI and regression tests

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `lib/profile-updates.test.ts`
- Create: `lib/checkout-identity.test.ts`

- [ ] Add a GitHub Actions workflow that runs `npm ci`, `npm test`, `npm run lint`, and `npm run build` for pull requests and branch pushes.
- [ ] Add a failing test proving profile payloads cannot include `role`, `permissions`, `is_active`, `loyalty_points`, or `email`.
- [ ] Add a failing test proving checkout identity comes only from the authenticated session and ignores a browser-supplied user id.
- [ ] Push the test-only commit and confirm CI fails for the intended missing helpers.

### Task 2: Close the profile and role-escalation boundary

**Files:**
- Create: `lib/profile-updates.ts`
- Create: `lib/checkout-identity.ts`
- Modify: `app/api/auth/profile/route.ts`
- Modify: `app/api/auth/register/route.ts`
- Create: `supabase/migrations/20260717010000_security_authorization_hardening.sql`

- [ ] Implement an allowlist normalizer for customer-editable profile fields.
- [ ] Update `/api/auth/profile` to authenticate the session and write allowed `users.name`, `users.phone`, and compatible `profiles` fields through `supabaseAdmin` only.
- [ ] Remove the redundant client-role insert from `/api/auth/register`; rely on the existing auth trigger.
- [ ] Replace unsafe `users`/`profiles` write policies and add database guards preventing non-service-role changes to role, permissions, activation, loyalty balance, and identity fields.
- [ ] Replace the `flash_sales` policy that treats every authenticated user as an admin.
- [ ] Revoke public execution on legacy stock/coupon/security-definer functions and pin mutable search paths.
- [ ] Confirm focused tests pass.

### Task 3: Bind loyalty and order ownership to verified state

**Files:**
- Modify: `app/api/checkout/route.ts`
- Modify: `app/api/payment/upayments/callback/route.ts`
- Modify: `app/api/payment/upayments/webhook/route.ts`
- Modify: `app/api/payment/callback/route.ts`
- Modify: `app/api/account/orders/[id]/cancel/route.ts`
- Modify: `app/api/admin/orders/[id]/route.ts`
- Modify: `app/api/cron/abandoned-cart-reminders/route.ts`
- Modify: `supabase/migrations/20260717010000_security_authorization_hardening.sql`

- [ ] Resolve the optional checkout user from the Supabase session and ignore `body.user_id`.
- [ ] Stop awarding loyalty points when an order is merely created.
- [ ] Add idempotent service-role-only RPCs to award points after verified online payment or delivered COD, reverse cancellation effects once, and expire stale unpaid online orders.
- [ ] Set a payment-expiry timestamp on online orders.
- [ ] Use the atomic cancellation RPC from customer cancellation, admin cancellation, failed webhooks, and expiry cleanup.
- [ ] Award points after verified UPayments/MyFatoorah success and after an admin transition to `delivered`.
- [ ] Validate amount, order identity, cancellation state, and idempotency for both gateways.

### Task 4: Verify and open a pull request

**Files:**
- No additional production files.

- [ ] Inspect the final diff for unrelated changes.
- [ ] Run the focused tests, full test suite, lint, build, and Vercel deployment checks.
- [ ] Apply the migration to a Supabase development branch only after cost confirmation.
- [ ] Run SQL assertions for RLS policies, grants, RPC ACLs, profile escalation attempts, loyalty idempotency, cancellation idempotency, and stale-payment expiry.
- [ ] Re-run Supabase security and performance advisors.
- [ ] Open a draft pull request with exact verification results and remaining production-application steps.
