-- ============================================================
-- Enable RLS on all public tables that had policies defined
-- but RLS was not actually turned on (security linter errors)
-- ============================================================

ALTER TABLE public.categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products     ENABLE ROW LEVEL SECURITY;

-- ─── Verify existing policies cover all needed access ────────
-- products: public read + service_role write (via supabaseAdmin)
-- categories: public read + service_role write
-- coupons: public read + service_role write
-- orders: insert by anyone (checkout uses service_role) + user read own
-- order_items: insert by anyone (checkout uses service_role)

-- Note: our backend uses SUPABASE_SERVICE_ROLE_KEY (supabaseAdmin)
-- which bypasses RLS entirely — so enabling RLS here does NOT
-- break any existing API routes. It only blocks direct PostgREST
-- requests that bypass the backend.
