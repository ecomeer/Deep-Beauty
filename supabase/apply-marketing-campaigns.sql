-- ============================================================
-- Migration: 00011_marketing_campaigns
-- Auto-generated for manual execution
-- Execute in Supabase Studio: https://supabase.com/dashboard
-- ============================================================

-- Marketing campaigns table
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('email', 'sms', 'push', 'social')),
  target_audience text DEFAULT 'all' CHECK (target_audience IN ('all', 'customers', 'vip', 'new')),
  content jsonb NOT NULL DEFAULT '{}',
  scheduled_at timestamptz,
  sent_at timestamptz,
  is_active boolean DEFAULT true,
  sent_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Add comments for documentation
COMMENT ON TABLE public.marketing_campaigns IS 'Marketing campaigns for email, SMS, push notifications, and social media';
COMMENT ON COLUMN public.marketing_campaigns.type IS 'Campaign type: email, sms, push, or social';
COMMENT ON COLUMN public.marketing_campaigns.target_audience IS 'Target audience: all, customers, vip, or new';
COMMENT ON COLUMN public.marketing_campaigns.content IS 'JSON content containing campaign details, templates, etc.';

-- RLS Policy
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_marketing_campaigns" ON public.marketing_campaigns;

CREATE POLICY "admin_marketing_campaigns" ON public.marketing_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_is_active ON public.marketing_campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_type ON public.marketing_campaigns(type);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_created_at ON public.marketing_campaigns(created_at DESC);

-- ============================================================
-- ✅ Migration complete! Table is ready for use.
-- ============================================================
