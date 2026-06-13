-- SQL-side aggregation for the admin "Customers" page. Previously the API
-- route fetched every row of `orders` and grouped/paginated in JS.
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
    WHERE p_search IS NULL OR p_search = '' OR
      customer_name  ILIKE '%' || p_search || '%' OR
      customer_phone ILIKE '%' || p_search || '%' OR
      customer_email ILIKE '%' || p_search || '%'
    GROUP BY COALESCE(customer_phone, customer_email, customer_name)
    ORDER BY SUM(total) DESC
    LIMIT p_page_size OFFSET (p_page - 1) * p_page_size
  ) page;

  SELECT COUNT(*) INTO v_total
  FROM (
    SELECT 1
    FROM orders
    WHERE p_search IS NULL OR p_search = '' OR
      customer_name  ILIKE '%' || p_search || '%' OR
      customer_phone ILIKE '%' || p_search || '%' OR
      customer_email ILIKE '%' || p_search || '%'
    GROUP BY COALESCE(customer_phone, customer_email, customer_name)
  ) groups;

  RETURN jsonb_build_object('customers', v_customers, 'total', v_total);
END;
$$;
