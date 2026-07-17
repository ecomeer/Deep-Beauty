-- The contact page form posted straight to /api/newsletter, which only
-- stores the email as a newsletter subscriber — the customer's name and
-- message were sent but never read, stored, or delivered to anyone.
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  email      text NOT NULL,
  message    text NOT NULL,
  is_read    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at DESC);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- No public policies: writes and reads go through supabaseAdmin
-- (service role) only, from /api/contact and the admin dashboard.
REVOKE ALL ON TABLE public.contact_messages FROM anon, authenticated;
