-- ==========================================
-- 00006_flash_sales.sql
-- Flash sales table
-- ==========================================

CREATE TABLE IF NOT EXISTS public.flash_sales (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar             TEXT NOT NULL,
  discount_percentage NUMERIC(5, 2) NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  starts_at           TIMESTAMPTZ NOT NULL,
  ends_at             TIMESTAMPTZ NOT NULL,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  apply_to            TEXT NOT NULL DEFAULT 'all' CHECK (apply_to IN ('all', 'category', 'products')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ends_after_starts CHECK (ends_at > starts_at)
);

ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;

-- Anyone can read active flash sales
CREATE POLICY "public_read_flash_sales" ON public.flash_sales
  FOR SELECT USING (is_active = true AND starts_at <= now() AND ends_at >= now());

-- Authenticated (admin) can do everything
CREATE POLICY "admin_all_flash_sales" ON public.flash_sales
  FOR ALL USING (auth.role() = 'authenticated');
