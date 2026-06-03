-- ============================================================
-- Security hardening — Supabase linter fixes
-- 1. Fix mutable search_path in SECURITY DEFINER functions
-- 2. Revoke PostgREST execution from internal/trigger functions
-- 3. Drop duplicate and overly-permissive INSERT policies
-- ============================================================

-- ─── 1. Recreate functions with SET search_path = public ─────

CREATE OR REPLACE FUNCTION public.decrement_stock(product_id UUID, qty INTEGER)
RETURNS void LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = GREATEST(0, stock_quantity - qty)
  WHERE id = product_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_coupon_usage(coupon_code TEXT)
RETURNS void LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.coupons
  SET usage_count = usage_count + 1
  WHERE code = coupon_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_product_rating(product_uuid UUID)
RETURNS TABLE (avg_rating NUMERIC, review_count INTEGER)
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(AVG(rating), 0)::NUMERIC(3,2),
    COUNT(*)::INTEGER
  FROM public.reviews
  WHERE product_id = product_uuid AND is_approved = true;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, name, email, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    'customer'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ─── 2. Revoke direct REST API execution from internal functions ──
-- These are only ever called by triggers or via supabaseAdmin (service_role).
-- REVOKE does NOT affect service_role — it always retains its privileges.

REVOKE EXECUTE ON FUNCTION public.decrement_stock(UUID, INTEGER)  FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_coupon_usage(TEXT)     FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_order_status_change()     FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_modified_column()         FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()       FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_product_rating(UUID)         FROM anon, authenticated;

-- is_admin() is referenced inside RLS USING clauses (runs as definer there).
-- Revoke direct PostgREST calls from anon; authenticated RLS still works.
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;

-- rls_auto_enable — internal utility, should not be callable via REST
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable'
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated';
  END IF;
END $$;

-- ─── 3. Fix overly-permissive INSERT policies ─────────────────

-- orders: all inserts use supabaseAdmin (service_role) which bypasses RLS
-- entirely. Removing the open anon INSERT policy blocks direct PostgREST abuse.
DROP POLICY IF EXISTS "Anyone can insert an order" ON public.orders;

-- order_items: same rationale — checkout always goes through service_role
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;

-- reviews: "reviews: anyone can insert" is a duplicate of
-- "Allow public to create reviews". Drop the duplicate (keep the original
-- since the reviews API uses the anon key and needs this policy).
DROP POLICY IF EXISTS "reviews: anyone can insert" ON public.reviews;
