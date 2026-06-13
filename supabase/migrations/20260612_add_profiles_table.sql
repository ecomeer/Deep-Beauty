-- Moves the `profiles` table (previously only in supabase/missing-tables.sql,
-- a manual dashboard script) into the regular migration set so it always
-- exists. `lib/auth-admin.ts` queries `profiles.role` on every admin request.
--
-- NOTE: on this project `public.profiles` and its RLS policies were already
-- created out-of-band (migration 20260418231710_auto_create_user_profile_on_signup),
-- but without a `role` column. The existing `on_auth_user_created` trigger
-- on `auth.users` calls `handle_new_user()`, which populates `public.users`
-- (a separate table) -- it must NOT be replaced here.
CREATE TABLE IF NOT EXISTS public.profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           text,
  full_name       text,
  phone           text,
  role            text DEFAULT 'customer',
  default_address jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'customer';

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles: own read" ON public.profiles;
CREATE POLICY "profiles: own read" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles: own upsert" ON public.profiles;
CREATE POLICY "profiles: own upsert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles: own update" ON public.profiles;
CREATE POLICY "profiles: own update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
