-- Supabase security-advisor hardening.
--
-- IMPORTANT: this migration is committed for review only. It must be applied
-- to production separately after preview/QA approval.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Fix mutable search_path warnings without changing function behavior.
-- ---------------------------------------------------------------------------
ALTER FUNCTION public.increment_loyalty_points(uuid, integer)
  SET search_path = public;
ALTER FUNCTION public.validate_and_use_coupon(text, numeric)
  SET search_path = public;
ALTER FUNCTION public.get_admin_customers(text, integer, integer)
  SET search_path = public;
ALTER FUNCTION public.get_bestseller_products(integer)
  SET search_path = public;

-- ---------------------------------------------------------------------------
-- 2. Internal functions are called only by triggers or service-role API routes.
-- Remove inherited PUBLIC execution, then explicitly retain service_role.
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.decrement_stock(uuid, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, integer)
  TO service_role;

REVOKE EXECUTE ON FUNCTION public.increment_coupon_usage(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_coupon_usage(text)
  TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user()
  TO service_role;

REVOKE EXECUTE ON FUNCTION public.notify_order_status_change()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_order_status_change()
  TO service_role;

REVOKE EXECUTE ON FUNCTION public.rls_auto_enable()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable()
  TO service_role;

REVOKE EXECUTE ON FUNCTION public.increment_loyalty_points(uuid, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_loyalty_points(uuid, integer)
  TO service_role;

REVOKE EXECUTE ON FUNCTION public.validate_and_use_coupon(text, numeric)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_and_use_coupon(text, numeric)
  TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_admin_customers(text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_customers(text, integer, integer)
  TO service_role;

-- get_bestseller_products remains executable by anon/authenticated because the
-- public bestseller API intentionally uses a regular server Supabase client.
GRANT EXECUTE ON FUNCTION public.get_bestseller_products(integer)
  TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. is_admin() is used by RLS. Make it SECURITY INVOKER so it can only inspect
-- the caller's own users row, and limit admin policies to signed-in users.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
$$;

DO $$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        COALESCE(qual, '') ILIKE '%is_admin%'
        OR COALESCE(with_check, '') ILIKE '%is_admin%'
      )
  LOOP
    EXECUTE format(
      'ALTER POLICY %I ON %I.%I TO authenticated',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  END LOOP;
END
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. These tables are server-only. Explicit deny policies document that intent
-- and avoid leaving RLS enabled with no policies.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "server_only_abandoned_carts" ON public.abandoned_carts;
CREATE POLICY "server_only_abandoned_carts"
  ON public.abandoned_carts
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "server_only_admin_users" ON public.admin_users;
CREATE POLICY "server_only_admin_users"
  ON public.admin_users
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "server_only_stock_notifications" ON public.stock_notifications;
CREATE POLICY "server_only_stock_notifications"
  ON public.stock_notifications
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- ---------------------------------------------------------------------------
-- 5. product-images is a public bucket, so object URLs remain readable without
-- a broad SELECT policy. All uploads already go through supabaseAdmin.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read product-images" ON storage.objects;
DROP POLICY IF EXISTS "Service role upload product-images" ON storage.objects;

-- ---------------------------------------------------------------------------
-- 6. Cover foreign keys identified by the performance advisor. These indexes
-- improve joins/deletes and do not change application behavior.
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_order_tracking_created_by
  ON public.order_tracking(created_by);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id
  ON public.reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id
  ON public.wishlists(product_id);

COMMIT;
