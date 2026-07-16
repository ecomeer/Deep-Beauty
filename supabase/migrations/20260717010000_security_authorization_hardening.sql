-- Deep Beauty security hardening
-- 1) Close direct role/permission/loyalty writes from browser sessions.
-- 2) Restrict privileged RPCs to service_role.
-- 3) Make loyalty awards, cancellations, and stale-payment expiry atomic/idempotent.

-- ─────────────────────────────────────────────────────────────────────────────
-- Order lifecycle bookkeeping
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS loyalty_points_awarded boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_effects_reversed_at timestamptz;

-- Historical code awarded points immediately after order creation. Mark those
-- rows as already awarded so a later payment callback cannot award them twice.
UPDATE public.orders
SET loyalty_points_awarded = true
WHERE user_id IS NOT NULL
  AND loyalty_points_earned > 0
  AND loyalty_points_awarded = false;

-- Give existing unpaid online reservations an expiry so cleanup can release
-- their stock/coupon/points effects after this migration is deployed.
UPDATE public.orders
SET payment_expires_at = created_at + interval '30 minutes'
WHERE payment_method = 'online'
  AND payment_status <> 'paid'
  AND status = 'pending'
  AND payment_expires_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_pending_payment_expiry
  ON public.orders (payment_expires_at)
  WHERE payment_method = 'online'
    AND payment_status <> 'paid'
    AND status = 'pending';

-- ─────────────────────────────────────────────────────────────────────────────
-- Customer profile authorization boundary
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "profiles: own upsert" ON public.profiles;
DROP POLICY IF EXISTS "profiles: own update" ON public.profiles;

-- Profile changes are now performed by authenticated Next.js routes using the
-- service role and explicit field allowlists. Keep read-only self access.
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "profiles: own read" ON public.profiles;
CREATE POLICY "profiles: own read"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE OR REPLACE FUNCTION public.guard_users_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user <> 'service_role' THEN
    IF TG_OP = 'INSERT' THEN
      NEW.role := 'customer';
      NEW.is_active := true;
      NEW.loyalty_points := 0;
      NEW.permissions := '{}'::text[];
    ELSIF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.is_active IS DISTINCT FROM OLD.is_active
       OR NEW.loyalty_points IS DISTINCT FROM OLD.loyalty_points
       OR NEW.permissions IS DISTINCT FROM OLD.permissions
       OR NEW.email IS DISTINCT FROM OLD.email
       OR NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'PRIVILEGED_USER_FIELDS_ARE_SERVER_MANAGED';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_users_privileged_fields_trigger ON public.users;
CREATE TRIGGER guard_users_privileged_fields_trigger
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.guard_users_privileged_fields();

CREATE OR REPLACE FUNCTION public.guard_profiles_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user <> 'service_role' THEN
    IF TG_OP = 'INSERT' THEN
      NEW.role := 'customer';
    ELSIF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.id IS DISTINCT FROM OLD.id
       OR NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'PRIVILEGED_PROFILE_FIELDS_ARE_SERVER_MANAGED';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profiles_role_trigger ON public.profiles;
CREATE TRIGGER guard_profiles_role_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profiles_role();

-- The old policy authorized every signed-in user, not just admins. All admin
-- mutations already go through service-role API routes, so no direct write
-- policy is required here.
DROP POLICY IF EXISTS admin_all_flash_sales ON public.flash_sales;

-- ─────────────────────────────────────────────────────────────────────────────
-- Harden existing functions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = (SELECT auth.uid())
      AND role = 'admin'
      AND is_active = true
  );
$$;

