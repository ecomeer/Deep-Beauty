-- Order lifecycle milestones are UTC timestamptz values; presentation converts
-- them to Asia/Kuwait. Snapshot product data so historical orders do not depend
-- on a product remaining in the catalog.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS processing_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipped_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refunded_at timestamptz;

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_image_url text;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_slug text;

-- Re-define the already-deployed checkout RPC so new orders capture image and
-- slug snapshots without editing an earlier, potentially applied migration.
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_order jsonb, p_items jsonb, p_coupon_code text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE v_order public.orders; v_item jsonb; v_stock integer; v_coupon public.coupons;
BEGIN
  IF p_coupon_code IS NOT NULL THEN
    SELECT * INTO v_coupon FROM public.coupons WHERE code = p_coupon_code FOR UPDATE;
    IF FOUND THEN
      IF v_coupon.usage_limit IS NOT NULL AND v_coupon.usage_count >= v_coupon.usage_limit THEN RAISE EXCEPTION 'COUPON_LIMIT_REACHED'; END IF;
      UPDATE public.coupons SET usage_count = usage_count + 1 WHERE code = p_coupon_code;
    END IF;
  END IF;
  INSERT INTO public.orders SELECT * FROM jsonb_populate_record(NULL::public.orders, p_order) RETURNING * INTO v_order;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) ORDER BY value->>'product_id' LOOP
    INSERT INTO public.order_items(order_id, product_id, product_name_ar, product_name_en, quantity, unit_price, total_price, product_image_url, product_slug)
    VALUES (v_order.id, (v_item->>'product_id')::uuid, v_item->>'product_name_ar', v_item->>'product_name_en', (v_item->>'quantity')::integer, (v_item->>'unit_price')::numeric, (v_item->>'total_price')::numeric, COALESCE(v_item->>'product_image_url', '/images/product-placeholder.svg'), v_item->>'product_slug');
    SELECT stock_quantity INTO v_stock FROM public.products WHERE id = (v_item->>'product_id')::uuid FOR UPDATE;
    IF v_stock IS NULL OR v_stock < (v_item->>'quantity')::integer THEN RAISE EXCEPTION 'Insufficient stock for product %', v_item->>'product_name_ar'; END IF;
    UPDATE public.products SET stock_quantity = stock_quantity - (v_item->>'quantity')::integer WHERE id = (v_item->>'product_id')::uuid;
  END LOOP;
  RETURN to_jsonb(v_order);
END;
$$;

UPDATE public.order_items oi
SET product_image_url = COALESCE(NULLIF(p.images[1], ''), '/images/product-placeholder.svg'),
    product_slug = p.slug
FROM public.products p
WHERE oi.product_id = p.id AND oi.product_image_url IS NULL;

UPDATE public.order_items
SET product_image_url = '/images/product-placeholder.svg'
WHERE product_image_url IS NULL;

-- Every order gets exactly one initial event. The unique partial index makes
-- both retries and the migration backfill idempotent.
CREATE UNIQUE INDEX IF NOT EXISTS order_tracking_initial_event_idx
  ON public.order_tracking(order_id) WHERE status = 'pending' AND created_by IS NULL;

