# Phase 3 Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make reporting, payment lifecycle handling, push notifications, and email diagnostics consistent and safe.

**Architecture:** Centralize business decisions in pure helpers and keep route handlers responsible for authorization, persistence, and response shaping. Reuse Asia/Kuwait date helpers for database boundaries.

**Tech Stack:** Next.js 16, TypeScript, Supabase, Vitest, GitHub Actions.

## Global Constraints

- Do not modify or merge `main`.
- Keep the pull request Draft.
- Do not apply production migrations.
- Do not run live payments or send production notifications.

---

### Task 1: Reporting consistency

**Files:**
- Create: `lib/order-reporting.ts`
- Create: `lib/order-reporting.test.ts`
- Modify: `app/api/admin/dashboard/route.ts`
- Modify: `app/api/admin/stats/route.ts`

- [x] Define the recognized-revenue rule in a pure helper.
- [x] Cover paid online, delivered COD, pending COD, cancelled, and refunded cases.
- [x] Apply the helper to dashboard and statistics APIs.

### Task 2: Kuwait reporting boundaries

**Files:**
- Modify: `lib/kuwait-time.ts`
- Modify: `lib/kuwait-time.test.ts`
- Modify: `app/api/admin/dashboard/route.ts`
- Modify: `app/api/admin/stats/route.ts`

- [x] Add a Kuwait-local ISO date key.
- [x] Use Kuwait day bounds for dashboard and statistics queries.

### Task 3: Payment lifecycle safety

**Files:**
- Create: `lib/payment-order.ts`
- Create: `lib/payment-order.test.ts`
- Modify: `lib/upayments.ts`
- Modify: `lib/upayments.test.ts`
- Modify: `app/api/payment/upayments/callback/route.ts`
- Modify: `app/api/payment/upayments/webhook/route.ts`
- Modify: `app/api/payment/initiate/route.ts`

- [x] Preserve advanced order states on delayed gateway events.
- [x] Record payment timestamps.
- [x] Prevent cancelled-order revival.
- [x] Cancel and restock only explicit terminal gateway failures.
- [x] Delay payment-method mutation until gateway initialization succeeds.

### Task 4: Notification and email diagnostics

**Files:**
- Modify: `lib/email.ts`
- Modify: `lib/email.test.ts`
- Modify: `app/api/admin/orders/[id]/notify/route.ts`
- Modify: `app/api/payment/upayments/callback/route.ts`
- Modify: `app/api/payment/upayments/webhook/route.ts`

- [x] Require an explicit verified email sender.
- [x] Return stable email error codes.
- [x] Call the push service directly from server routes.

### Task 5: Verification

**Files:**
- Modify: `.github/workflows/deep-beauty-qa.yml`

- [x] Enable quality gates on `phase-3-stabilization` pushes.
- [ ] Confirm unit tests pass.
- [ ] Confirm ESLint passes.
- [ ] Confirm TypeScript passes.
- [ ] Confirm production build passes.
- [ ] Confirm preview deployment passes.