ALTER FUNCTION public.increment_loyalty_points(uuid, integer)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.validate_and_use_coupon(text, numeric)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.get_admin_customers(text, integer, integer)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.get_bestseller_products(integer)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.create_order_atomic(jsonb, jsonb, text)
  SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_coupon_usage(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_loyalty_points(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_and_use_coupon(text, numeric) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_admin_customers(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_bestseller_products(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_order_atomic(jsonb, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.restock_order_atomic(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_order_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_users_privileged_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_profiles_role() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Atomic loyalty claim
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.claim_loyalty_points(
  p_user_id uuid,
  p_requested integer,
  p_maximum integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_balance integer;
  v_claimed integer;
BEGIN
  IF p_user_id IS NULL OR p_requested <= 0 OR p_maximum <= 0 THEN
    RETURN 0;
  END IF;

  SELECT loyalty_points
  INTO v_balance
  FROM public.users
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  v_claimed := LEAST(
    GREATEST(p_requested, 0),
    GREATEST(p_maximum, 0),
    GREATEST(COALESCE(v_balance, 0), 0)
  );

  IF v_claimed > 0 THEN
    UPDATE public.users
    SET loyalty_points = loyalty_points - v_claimed
    WHERE id = p_user_id;
  END IF;

  RETURN v_claimed;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_loyalty_points(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_loyalty_points(uuid, integer, integer) TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- Idempotent loyalty award after verified payment/delivery
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.award_order_loyalty_points(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_points integer;
BEGIN
  UPDATE public.orders
  SET loyalty_points_awarded = true,
      updated_at = now()
  WHERE id = p_order_id
    AND loyalty_points_awarded = false
    AND user_id IS NOT NULL
    AND loyalty_points_earned > 0
    AND (
      (payment_method = 'online' AND payment_status = 'paid')
      OR status = 'delivered'
    )
  RETURNING user_id, loyalty_points_earned
  INTO v_user_id, v_points;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE public.users
  SET loyalty_points = loyalty_points + v_points
  WHERE id = v_user_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.award_order_loyalty_points(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_order_loyalty_points(uuid) TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- Idempotent cancellation reversal
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cancel_order_effects_atomic(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_item record;
  v_points_delta integer;
BEGIN
  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND
     OR v_order.status <> 'cancelled'
     OR v_order.cancellation_effects_reversed_at IS NOT NULL THEN
    RETURN false;
  END IF;

  FOR v_item IN
    SELECT product_id, quantity
    FROM public.order_items
    WHERE order_id = p_order_id
    ORDER BY product_id
  LOOP
    UPDATE public.products
    SET stock_quantity = stock_quantity + v_item.quantity
    WHERE id = v_item.product_id;
  END LOOP;

  IF v_order.coupon_code IS NOT NULL THEN
    UPDATE public.coupons
    SET usage_count = GREATEST(0, usage_count - 1)
    WHERE code = v_order.coupon_code;
  END IF;

  v_points_delta := COALESCE(v_order.loyalty_points_redeemed, 0)
    - CASE WHEN v_order.loyalty_points_awarded
      THEN COALESCE(v_order.loyalty_points_earned, 0)
      ELSE 0
    END;

  IF v_order.user_id IS NOT NULL AND v_points_delta <> 0 THEN
    UPDATE public.users
    SET loyalty_points = GREATEST(0, loyalty_points + v_points_delta)
    WHERE id = v_order.user_id;
  END IF;

  UPDATE public.orders
  SET cancellation_effects_reversed_at = now(),
      loyalty_points_awarded = false,
      updated_at = now()
  WHERE id = p_order_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_order_effects_atomic(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_order_effects_atomic(uuid) TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- Release stale unpaid online reservations
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.expire_pending_online_orders(
  p_now timestamptz DEFAULT now()
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order_id uuid;
  v_expired integer := 0;
BEGIN
  FOR v_order_id IN
    UPDATE public.orders
    SET status = 'cancelled',
        updated_at = p_now
    WHERE payment_method = 'online'
      AND payment_status <> 'paid'
      AND status = 'pending'
      AND payment_expires_at IS NOT NULL
      AND payment_expires_at <= p_now
    RETURNING id
  LOOP
    PERFORM public.cancel_order_effects_atomic(v_order_id);
    v_expired := v_expired + 1;
  END LOOP;

  RETURN v_expired;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_pending_online_orders(timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_pending_online_orders(timestamptz) TO service_role;
