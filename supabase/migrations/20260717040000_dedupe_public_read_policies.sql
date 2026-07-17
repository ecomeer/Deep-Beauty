-- Consolidate overlapping RLS policies flagged by the performance advisor
-- (multiple_permissive_policies): each of these tables carried a separate
-- "admin FOR ALL" policy alongside a "public FOR SELECT" policy, so every
-- SELECT evaluated both. Fold admin access into the single SELECT policy
-- and keep admin writes as single-purpose INSERT/UPDATE/DELETE policies.

-- ─────────────────────────────────────────────────────────────────────────────
-- banners
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_banners" ON public.banners;
DROP POLICY IF EXISTS "public_read_banners" ON public.banners;

CREATE POLICY "banners_select" ON public.banners
  FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "banners_admin_insert" ON public.banners
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "banners_admin_update" ON public.banners
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "banners_admin_delete" ON public.banners
  FOR DELETE USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- categories
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_categories" ON public.categories;
DROP POLICY IF EXISTS "Categories are viewable by everyone." ON public.categories;

CREATE POLICY "categories_select" ON public.categories
  FOR SELECT USING (true);
CREATE POLICY "categories_admin_insert" ON public.categories
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "categories_admin_update" ON public.categories
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "categories_admin_delete" ON public.categories
  FOR DELETE USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- coupons
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_coupons" ON public.coupons;
DROP POLICY IF EXISTS "Coupons are viewable by everyone" ON public.coupons;

CREATE POLICY "coupons_select" ON public.coupons
  FOR SELECT USING (true);
CREATE POLICY "coupons_admin_insert" ON public.coupons
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "coupons_admin_update" ON public.coupons
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "coupons_admin_delete" ON public.coupons
  FOR DELETE USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- products
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_products" ON public.products;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.products;

CREATE POLICY "products_select" ON public.products
  FOR SELECT USING (true);
CREATE POLICY "products_admin_insert" ON public.products
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "products_admin_update" ON public.products
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "products_admin_delete" ON public.products
  FOR DELETE USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- settings
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_settings" ON public.settings;
DROP POLICY IF EXISTS "public_read_settings" ON public.settings;

CREATE POLICY "settings_select" ON public.settings
  FOR SELECT USING (true);
CREATE POLICY "settings_admin_insert" ON public.settings
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "settings_admin_update" ON public.settings
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "settings_admin_delete" ON public.settings
  FOR DELETE USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- shipping_zones
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Enable all access for admin" ON public.shipping_zones;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.shipping_zones;

CREATE POLICY "shipping_zones_select" ON public.shipping_zones
  FOR SELECT USING (true);
CREATE POLICY "shipping_zones_admin_insert" ON public.shipping_zones
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "shipping_zones_admin_update" ON public.shipping_zones
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "shipping_zones_admin_delete" ON public.shipping_zones
  FOR DELETE USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- reviews (also had an exact-duplicate SELECT policy from a stale migration)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "reviews: public read approved" ON public.reviews;
DROP POLICY IF EXISTS "Allow public read of approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow admin full access" ON public.reviews;
DROP POLICY IF EXISTS "Allow public to create reviews" ON public.reviews;

CREATE POLICY "reviews_select" ON public.reviews
  FOR SELECT USING (is_approved = true OR public.is_admin());
CREATE POLICY "reviews_insert" ON public.reviews
  FOR INSERT WITH CHECK (
    (product_id IS NOT NULL AND rating >= 1 AND rating <= 5)
    OR public.is_admin()
  );
CREATE POLICY "reviews_admin_update" ON public.reviews
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "reviews_admin_delete" ON public.reviews
  FOR DELETE USING (public.is_admin());
