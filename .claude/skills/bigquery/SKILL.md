---
name: bigquery
description: Deep Beauty company context for the BigQuery plugin. Use whenever writing BigQuery SQL, building analytics/reports, or querying warehouse data for Deep Beauty — it defines our datasets, table schemas, currency/timezone rules, order lifecycle, and standard KPI queries.
---

# BigQuery @ Deep Beauty

Company-specific conventions that layer on top of the generic BigQuery plugin.
Deep Beauty is a Kuwait-based beauty e-commerce store (Next.js + Supabase).
The operational database is Supabase Postgres; BigQuery is the analytics
warehouse the Postgres tables are replicated into.

## Projects & datasets

- GCP project: `deep-beauty-analytics` (override with `BQ_PROJECT_ID` env var if set)
- Datasets:
  - `raw_supabase` — 1:1 replicas of Supabase `public.*` tables (source of truth for modeling)
  - `analytics` — modeled/derived tables and views (query these first for reporting)
  - `staging` — scratch space; anything here may be deleted
- Naming: tables `snake_case`, derived tables prefixed by grain, e.g.
  `analytics.daily_sales`, `analytics.monthly_customer_cohorts`.

If a dataset or table is missing, say so and show the query you would run —
never invent results.

## Non-negotiable data rules

- **Currency is KWD with 3 decimal places.** All money columns (`price`,
  `subtotal`, `shipping_cost`, `total`, `coupon_discount`, `unit_price`,
  `total_price`) are `NUMERIC` with 3 dp. Always `ROUND(x, 3)`; format as
  `12.500 KWD`. Never assume 2 decimals or USD.
- **Timezone is Asia/Kuwait (UTC+3).** Timestamps are stored in UTC.
  For any daily/weekly/monthly grouping use
  `DATE(created_at, 'Asia/Kuwait')` — never bare `DATE(created_at)`.
- **Bilingual fields.** Products/categories carry `name_ar` and `name_en`
  (also `description_*`, `ingredients_*`). Reports default to `name_en`
  with `name_ar` alongside when the output is customer- or admin-facing.
- **Revenue definition.** Recognized revenue = orders with
  `status NOT IN ('cancelled')` AND `payment_status = 'paid'`, plus
  delivered COD orders (`payment_method = 'cod' AND status = 'delivered'`).
  Gross sales = all non-cancelled orders regardless of payment.
  Label which definition a report uses.
- Always qualify tables fully: `project.dataset.table`.
- Cost guardrails: no `SELECT *` on `raw_supabase.orders`/`order_items`;
  filter partitioned tables on the partition column (`created_at` date);
  use a dry run for anything you expect to scan > 1 GB.

## Core tables (mirrored from Supabase)

`raw_supabase.orders` — one row per order:
`id (UUID)`, `order_number`, `customer_name`, `customer_email`,
`customer_phone`, Kuwait-style address (`address_area`, `address_block`,
`address_street`, `address_house`), `subtotal`, `shipping_cost`, `total`,
`status`, `payment_method` (`cod` | `knet` | `card`), `payment_status`
(`unpaid` | `paid` | `refunded`), `coupon_code`, `coupon_discount`,
`created_at`, `updated_at`.

Order lifecycle (from `lib/order-status.ts`, the single source of truth):
`pending → confirmed → processing → shipped → delivered`, with `cancelled`
reachable from any pre-shipped state. Active statuses:
`pending, confirmed, processing, shipped`. Terminal: `delivered, cancelled`.

`raw_supabase.order_items` — one row per line item:
`order_id`, `product_id`, `product_name_ar`, `product_name_en` (denormalized
at purchase time — use these for historical reporting, not a join to
products), `quantity`, `unit_price`, `total_price`.

`raw_supabase.products` — `name_ar/en`, `slug`, `price`, `compare_price`,
`category`, `stock_quantity`, `is_active`, `is_featured`, `weight_grams`.

Other replicated tables: `categories`, `coupons`, `flash_sales`,
`flash_sale_products`, `reviews`, `shipping_zones`, `order_tracking`,
`abandoned_carts`, `wishlists`, `newsletter_subscribers`,
`marketing_campaigns`, `profiles`, `user_addresses`, `stock_notifications`.

Customer identity: orders are keyed by `customer_phone` (guest checkout is
common); dedupe customers on normalized phone, falling back to email.

## Standard KPI queries

Daily sales (recognized revenue):

```sql
SELECT
  DATE(o.created_at, 'Asia/Kuwait') AS sale_date,
  COUNT(*) AS orders,
  ROUND(SUM(o.total), 3) AS revenue_kwd,
  ROUND(AVG(o.total), 3) AS aov_kwd,
  ROUND(SUM(o.coupon_discount), 3) AS discounts_kwd
FROM `deep-beauty-analytics.raw_supabase.orders` o
WHERE o.status != 'cancelled'
  AND (o.payment_status = 'paid'
       OR (o.payment_method = 'cod' AND o.status = 'delivered'))
  AND DATE(o.created_at, 'Asia/Kuwait') >= DATE_SUB(CURRENT_DATE('Asia/Kuwait'), INTERVAL 30 DAY)
GROUP BY sale_date
ORDER BY sale_date DESC;
```

Bestsellers (matches the storefront's "bestsellers" logic — units sold from
non-cancelled orders):

```sql
SELECT
  oi.product_id,
  ANY_VALUE(oi.product_name_en) AS name_en,
  ANY_VALUE(oi.product_name_ar) AS name_ar,
  SUM(oi.quantity) AS units_sold,
  ROUND(SUM(oi.total_price), 3) AS revenue_kwd
FROM `deep-beauty-analytics.raw_supabase.order_items` oi
JOIN `deep-beauty-analytics.raw_supabase.orders` o ON o.id = oi.order_id
WHERE o.status != 'cancelled'
GROUP BY oi.product_id
ORDER BY units_sold DESC
LIMIT 20;
```

Other recurring asks, built the same way: revenue by `address_area`
(delivery-zone performance), coupon ROI (`coupon_code` usage vs
`coupon_discount` given), payment-method mix (`cod` vs `knet`/card),
abandoned-cart recovery rate, flash-sale lift vs baseline.

## Reporting style

- Round money to 3 dp, label KWD, and state the date range and timezone.
- Comparisons default to same-period-prior (last 30 days vs previous 30).
- Weekend in Kuwait is Friday–Saturday; "weekly" reports run Sunday–Saturday.
