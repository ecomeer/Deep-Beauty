# Deep Beauty — Admin, Customer Account, Invoice & Permissions Audit

Date: 2026-07-14
Scope: Admin dashboard, orders, invoices, tracking, customer account, permissions, dates/timezone, database and production runtime errors.

## Executive status

The storefront smoke tests are useful but do not certify the admin panel or authenticated customer account. PR #41 remains a draft until the critical and high-priority findings below are fixed and authenticated end-to-end tests are added.

## Critical findings

### 1. Admin invoice authorization bypass

`/admin/orders/[id]/invoice` queries orders directly through `supabaseAdmin`. The admin route proxy verifies only that the user is an admin or staff member; it does not verify that a staff user has the `orders` permission. A staff user without order permissions may therefore access a direct invoice URL and see customer/order data.

Required fix:
- Move invoice data loading behind an API/service that calls `requireAdmin(req, 'orders')`, or implement a server-side permission guard that uses the same permission resolver.
- Add tests for admin, staff-with-orders, staff-without-orders, inactive staff and customer roles.

### 2. Online payment is failing in production

Vercel runtime errors show UPayments initiation returning HTTP 404. Online checkout cannot be considered complete until the endpoint, credentials/environment and request contract are verified in sandbox and then production.

### 3. Order confirmation emails are failing

Vercel runtime errors show Resend HTTP 403 because `deepbeautykw.com` is not verified. Order confirmation email delivery is currently not reliable.

### 4. Publicly executable SECURITY DEFINER functions

Supabase security advisors report that multiple SECURITY DEFINER functions are executable by anonymous and/or authenticated roles, including stock and coupon mutation helpers. Revoke unnecessary EXECUTE permissions, set fixed `search_path`, and expose only narrowly authorized RPCs.

### 5. Customer tracking API does not match the live schema

`/api/orders/track` requests columns that do not exist in the live schema (`shipping_address`, `order_items.price`, `order_tracking.note`). This route needs a contract rewrite and an automated integration test.

## High-priority findings

### 6. Product images are absent from customer orders and invoices

The customer orders API explicitly returns `image: null`. The admin invoice query does not request images. The live `order_items` table has no image snapshot column.

Production data audit:
- 44 order-item rows.
- 28 rows have no `product_id`.
- Only 16 rows currently link to a product that has an image.

Required design:
- Add snapshot columns to `order_items`, such as `product_image_url`, `product_slug`, SKU/variant information if applicable.
- Populate snapshots when creating an order.
- For existing rows, backfill from products where `product_id` still exists and use a placeholder for historical rows that cannot be recovered.
- Render snapshots in admin order details, admin invoices, customer order details and customer invoices.

### 7. Customer invoice does not exist

Only the admin invoice route exists. Add an authenticated customer invoice route that verifies the order belongs to the current user (user ID, with a carefully controlled legacy email fallback).

Customer invoice should include:
- Order/invoice number.
- Kuwait-local order date and time.
- Payment date/time when available.
- Status completion/delivery/cancellation timestamps.
- Product images, names, quantities, unit prices and totals.
- Subtotal, coupon, loyalty discount, shipping and final total.
- Payment method/status and payment reference.
- Delivery address and tracking timeline.
- Print/download PDF-friendly layout.

### 8. Order timestamps are incomplete and incorrectly localized

The live database uses UTC, which is correct for storage. Application formatting does not consistently set `timeZone: 'Asia/Kuwait'`. Dashboard day boundaries and chart grouping use UTC dates, and order-number dates are generated from UTC.

There are no dedicated columns for `paid_at`, `confirmed_at`, `processing_at`, `shipped_at`, `delivered_at` or `cancelled_at`.

Required fix:
- Store all timestamps as `timestamptz` UTC.
- Format every customer/admin display explicitly in `Asia/Kuwait`.
- Add status milestone timestamps, preferably written atomically when status/payment changes.
- Use Kuwait day boundaries in dashboard/statistics queries.
- Add unit tests around 21:00 UTC / midnight Kuwait boundary.

### 9. Most orders have no tracking history

Production data audit:
- 31 total orders.
- 25 orders have no tracking entry.

Required fix:
- Create an initial `pending` tracking event atomically with every order.
- Create tracking/status events automatically for every allowed status transition.
- Backfill existing orders.
- Keep order status and latest tracking status consistent.

### 10. Tracking status terminology is inconsistent

The canonical status is `processing`, while the admin tracking form uses `preparing`. The tracking API can update order status directly without using `VALID_TRANSITIONS`, and it does not validate the result of the order update before returning success.

Required fix:
- Use `ORDER_STATUSES` and `VALID_TRANSITIONS` everywhere.
- Perform status update and tracking insertion in one database transaction/RPC.
- Reject invalid transitions and invalid status names.
- Record `created_by` from the authenticated session, not the request body.

