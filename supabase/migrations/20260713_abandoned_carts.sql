-- Abandoned cart tracking: captures a snapshot once a guest/customer has
-- entered a valid phone number and has items in the cart during checkout,
-- so admins can follow up (WhatsApp) on carts that never converted.
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  recovered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abandoned_carts_phone ON abandoned_carts(customer_phone);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_recovered ON abandoned_carts(recovered, updated_at DESC);

-- Only ever accessed via the service-role client from server routes (the
-- public save endpoint and the admin list/dismiss endpoints) — no RLS
-- policies are needed since anon/authenticated never query this table
-- directly, but RLS is enabled defensively in case that changes.
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;
