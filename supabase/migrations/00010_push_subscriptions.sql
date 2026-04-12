-- Push subscriptions table for PWA notifications
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint text UNIQUE NOT NULL,
  subscription text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Only admins can read/write
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_push_subscriptions" ON public.push_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
