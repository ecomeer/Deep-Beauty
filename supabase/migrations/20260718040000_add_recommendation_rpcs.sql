-- ============================================================
-- Recommendation system support: real per-product ratings (replacing the
-- fake hash-based stars used on related-product cards) and real
-- "frequently bought together" data driven by actual order co-purchases.
-- ============================================================

-- Batched rating aggregate for a set of products — mirrors the existing
-- get_reviews_stats() pattern but scoped per product instead of global.
CREATE OR REPLACE FUNCTION get_product_ratings(p_product_ids uuid[])
RETURNS TABLE (
  product_id uuid,
  average_rating numeric,
  review_count integer
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    r.product_id,
    ROUND(AVG(r.rating)::numeric, 1) AS average_rating,
    COUNT(*)::integer AS review_count
  FROM public.reviews r
  WHERE r.product_id = ANY(p_product_ids) AND r.is_approved = true
  GROUP BY r.product_id;
$$;

-- Products most often bought alongside the given product(s) in the same
-- order, excluding the given products themselves and anything inactive.
-- Falls back to an empty set when there isn't enough order history yet —
-- callers should layer a same-category/bestseller fallback on top.
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
    WHERE oi1.product_id = ANY(p_product_ids)
      AND oi2.product_id IS NOT NULL
      AND NOT (oi2.product_id = ANY(p_product_ids))
    GROUP BY oi2.product_id
  ) co ON co.product_id = p.id
  WHERE p.is_active = true AND p.stock_quantity > 0
  ORDER BY co.co_purchase_count DESC
  LIMIT p_limit;
$$;
