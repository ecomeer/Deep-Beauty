-- Restock inventory when an order is cancelled (previously permanent
-- stock loss: neither the customer self-cancel route nor the admin
-- status-change route restored stock_quantity).
CREATE OR REPLACE FUNCTION public.restock_order_atomic(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Close a TOCTOU race: validate_and_use_coupon locks + checks the usage
-- limit, but the increment previously happened in a separate, unlocked
-- RPC call after order creation — two concurrent checkouts could both
-- pass the limit check before either incremented. Fold the lock+check+
-- increment into create_order_atomic's single transaction so it either
-- commits together with the order (limit enforced) or rolls back
-- together with it (no coupon burned on a failed checkout).
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

  -- Insert items and decrement stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
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
    IF v_stock < (v_item->>'quantity')::integer THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_item->>'product_name_ar';
    END IF;
    UPDATE products SET stock_quantity = stock_quantity - (v_item->>'quantity')::integer
    WHERE id = (v_item->>'product_id')::uuid;
  END LOOP;

  RETURN to_jsonb(v_order);
END;
$$;
