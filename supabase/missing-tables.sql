-- ============================================================
-- Deep Beauty — Missing Tables Migration
-- Run this in: Supabase Dashboard → SQL Editor
-- URL: https://supabase.com/dashboard/project/pmxbvbzdntlhxnftisek/sql
-- ============================================================


-- ─── 1. profiles ─────────────────────────────────────────────
-- Stores extra user data beyond what auth.users provides
CREATE TABLE IF NOT EXISTS public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text,
  full_name     text,
  phone         text,
  default_address jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own profile
CREATE POLICY "profiles: own read"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles: own upsert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles: own update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─── 2. wishlists ────────────────────────────────────────────
-- One row per (user, product) pair
CREATE TABLE IF NOT EXISTS public.wishlists (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id  uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wishlists: own read"   ON public.wishlists FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "wishlists: own insert" ON public.wishlists FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wishlists: own delete" ON public.wishlists FOR DELETE  USING (auth.uid() = user_id);


-- ─── 3. admin_users ──────────────────────────────────────────
-- Marks which auth.users are admins (checked by middleware)
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only service_role (backend) can read admin_users — no public policies
-- To add your first admin, run:
-- INSERT INTO public.admin_users (user_id) VALUES ('<your-user-uuid>');


-- ─── 4. Make sure orders has tap_charge_id column ────────────
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tap_charge_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for faster order lookup by user
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS orders_customer_email_idx ON public.orders(customer_email);


-- ─── 5. reviews — verify approvals setup ─────────────────────
-- (Table likely exists already, this just ensures RLS is on)
ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews: public read approved" ON public.reviews;
CREATE POLICY "reviews: public read approved"
  ON public.reviews FOR SELECT
  USING (is_approved = true);

DROP POLICY IF EXISTS "reviews: anyone can insert" ON public.reviews;
CREATE POLICY "reviews: anyone can insert"
  ON public.reviews FOR INSERT
  WITH CHECK (true);


-- ─── 6. Populate existing orders with user_id ────────────────
-- Links historical orders to auth users by email
UPDATE public.orders o
SET user_id = u.id
FROM auth.users u
WHERE o.customer_email = u.email
  AND o.user_id IS NULL;


-- ─── Done ─────────────────────────────────────────────────────
-- After running this:
-- 1. Add your first admin:
--    INSERT INTO public.admin_users (user_id) VALUES ('<uuid>');
-- 2. Add TAP_SECRET_KEY to .env.local when you receive the key.
-- 3. Run: npm run dev
