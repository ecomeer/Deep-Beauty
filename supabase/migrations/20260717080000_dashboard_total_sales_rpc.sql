-- /api/admin/dashboard fetched every paid order's `total` column into the
-- Node process just to sum it in JS (`salesData.reduce(...)`), scanning and
-- transferring the entire orders table on every dashboard load. Replace
-- with a single SQL aggregate.
CREATE OR REPLACE FUNCTION public.get_total_paid_sales()
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(SUM(total), 0) FROM public.orders WHERE payment_status = 'paid';
$$;

REVOKE ALL ON FUNCTION public.get_total_paid_sales() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_total_paid_sales() TO service_role;
