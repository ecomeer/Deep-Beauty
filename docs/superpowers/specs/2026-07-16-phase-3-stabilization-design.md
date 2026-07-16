# Phase 3 Stabilization Design

## Goal

Complete the remaining safe stabilization work after the account and order improvements without touching `main` or applying production database changes.

## Architecture

The change introduces small pure helpers for reporting and payment lifecycle decisions, then reuses them from the existing API routes. This keeps business rules testable and prevents dashboard, statistics, callbacks, and webhooks from implementing different definitions.

## Reporting

Recognized revenue includes:

- online orders with `payment_status = paid`;
- cash-on-delivery orders with `status = delivered`.

Cancelled or refunded orders never count. Dashboard and statistics APIs apply this same rule. Kuwait-local day boundaries are converted to UTC before querying Postgres.

## Payment lifecycle

A verified payment records `paid_at`. A pending order advances to confirmed and records `confirmed_at`. A delayed callback or webhook never moves processing, shipped, or delivered orders backwards. Cancelled orders cannot be revived.

Only explicit terminal UPayments results cancel and restock a pending order. Pending, processing, missing, and unknown gateway states remain unchanged.

## Notifications and email

Payment handlers call the shared push service directly rather than making an unauthenticated request to an admin endpoint. Email sending requires both `RESEND_API_KEY` and an explicit verified `EMAIL_FROM`. API responses expose non-sensitive delivery error codes for diagnosis.

## Testing

Pure helper tests cover revenue recognition, Kuwait date keys, payment lifecycle patches, terminal UPayments failures, and email configuration/provider failures. Existing quality gates run unit tests, lint, TypeScript, and production build.

## Constraints

- Do not modify or merge `main`.
- Keep the pull request Draft.
- Do not apply production migrations.
- Do not run live payments or send production notifications.