CREATE OR REPLACE FUNCTION public.order_status_label_ar(p_status text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE p_status
    WHEN 'pending' THEN 'قيد الانتظار'
    WHEN 'confirmed' THEN 'تم التأكيد'
    WHEN 'processing' THEN 'قيد المعالجة'
    WHEN 'shipped' THEN 'تم الشحن'
    WHEN 'delivered' THEN 'تم التوصيل'
    WHEN 'cancelled' THEN 'تم الإلغاء'
    ELSE p_status END
$$;

CREATE OR REPLACE FUNCTION public.order_status_label_en(p_status text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE p_status
    WHEN 'pending' THEN 'Pending'
    WHEN 'confirmed' THEN 'Confirmed'
    WHEN 'processing' THEN 'Processing'
    WHEN 'shipped' THEN 'Shipped'
    WHEN 'delivered' THEN 'Delivered'
    WHEN 'cancelled' THEN 'Cancelled'
    ELSE p_status END
$$;

CREATE OR REPLACE FUNCTION public.order_status_description_ar(p_status text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE p_status
    WHEN 'pending' THEN 'تم استلام طلبك وهو قيد المراجعة'
    WHEN 'confirmed' THEN 'تم تأكيد طلبك'
    WHEN 'processing' THEN 'طلبك قيد المعالجة حالياً'
    WHEN 'shipped' THEN 'تم شحن طلبك وهو في الطريق إليك'
    WHEN 'delivered' THEN 'تم توصيل طلبك بنجاح'
    WHEN 'cancelled' THEN 'تم إلغاء الطلب'
    ELSE 'تحديث حالة الطلب' END
$$;

INSERT INTO public.order_tracking (order_id, status, status_label_ar, status_label_en, description_ar, is_customer_visible)
SELECT o.id, 'pending', public.order_status_label_ar('pending'), public.order_status_label_en('pending'), public.order_status_description_ar('pending'), true
FROM public.orders o
WHERE NOT EXISTS (SELECT 1 FROM public.order_tracking t WHERE t.order_id = o.id);

CREATE OR REPLACE FUNCTION public.create_initial_order_tracking()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.order_tracking (order_id, status, status_label_ar, status_label_en, description_ar, is_customer_visible)
  VALUES (NEW.id, 'pending', public.order_status_label_ar('pending'), public.order_status_label_en('pending'), public.order_status_description_ar('pending'), true)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_created_tracking ON public.orders;
CREATE TRIGGER on_order_created_tracking AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.create_initial_order_tracking();
REVOKE EXECUTE ON FUNCTION public.create_initial_order_tracking() FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.transition_order_with_tracking(
  p_order_id uuid,
  p_expected_status text,
  p_new_status text,
  p_created_by uuid,
  p_description_ar text DEFAULT NULL,
  p_description_en text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_customer_visible boolean DEFAULT true
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_order public.orders;
BEGIN
  IF p_new_status NOT IN ('pending','confirmed','processing','shipped','delivered','cancelled') THEN
    RAISE EXCEPTION 'INVALID_STATUS';
  END IF;
  IF NOT ((p_expected_status = 'pending' AND p_new_status IN ('confirmed','cancelled')) OR
          (p_expected_status = 'confirmed' AND p_new_status IN ('processing','shipped','cancelled')) OR
          (p_expected_status = 'processing' AND p_new_status IN ('shipped','cancelled')) OR
          (p_expected_status = 'shipped' AND p_new_status = 'delivered')) THEN
    RAISE EXCEPTION 'INVALID_TRANSITION';
  END IF;

  UPDATE public.orders
  SET status = p_new_status,
      confirmed_at = CASE WHEN p_new_status = 'confirmed' AND confirmed_at IS NULL THEN now() ELSE confirmed_at END,
      processing_at = CASE WHEN p_new_status = 'processing' AND processing_at IS NULL THEN now() ELSE processing_at END,
      shipped_at = CASE WHEN p_new_status = 'shipped' AND shipped_at IS NULL THEN now() ELSE shipped_at END,
      delivered_at = CASE WHEN p_new_status = 'delivered' AND delivered_at IS NULL THEN now() ELSE delivered_at END,
      cancelled_at = CASE WHEN p_new_status = 'cancelled' AND cancelled_at IS NULL THEN now() ELSE cancelled_at END
  WHERE id = p_order_id AND status = p_expected_status
  RETURNING * INTO v_order;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_CHANGED'; END IF;

  INSERT INTO public.order_tracking (order_id, status, status_label_ar, status_label_en, description_ar, description_en, location, is_customer_visible, created_by)
  VALUES (p_order_id, p_new_status, public.order_status_label_ar(p_new_status), public.order_status_label_en(p_new_status), COALESCE(p_description_ar, public.order_status_description_ar(p_new_status)), p_description_en, p_location, p_customer_visible, p_created_by);
  RETURN to_jsonb(v_order);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.transition_order_with_tracking(uuid,text,text,uuid,text,text,text,boolean) FROM anon, authenticated;

-- Checkout/admin-only RPCs must never be callable with a public key.
REVOKE EXECUTE ON FUNCTION public.create_order_atomic(jsonb, jsonb, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_and_use_coupon(text, numeric) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_loyalty_points(uuid, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_admin_customers(integer, integer, text) FROM anon, authenticated;
