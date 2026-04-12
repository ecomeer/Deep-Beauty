-- Marketing campaigns table
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('email', 'sms', 'push', 'social')),
  target_audience text DEFAULT 'all' CHECK (target_audience IN ('all', 'customers', 'vip', 'new')),
  content jsonb NOT NULL,
  scheduled_at timestamptz,
  sent_at timestamptz,
  is_active boolean DEFAULT true,
  sent_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_marketing_campaigns" ON public.marketing_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