### 11. Orders pagination and filtering are broken/incomplete

The admin API returns `total`, `page` and `limit`, but the page expects `totalPages`. As a result pagination is effectively disabled. Date filtering is client-side and applies only to the currently loaded page. The dashboard link `?status=pending` is not read into the page's initial filter.

Required fix:
- Return `totalPages = ceil(total / limit)` or calculate it consistently in the client.
- Move date-from/date-to filtering to the API using Kuwait-local boundaries converted to UTC.
- Read URL search parameters on initial load.
- Reset pagination before executing a search without using stale state.
- Export all rows matching server-side filters, not only the current client page.

### 12. Customer order experience is incomplete

Confirmed gaps:
- API returns no images.
- No customer invoice link.
- Only date is displayed, not time.
- No dedicated order detail page.
- No payment details, address, subtotal, shipping, coupon or tracking timeline.
- `item_count` counts order lines, not total quantities.
- “Reorder” button has no action.
- Status is represented mainly through icon/color instead of a clear label.

Required fix:
- Add `/account/orders/[id]` and `/account/orders/[id]/invoice`.
- Implement reorder with stock/price revalidation.
- Show a textual status and timeline.
- Return accurate item quantity totals.

## Permissions and navigation findings

### 13. Page permissions and API permissions are not aligned

The `/admin` proxy checks only admin/staff role. Granular permissions are mostly enforced at APIs. This creates pages that open but then fail, and it enables the invoice bypass described above.

Required fix:
- Map admin routes to permissions in the server-side route guard.
- Do not rely on hidden navigation links for authorization.
- Use one permission resolver across proxy/server pages/APIs.

### 14. Staff navigation can expose unauthorized destinations

The sidebar initially assumes role `admin` until `/api/admin/me` returns. Mobile bottom navigation is not permission-filtered. This can briefly show all links and can route staff to unauthorized pages.

Required fix:
- Start with an unknown/loading role, not admin.
- Filter desktop, drawer and mobile navigation with the same permission rules.
- Add a proper 403 page.

### 15. Duplicated and misleading navigation

The newsletter link appears under both Customers and Marketing. Parent marketing routes can also remain highlighted alongside nested routes due to broad `startsWith` matching.

Required fix:
- Keep each destination in one logical group or clearly label shortcuts.
- Use exact/path-segment active matching.

## Reporting and data consistency findings

### 16. Sales figures use different definitions

The dashboard sums `payment_status = paid`. The stats page uses `status = delivered`. Production currently contains a delivered-but-unpaid order and no paid orders, so the two pages can report different sales totals.

Required fix:
- Define canonical metrics: gross orders, paid revenue, fulfilled paid revenue, refunds, cancelled orders and COD receivables.
- Use shared SQL/RPC views for dashboard and stats.
- Show payment and fulfilment dimensions separately.

### 17. Payment/status timestamps and references are missing

The live orders table has only `created_at` and `updated_at`; there are no payment/status milestone timestamps. Add payment provider reference, paid/refunded timestamps and status transition audit data.

## Additional production issues

### 18. New-order push notification call is structurally unreliable

Checkout calls the protected `/api/admin/push/send` endpoint server-to-server without forwarding an authenticated admin session and ignores the HTTP response. Call the notification service directly or authenticate the internal request using a dedicated server secret.

### 19. Marketing screen contains unfinished channels

Email and SMS are displayed as “coming soon”. Treat incomplete capabilities as disabled/beta, remove them from production navigation, or complete their configuration and tests.

### 20. Supabase advisor findings

Security advisor findings include:
- RLS enabled without policies on `abandoned_carts`, `admin_users`, and `stock_notifications`.
- Mutable function `search_path` warnings.
- Public storage bucket listing policy.
- Leaked-password protection disabled.

Each finding needs an explicit keep/fix decision and regression verification.

## Required authenticated E2E matrix

Use dedicated non-production test identities stored as GitHub Actions secrets:

1. Full admin.
2. Staff with `orders` only.
3. Staff without `orders`.
4. Inactive staff.
5. Customer with at least one order.
6. Customer who does not own the tested order.

Test on Vercel Preview + Supabase development branch or isolated test data. Never run destructive admin tests against production.

## Recommended delivery order

1. Permission bypass and RPC security.
2. Payment initiation and email delivery.
3. Canonical timestamps/timezone and transactional order tracking.
4. Order-item image snapshots and customer invoices.
5. Admin order pagination/filtering and customer order detail/reorder.
6. Unified dashboard/statistics definitions.
7. Full authenticated Playwright suite and post-deployment production smoke checks.
