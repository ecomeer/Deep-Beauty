-- Data-correctness: cancelled orders must not count toward revenue, customer
-- totals, or product-popularity rankings.
--
-- cancel_order_effects_atomic() (20260717010000) reverses stock/coupon/points
-- on cancellation but deliberately does NOT flip payment_status away from
-- 'paid'. So a paid-then-cancelled order stays payment_status='paid' and was
-- silently counted by get_total_paid_sales(); likewise cancelled orders'
-- line-items inflated bestseller / frequently-bought-together rankings and
-- their totals inflated per-customer spend. Add a `status <> 'cancelled'`
-- guard to each aggregate. Signatures, SECURITY, search_path, and grants are
-- preserved exactly from the originals.

-- ── Revenue (dashboard "total sales") ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_total_paid_sales()
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(SUM(total), 0)
  FROM public.orders
  WHERE payment_status = 'paid' AND status <> 'cancelled';
$$;

REVOKE ALL ON FUNCTION public.get_total_paid_sales() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_total_paid_sales() TO service_role;

-- ── Admin customers aggregate ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_admin_customers(
  p_search text DEFAULT NULL,
  p_page int DEFAULT 1,
  p_page_size int DEFAULT 50
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_customers jsonb;
  v_total integer;
BEGIN
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'full_name', full_name,
           'phone', phone,
           'email', email,
           'orders_count', orders_count,
           'total_spent', total_spent,
           'last_order_at', last_order_at
         )), '[]'::jsonb)
  INTO v_customers
  FROM (
    SELECT
      MAX(customer_name)  AS full_name,
      MAX(customer_phone) AS phone,
      MAX(customer_email) AS email,
      COUNT(*)            AS orders_count,
      SUM(total)          AS total_spent,
      MAX(created_at)     AS last_order_at
    FROM orders
    WHERE status <> 'cancelled' AND (
      p_search IS NULL OR p_search = '' OR
      customer_name  ILIKE '%' || p_search || '%' OR
      customer_phone ILIKE '%' || p_search || '%' OR
      customer_email ILIKE '%' || p_search || '%'
    )
    GROUP BY COALESCE(customer_phone, customer_email, customer_name)
    ORDER BY SUM(total) DESC
    LIMIT p_page_size OFFSET (p_page - 1) * p_page_size
  ) page;

  SELECT COUNT(*) INTO v_total
  FROM (
    SELECT 1
    FROM orders
    WHERE status <> 'cancelled' AND (
      p_search IS NULL OR p_search = '' OR
      customer_name  ILIKE '%' || p_search || '%' OR
      customer_phone ILIKE '%' || p_search || '%' OR
      customer_email ILIKE '%' || p_search || '%'
    )
    GROUP BY COALESCE(customer_phone, customer_email, customer_name)
  ) groups;

  RETURN jsonb_build_object('customers', v_customers, 'total', v_total);
END;
$$;

-- ── Bestsellers ranking ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_bestseller_products(p_limit int DEFAULT 4)
RETURNS SETOF products
LANGUAGE plpgsql
AS $$
DECLARE
  v_sold_count integer;
BEGIN
  SELECT COUNT(*) INTO v_sold_count
  FROM (
    SELECT oi.product_id
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN orders o ON o.id = oi.order_id
    WHERE p.is_active = true AND o.status <> 'cancelled'
    GROUP BY oi.product_id
  ) sold;

  IF v_sold_count > 0 THEN
    RETURN QUERY
    SELECT p.*
    FROM products p
    JOIN (
      SELECT oi.product_id, SUM(oi.quantity) AS total_sold
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status <> 'cancelled'
      GROUP BY oi.product_id
    ) s ON s.product_id = p.id
    WHERE p.is_active = true
    ORDER BY s.total_sold DESC
    LIMIT p_limit;
  ELSE
    RETURN QUERY
    SELECT p.*
    FROM products p
    WHERE p.is_active = true AND p.is_featured = true
    ORDER BY p.created_at DESC
    LIMIT p_limit;
  END IF;
END;
$$;

-- ── Frequently bought together ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_frequently_bought_together(p_product_ids uuid[], p_limit int DEFAULT 4)
RETURNS SETOF products
LANGUAGE sql
STABLE
AS $$
  SELECT p.*
  FROM public.products p
  JOIN (
    SELECT oi2.product_id, COUNT(DISTINCT oi1.order_id) AS co_purchase_count
    FROM public.order_items oi1
    JOIN public.order_items oi2
      ON oi2.order_id = oi1.order_id
     AND oi2.product_id <> oi1.product_id
    JOIN public.orders o ON o.id = oi1.order_id
    WHERE oi1.product_id = ANY(p_product_ids)
      AND oi2.product_id IS NOT NULL
      AND NOT (oi2.product_id = ANY(p_product_ids))
      AND o.status <> 'cancelled'
    GROUP BY oi2.product_id
  ) co ON co.product_id = p.id
  WHERE p.is_active = true AND p.stock_quantity > 0
  ORDER BY co.co_purchase_count DESC
  LIMIT p_limit;
$$;
