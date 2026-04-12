-- ==========================================
-- 00008_fix_admin_rls_policies.sql
-- Replace auth.role() = 'authenticated' with
-- a proper users.role = 'admin' check.
-- ==========================================

-- Helper function: returns true when the calling session
-- belongs to a user whose users.role = 'admin'.
-- SECURITY DEFINER + explicit search_path prevents injection.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
END;
$$;

-- ── products ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_products" ON public.products;
CREATE POLICY "admin_all_products" ON public.products
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── categories ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_categories" ON public.categories;
CREATE POLICY "admin_all_categories" ON public.categories
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── orders ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_orders" ON public.orders;
CREATE POLICY "admin_all_orders" ON public.orders
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── order_items ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_order_items" ON public.order_items;
CREATE POLICY "admin_all_order_items" ON public.order_items
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── coupons ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_coupons" ON public.coupons;
CREATE POLICY "admin_all_coupons" ON public.coupons
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── settings (public_read_settings SELECT policy stays intact) ────────────────
DROP POLICY IF EXISTS "admin_all_settings" ON public.settings;
CREATE POLICY "admin_all_settings" ON public.settings
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── reviews (was: FOR ALL TO authenticated USING (true)) ─────────────────────
DROP POLICY IF EXISTS "Allow admin full access" ON public.reviews;
CREATE POLICY "Allow admin full access" ON public.reviews
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── order_tracking ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Enable insert for admin only" ON public.order_tracking;
DROP POLICY IF EXISTS "Enable update for admin only" ON public.order_tracking;
DROP POLICY IF EXISTS "Enable delete for admin only" ON public.order_tracking;

CREATE POLICY "Enable insert for admin only" ON public.order_tracking
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Enable update for admin only" ON public.order_tracking
  FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Enable delete for admin only" ON public.order_tracking
  FOR DELETE
  USING (public.is_admin());
