-- Phase 2 order item snapshots. These nullable columns are deliberately
-- additive/idempotent so historical rows remain valid and unrecoverable
-- product metadata is left explicit null instead of guessed.
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_sku text;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant_name text;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_image_url text;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_slug text;

UPDATE public.order_items oi
SET product_image_url = COALESCE(oi.product_image_url, NULLIF(p.images[1], '')),
    product_slug = COALESCE(oi.product_slug, p.slug)
FROM public.products p
WHERE oi.product_id = p.id
  AND (oi.product_image_url IS NULL OR oi.product_slug IS NULL);

CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_order jsonb, p_items jsonb, p_coupon_code text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SET search_path = public AS $$
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
    INSERT INTO public.order_items(order_id, product_id, product_name_ar, product_name_en, quantity, unit_price, total_price, product_image_url, product_slug, product_sku, variant_name)
    VALUES (v_order.id, (v_item->>'product_id')::uuid, v_item->>'product_name_ar', v_item->>'product_name_en', (v_item->>'quantity')::integer, (v_item->>'unit_price')::numeric, (v_item->>'total_price')::numeric, COALESCE(NULLIF(v_item->>'product_image_url', ''), '/images/product-placeholder.svg'), v_item->>'product_slug', v_item->>'product_sku', v_item->>'variant_name');
    SELECT stock_quantity INTO v_stock FROM public.products WHERE id = (v_item->>'product_id')::uuid FOR UPDATE;
    IF v_stock IS NULL OR v_stock < (v_item->>'quantity')::integer THEN RAISE EXCEPTION 'Insufficient stock for product %', v_item->>'product_name_ar'; END IF;
    UPDATE public.products SET stock_quantity = stock_quantity - (v_item->>'quantity')::integer WHERE id = (v_item->>'product_id')::uuid;
  END LOOP;
  RETURN to_jsonb(v_order);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_order_atomic(jsonb, jsonb, text) FROM anon, authenticated;
