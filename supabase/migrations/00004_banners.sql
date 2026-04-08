-- ==========================================
-- 00004_banners.sql
-- Hero/promotional banners table
-- ==========================================

CREATE TABLE IF NOT EXISTS public.banners (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar    text NOT NULL,
  subtitle_ar text,
  image_url   text NOT NULL,
  link_url    text DEFAULT '/products',
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Public can read active banners
CREATE POLICY "public_read_banners" ON public.banners
  FOR SELECT USING (is_active = true);

-- Authenticated (admin) can do everything
CREATE POLICY "admin_all_banners" ON public.banners
  FOR ALL USING (auth.role() = 'authenticated');
