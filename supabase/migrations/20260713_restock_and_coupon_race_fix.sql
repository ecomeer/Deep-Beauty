-- Restock inventory when an order is cancelled (previously permanent
-- stock loss: neither the customer self-cancel route nor the admin
-- status-change route restored stock_quantity).
--
-- SECURITY DEFINER is required so this can update stock_quantity despite
-- the public/service_role-only RLS policy on products — but that means
-- it must be explicitly revoked from anon/authenticated below, or any
-- client holding the anon key could call this RPC directly with an
-- arbitrary order id and inflate stock outside a real cancellation.
CREATE OR REPLACE FUNCTION public.restock_order_atomic(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_item record;
BEGIN
  FOR v_item IN
    SELECT product_id, quantity FROM public.order_items WHERE order_id = p_order_id
  LOOP
    UPDATE public.products
    SET stock_quantity = stock_quantity + v_item.quantity
    WHERE id = v_item.product_id;
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.restock_order_atomic(uuid) FROM anon, authenticated;

-- Close a TOCTOU race: validate_and_use_coupon locks + checks the usage
-- limit, but the increment previously happened in a separate, unlocked
-- RPC call after order creation — two concurrent checkouts could both
-- pass the limit check before either incremented. Fold the lock+check+
-- increment into create_order_atomic's single transaction so it either
-- commits together with the order (limit enforced) or rolls back
-- together with it (no coupon burned on a failed checkout).
--
-- This redefinition is based on the version from
-- 20260612_checkout_lock_order.sql, which locks product rows in
-- deterministic product_id order to avoid deadlocking with concurrent
-- checkouts that share products in a different cart order — that fix
-- must be preserved here, not just the earlier, unordered version.
CREATE OR REPLACE FUNCTION create_order_atomic(
  p_order jsonb,
  p_items jsonb,
  p_coupon_code text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_order orders;
  v_item jsonb;
  v_stock integer;
  v_coupon coupons;
BEGIN
  IF p_coupon_code IS NOT NULL THEN
    SELECT * INTO v_coupon FROM coupons WHERE code = p_coupon_code FOR UPDATE;
    IF FOUND THEN
      IF v_coupon.usage_limit IS NOT NULL AND v_coupon.usage_count >= v_coupon.usage_limit THEN
        RAISE EXCEPTION 'COUPON_LIMIT_REACHED';
      END IF;
      UPDATE coupons SET usage_count = usage_count + 1 WHERE code = p_coupon_code;
    END IF;
  END IF;

  -- Insert order
  INSERT INTO orders SELECT * FROM jsonb_populate_record(NULL::orders, p_order)
  RETURNING * INTO v_order;

  -- Insert items and decrement stock, locking products in product_id
  -- order (deterministic — see comment above) to avoid deadlocks.
  FOR v_item IN
    SELECT value FROM jsonb_array_elements(p_items) ORDER BY value->>'product_id'
  LOOP
    INSERT INTO order_items(order_id, product_id, product_name_ar, product_name_en, quantity, unit_price, total_price)
    VALUES (
      v_order.id,
      (v_item->>'product_id')::uuid,
      v_item->>'product_name_ar',
      v_item->>'product_name_en',
      (v_item->>'quantity')::integer,
      (v_item->>'unit_price')::numeric,
      (v_item->>'total_price')::numeric
    );

    -- Check and decrement stock with lock
    SELECT stock_quantity INTO v_stock FROM products WHERE id = (v_item->>'product_id')::uuid FOR UPDATE;
    IF v_stock IS NULL OR v_stock < (v_item->>'quantity')::integer THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_item->>'product_name_ar';
    END IF;
    UPDATE products SET stock_quantity = stock_quantity - (v_item->>'quantity')::integer
    WHERE id = (v_item->>'product_id')::uuid;
  END LOOP;

  RETURN to_jsonb(v_order);
END;
$$;
