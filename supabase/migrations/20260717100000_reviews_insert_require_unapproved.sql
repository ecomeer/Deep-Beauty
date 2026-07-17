-- reviews_insert (20260717040000) validated product_id/rating but never
-- constrained is_approved, so a request straight to PostgREST with the
-- public anon key could insert a review with is_approved = true directly,
-- bypassing moderation entirely. The app's own /api/reviews route always
-- hardcodes is_approved: false, but RLS — not application code — is the
-- actual boundary against direct anon-key access.
DROP POLICY IF EXISTS "reviews_insert" ON public.reviews;
CREATE POLICY "reviews_insert" ON public.reviews
  FOR INSERT WITH CHECK (
    (
      product_id IS NOT NULL
      AND rating >= 1
      AND rating <= 5
      AND is_approved IS NOT TRUE
    )
    OR public.is_admin()
  );
