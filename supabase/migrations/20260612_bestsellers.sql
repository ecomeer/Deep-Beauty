-- Real bestsellers ranking based on order history, falling back to
-- is_featured products when there's no order history yet.
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
    WHERE p.is_active = true
    GROUP BY oi.product_id
  ) sold;

  IF v_sold_count > 0 THEN
    RETURN QUERY
    SELECT p.*
    FROM products p
    JOIN (
      SELECT product_id, SUM(quantity) AS total_sold
      FROM order_items
      GROUP BY product_id
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
