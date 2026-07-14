-- Loyalty points balance per customer.
ALTER TABLE users ADD COLUMN IF NOT EXISTS loyalty_points INTEGER NOT NULL DEFAULT 0;

-- Back-in-stock notification requests. Not tied to a user account so a
-- guest can subscribe from the product page with just an email.
CREATE TABLE IF NOT EXISTS stock_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, email)
);
CREATE INDEX IF NOT EXISTS idx_stock_notifications_product ON stock_notifications(product_id, notified);
ALTER TABLE stock_notifications ENABLE ROW LEVEL SECURITY;

-- Tracks whether an automated recovery reminder has already been sent for
-- an abandoned cart, so the cron job doesn't email the same customer twice.
ALTER TABLE abandoned_carts ADD COLUMN IF NOT EXISTS reminded_at TIMESTAMPTZ;

-- Per-order record of loyalty points earned/redeemed, so a cancellation can
-- reverse exactly what that order affected (rather than recomputing from a
-- rate that may have since changed in settings).
ALTER TABLE orders ADD COLUMN IF NOT EXISTS loyalty_points_earned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS loyalty_points_redeemed INTEGER NOT NULL DEFAULT 0;

-- Atomic increment/decrement (p_delta may be negative) for loyalty_points —
-- used for awarding, refunding, and clawing back points outside the main
-- create_order_atomic transaction, without a separate read-then-write
-- race in the caller.
CREATE OR REPLACE FUNCTION increment_loyalty_points(p_user_id uuid, p_delta integer)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE users SET loyalty_points = GREATEST(0, loyalty_points + p_delta) WHERE id = p_user_id;
$$;
REVOKE EXECUTE ON FUNCTION increment_loyalty_points(uuid, integer) FROM anon, authenticated;
