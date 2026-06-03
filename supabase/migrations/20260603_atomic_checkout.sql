CREATE OR REPLACE FUNCTION create_order_atomic(
  p_order jsonb,
  p_items jsonb
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_order orders;
  v_item jsonb;
  v_stock integer;
BEGIN
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
