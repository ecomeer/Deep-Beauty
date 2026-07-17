
-- Performance indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_order_tracking_created_by ON public.order_tracking(created_by);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON public.wishlists(product_id);

-- Replace row policies with initplan-safe auth.uid() evaluation.
DROP POLICY IF EXISTS "admin_marketing_campaigns" ON public.marketing_campaigns;
CREATE POLICY "admin_marketing_campaigns"
  ON public.marketing_campaigns
  FOR ALL TO public
  USING (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE public.users.id = (SELECT auth.uid())
        AND public.users.role = 'admin'::text
    )
  );

DROP POLICY IF EXISTS "push_subscriptions_admin" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_admin"
  ON public.push_subscriptions
  FOR ALL TO public
  USING (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE public.users.id = (SELECT auth.uid())
        AND public.users.role = 'admin'::text
    )
  );

DROP POLICY IF EXISTS "notifications own select" ON public.notifications;
CREATE POLICY "notifications own select"
  ON public.notifications
  FOR SELECT TO public
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "notifications own update" ON public.notifications;
CREATE POLICY "notifications own update"
  ON public.notifications
  FOR UPDATE TO public
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_addresses own select" ON public.user_addresses;
CREATE POLICY "user_addresses own select"
  ON public.user_addresses
  FOR SELECT TO public
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_addresses own insert" ON public.user_addresses;
CREATE POLICY "user_addresses own insert"
  ON public.user_addresses
  FOR INSERT TO public
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_addresses own update" ON public.user_addresses;
CREATE POLICY "user_addresses own update"
  ON public.user_addresses
  FOR UPDATE TO public
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_addresses own delete" ON public.user_addresses;
CREATE POLICY "user_addresses own delete"
  ON public.user_addresses
  FOR DELETE TO public
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage their own wishlist" ON public.wishlists;
CREATE POLICY "Users can manage their own wishlist"
  ON public.wishlists
  FOR ALL TO public
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "wishlists: own read" ON public.wishlists;
CREATE POLICY "wishlists: own read"
  ON public.wishlists
  FOR SELECT TO public
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "wishlists: own insert" ON public.wishlists;
CREATE POLICY "wishlists: own insert"
  ON public.wishlists
  FOR INSERT TO public
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "wishlists: own update" ON public.wishlists;
CREATE POLICY "wishlists: own update"
  ON public.wishlists
  FOR UPDATE TO public
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "wishlists: own delete" ON public.wishlists;
CREATE POLICY "wishlists: own delete"
  ON public.wishlists
  FOR DELETE TO public
  USING ((SELECT auth.uid()) = user_id);
