CREATE OR REPLACE FUNCTION validate_and_use_coupon(
  p_code text,
  p_subtotal numeric
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_coupon coupons;
  v_discount numeric;
BEGIN
  -- Lock the coupon row
  SELECT * INTO v_coupon FROM coupons
  WHERE code = p_code AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_CODE';
  END IF;

  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN
    RAISE EXCEPTION 'EXPIRED';
  END IF;

  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.usage_count >= v_coupon.usage_limit THEN
    RAISE EXCEPTION 'LIMIT_REACHED';
  END IF;

  IF p_subtotal < v_coupon.min_order_amount THEN
    RAISE EXCEPTION 'MIN_AMOUNT:%', v_coupon.min_order_amount;
  END IF;

  -- Calculate discount
  IF v_coupon.type = 'percentage' THEN
    v_discount := (p_subtotal * v_coupon.value) / 100;
    IF v_coupon.max_discount_amount IS NOT NULL THEN
      v_discount := LEAST(v_discount, v_coupon.max_discount_amount);
    END IF;
  ELSE
    v_discount := v_coupon.value;
  END IF;

  RETURN jsonb_build_object(
    'code', v_coupon.code,
    'discount', v_discount,
    'type', v_coupon.type,
    'value', v_coupon.value
  );
END;
$$;
