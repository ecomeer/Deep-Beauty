-- ==========================================
-- 00007_admin_rls_and_storage.sql
-- Admin RLS policies for write operations
-- ==========================================

-- Allow authenticated admins to write products
CREATE POLICY "admin_all_products" ON public.products
  FOR ALL USING (auth.role() = 'authenticated');

-- Allow authenticated admins to write categories
CREATE POLICY "admin_all_categories" ON public.categories
  FOR ALL USING (auth.role() = 'authenticated');

-- Allow authenticated admins to read/write orders
CREATE POLICY "admin_all_orders" ON public.orders
  FOR ALL USING (auth.role() = 'authenticated');

-- Allow authenticated admins to read/write order_items
CREATE POLICY "admin_all_order_items" ON public.order_items
  FOR ALL USING (auth.role() = 'authenticated');

-- Allow authenticated admins to write coupons
CREATE POLICY "admin_all_coupons" ON public.coupons
  FOR ALL USING (auth.role() = 'authenticated');

-- Allow authenticated admins to write settings
CREATE POLICY "admin_all_settings" ON public.settings
  FOR ALL USING (auth.role() = 'authenticated');

-- Allow public to read settings
CREATE POLICY "public_read_settings" ON public.settings
  FOR SELECT USING (true);
