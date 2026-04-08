-- ==========================================
-- 00003_newsletter.sql
-- Newsletter subscribers table
-- ==========================================

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL UNIQUE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Only service_role (admin) can read subscribers
CREATE POLICY "admin_read_subscribers" ON public.newsletter_subscribers
  FOR SELECT USING (false);

-- Anyone can insert their own email (public subscribe)
CREATE POLICY "public_subscribe" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (true);
