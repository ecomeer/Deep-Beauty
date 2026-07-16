# Phase 3 Stabilization — 2026-07-16

## Scope

This stacked change starts from the current Phase 2 branch and does not modify `main`.

### Reporting consistency

- Centralized the recognized-revenue rule.
- Paid non-cancelled/non-refunded orders count as revenue.
- Delivered cash-on-delivery orders count as revenue.
- Pending COD, cancelled, and refunded orders do not count.
- Dashboard and store statistics now use the same rule.
- Dashboard day boundaries use Asia/Kuwait rather than the server timezone.

### Payment lifecycle

- Verified payments record `paid_at`.
- Pending paid orders become confirmed and record `confirmed_at`.
- Delayed callbacks/webhooks preserve processing, shipped, and delivered states.
- Cancelled orders are never revived.
- Only explicit terminal UPayments failures cancel and restock an order.
- Pending/processing/unknown gateway states remain untouched for later verification.
- Payment initiation no longer mutates the order before the gateway returns a valid payment URL.

### Notifications and email

- Payment routes call the push service directly instead of calling the admin-only HTTP endpoint without authentication.
- Order notifications expose `emailError` and `pushSent` results.
- Email delivery requires an explicit `EMAIL_FROM` sender to prevent unverified-domain Resend 403 failures.

### Tests

Added or extended unit coverage for:

- recognized revenue rules;
- Kuwait ISO date grouping;
- paid-order lifecycle patching;
- terminal versus pending UPayments states;
- missing email sender configuration and Resend 403 responses.

## Safety

- No production migration was applied.
- No payment, email, push, order, or customer production data was used.
- PR remains Draft until quality gates and preview checks pass.
