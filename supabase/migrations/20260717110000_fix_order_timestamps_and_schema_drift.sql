-- jsonb_populate_record(NULL::orders, p_order) sets any orders column absent
-- from p_order to NULL, bypassing the column's `now()` DEFAULT entirely.
-- app/api/checkout/route.ts never included created_at/updated_at in the
-- payload it builds, so every order created through checkout got NULL for
-- both -- 14 of 32 existing orders, confirmed via direct query. Surfaced as
-- "1 يناير 1970" (Unix epoch) on invoice PDFs, since `new Date(null)` is
-- epoch 0.
CREATE OR REPLACE FUNCTION public.create_order_atomic_secure(p_order jsonb, p_items jsonb, p_coupon_code text, p_requested_points integer, p_kwd_per_point numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_order public.orders;
  v_item jsonb;
  v_stock integer;
  v_coupon public.coupons;
  v_user_id uuid;
  v_balance integer;
  v_claimed integer := 0;
  v_maximum integer := 0;
  v_base_total numeric;
  v_points_discount numeric := 0;
  v_product_spend numeric;
BEGIN
  IF p_coupon_code IS NOT NULL THEN
    SELECT * INTO v_coupon FROM public.coupons WHERE code = p_coupon_code FOR UPDATE;
    IF NOT FOUND OR v_coupon.is_active = false THEN RAISE EXCEPTION 'INVALID_CODE'; END IF;
    IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN RAISE EXCEPTION 'EXPIRED'; END IF;
    IF v_coupon.usage_limit IS NOT NULL AND v_coupon.usage_count >= v_coupon.usage_limit THEN RAISE EXCEPTION 'COUPON_LIMIT_REACHED'; END IF;
    UPDATE public.coupons SET usage_count = usage_count + 1 WHERE code = p_coupon_code;
  END IF;

  v_user_id := NULLIF(p_order->>'user_id', '')::uuid;
  v_base_total := COALESCE(NULLIF(p_order->>'total', '')::numeric, 0);
  v_product_spend := GREATEST(0, COALESCE(NULLIF(p_order->>'subtotal', '')::numeric, 0) - COALESCE(NULLIF(p_order->>'coupon_discount', '')::numeric, 0));

  IF v_user_id IS NOT NULL AND p_requested_points > 0 AND p_kwd_per_point > 0 THEN
    SELECT loyalty_points INTO v_balance FROM public.users WHERE id = v_user_id FOR UPDATE;
    IF FOUND THEN
      v_maximum := FLOOR(v_product_spend / p_kwd_per_point)::integer;
      v_claimed := LEAST(GREATEST(p_requested_points, 0), GREATEST(v_maximum, 0), GREATEST(COALESCE(v_balance, 0), 0));
      IF v_claimed > 0 THEN UPDATE public.users SET loyalty_points = loyalty_points - v_claimed WHERE id = v_user_id; END IF;
    END IF;
  END IF;

  v_points_discount := ROUND(v_claimed * GREATEST(p_kwd_per_point, 0), 3);
  p_order := jsonb_set(p_order, '{loyalty_points_redeemed}', to_jsonb(v_claimed), true);
  p_order := jsonb_set(p_order, '{total}', to_jsonb(GREATEST(0, v_base_total - v_points_discount)), true);

  -- jsonb_populate_record treats an absent key as an explicit NULL, not
  -- "use the column default" -- restore the now() defaults for any caller
  -- that didn't set these explicitly.
  IF NOT (p_order ? 'created_at') OR p_order->>'created_at' IS NULL THEN
    p_order := jsonb_set(p_order, '{created_at}', to_jsonb(now()), true);
  END IF;
  IF NOT (p_order ? 'updated_at') OR p_order->>'updated_at' IS NULL THEN
    p_order := jsonb_set(p_order, '{updated_at}', to_jsonb(now()), true);
  END IF;

  INSERT INTO public.orders SELECT * FROM jsonb_populate_record(NULL::public.orders, p_order) RETURNING * INTO v_order;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) ORDER BY value->>'product_id'
  LOOP
    SELECT stock_quantity INTO v_stock FROM public.products WHERE id = (v_item->>'product_id')::uuid FOR UPDATE;
    IF v_stock IS NULL OR v_stock < (v_item->>'quantity')::integer THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_item->>'product_name_ar';
    END IF;
    INSERT INTO public.order_items(order_id, product_id, product_name_ar, product_name_en, quantity, unit_price, total_price)
    VALUES (v_order.id, (v_item->>'product_id')::uuid, v_item->>'product_name_ar', v_item->>'product_name_en', (v_item->>'quantity')::integer, (v_item->>'unit_price')::numeric, (v_item->>'total_price')::numeric);
    UPDATE public.products SET stock_quantity = stock_quantity - (v_item->>'quantity')::integer WHERE id = (v_item->>'product_id')::uuid;
  END LOOP;
  RETURN to_jsonb(v_order);
END;
$function$;

-- Backfill the 14 existing orders stuck at NULL created_at. Exact time
-- isn't recoverable, but the order number reliably embeds the creation
-- date (DB-YYYYMMDD-nnnn or UPAY-YYYYMMDD######) -- use noon UTC that day
-- so display/sort order is correct even though the hour is approximate.
UPDATE public.orders
SET created_at = to_timestamp(substring(order_number FROM '(\d{8})'), 'YYYYMMDD') + interval '12 hours',
    updated_at = COALESCE(updated_at, to_timestamp(substring(order_number FROM '(\d{8})'), 'YYYYMMDD') + interval '12 hours')
WHERE created_at IS NULL AND order_number ~ '\d{8}';

-- coupons.description_ar: selected/inserted by app/api/admin/coupons/route.ts
-- (the admin coupon form has always had a description field) but the
-- column was never migrated in -- every load/create of the coupons admin
-- page has been failing with "column coupons.description_ar does not exist".
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS description_ar text;

-- newsletter_subscribers.name/is_active: app/api/admin/newsletter and its
-- [id] send_campaign action select/filter on both, but 00003_newsletter.sql
-- only ever created id/email/created_at -- the newsletter admin page and
-- campaign sends have been failing outright.
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- categories.updated_at: app/sitemap.ts selects it (same shape as the
-- products query beside it) but it was never added, so every sitemap
-- build silently dropped category URLs after hitting this error.
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
DROP TRIGGER IF EXISTS update_categories_modtime ON public.categories;
CREATE TRIGGER update_categories_modtime
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
