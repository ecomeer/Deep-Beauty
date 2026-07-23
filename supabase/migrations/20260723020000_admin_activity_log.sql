-- Admin activity/audit log: a lightweight record of who changed what in the
-- dashboard. Written best-effort by the admin API routes via the service-role
-- client (which bypasses RLS); read back through the admin-gated
-- /api/admin/activity endpoint (also service-role). RLS is enabled with no
-- permissive policy so anon/authenticated clients can't read or write it
-- directly — only the service role (and superusers) can.

CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_activity_log_created_at_idx
  ON public.admin_activity_log (created_at DESC);

ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
-- No policies: RLS denies anon/authenticated by default; the service-role
-- client used by the admin API bypasses RLS.
