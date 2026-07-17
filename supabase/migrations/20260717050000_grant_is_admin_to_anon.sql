-- The dedupe migration (20260717040000) references public.is_admin() inside
-- SELECT/INSERT policies that apply to the anon role (banners, reviews).
-- 20260717010000 revoked EXECUTE on is_admin() from anon, so those policy
-- evaluations raised a permission error for anon instead of just filtering
-- rows out. is_admin() is SECURITY INVOKER and only ever returns true for an
-- authenticated admin session, so granting anon execute is safe — it always
-- evaluates false for unauthenticated requests — and avoids splitting these
-- policies back into overlapping public/admin pairs.
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
