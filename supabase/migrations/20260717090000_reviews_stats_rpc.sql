-- /api/admin/stats fetched every review row (is_approved, rating) — for all
-- time, regardless of the requested period — just to count/average/bucket
-- them in JS. Replace with a single SQL aggregate that scales independently
-- of how many reviews exist.
CREATE OR REPLACE FUNCTION public.get_reviews_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'pending', COUNT(*) FILTER (WHERE is_approved = false),
    'approved', COUNT(*) FILTER (WHERE is_approved = true),
    'averageRating', COALESCE(ROUND(AVG(rating)::numeric, 1), 0),
    'ratingDistribution', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('star', star, 'count', cnt) ORDER BY star DESC), '[]'::jsonb)
      FROM (
        SELECT s.star, COUNT(r.rating) AS cnt
        FROM generate_series(1, 5) AS s(star)
        LEFT JOIN public.reviews r ON r.rating = s.star
        GROUP BY s.star
      ) dist
    )
  )
  FROM public.reviews;
$$;

REVOKE ALL ON FUNCTION public.get_reviews_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_reviews_stats() TO service_role;
